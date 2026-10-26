"""Bootstrap and verify the private development S3 instance; never print keys."""
import base64
import hashlib
import json
import os
from pathlib import Path
import secrets
import sys
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.config import Config
from botocore.credentials import Credentials
from botocore.exceptions import ClientError

BASE = Path.home() / "Library/ExportTradeLocal"
ENDPOINT = "http://127.0.0.1:9000"
BUCKETS = ["export-trade-staging", "export-trade-files", "export-trade-evidence"]
CONFIG = Config(
    signature_version="s3v4", s3={"addressing_style": "path"},
    connect_timeout=3, read_timeout=30, retries={"total_max_attempts": 1},
    request_checksum_calculation="when_required", response_checksum_validation="when_required",
)


def root_credentials():
    values = dict(line.split("=", 1) for line in (BASE / "rustfs.env").read_text().splitlines() if line)
    return values["RUSTFS_ACCESS_KEY"], values["RUSTFS_SECRET_KEY"]


def client(key, secret):
    return boto3.client("s3", endpoint_url=ENDPOINT, region_name="us-east-1",
                        aws_access_key_id=key, aws_secret_access_key=secret, config=CONFIG)


def admin(method, resource, payload, key, secret):
    body = json.dumps(payload).encode()
    request = AWSRequest(method=method, url=ENDPOINT + "/rustfs/admin/v3/" + resource,
                         data=body, headers={"Content-Type": "application/json",
                                             "x-amz-content-sha256": hashlib.sha256(body).hexdigest()})
    SigV4Auth(Credentials(key, secret), "s3", "us-east-1").add_auth(request)
    with urlopen(Request(request.url, data=body, headers=dict(request.headers), method=method), timeout=30) as response:
        return response.read()


def initialize():
    key, secret = root_credentials()
    root = client(key, secret)
    existing = {bucket["Name"] for bucket in root.list_buckets()["Buckets"]}
    for bucket in BUCKETS:
        if bucket not in existing:
            root.create_bucket(Bucket=bucket, ObjectLockEnabledForBucket=bucket != BUCKETS[0])
        root.put_bucket_versioning(Bucket=bucket, VersioningConfiguration={"Status": "Enabled"})
        if bucket != BUCKETS[0]:
            assert root.get_object_lock_configuration(Bucket=bucket)["ObjectLockConfiguration"]["ObjectLockEnabled"] == "Enabled"
    credentials_file = BASE / "s3-client.json"
    if not credentials_file.exists():
        app_key, app_secret = "exporttrade" + secrets.token_hex(8), secrets.token_hex(32)
        policy = {
            "Version": "2012-10-17", "Statement": [
                {"Effect": "Allow", "Action": ["s3:ListBucket", "s3:GetBucketLocation", "s3:GetBucketVersioning"],
                 "Resource": ["arn:aws:s3:::" + bucket for bucket in BUCKETS]},
                {"Effect": "Allow", "Action": [
                    "s3:GetObject", "s3:GetObjectVersion", "s3:PutObject", "s3:PutObjectRetention",
                    "s3:GetObjectRetention", "s3:AbortMultipartUpload", "s3:ListMultipartUploadParts"
                ], "Resource": ["arn:aws:s3:::" + bucket + "/*" for bucket in BUCKETS]},
                {"Effect": "Allow", "Action": ["s3:DeleteObject", "s3:DeleteObjectVersion"],
                 "Resource": ["arn:aws:s3:::" + BUCKETS[0] + "/*"]},
                {"Effect": "Deny", "Action": ["s3:DeleteObject", "s3:DeleteObjectVersion", "s3:BypassGovernanceRetention"],
                 "Resource": ["arn:aws:s3:::" + bucket + "/*" for bucket in BUCKETS[1:]]}
            ]
        }
        # The embedded policy restricts this derived root service account.
        admin("PUT", "add-service-account", {
            "accessKey": app_key, "secretKey": app_secret, "policy": policy,
            "name": "export-trade-local-app", "description": "Local development only"
        }, key, secret)
        credentials = {"endpoint": ENDPOINT, "region": "us-east-1",
                       "access_key": app_key, "secret_key": app_secret, "buckets": BUCKETS}
        fd = os.open(credentials_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as target:
            json.dump(credentials, target, indent=2)
            target.write("\n")
    print("S3: 3 private, versioned buckets; files/evidence object lock enabled; scoped app credentials saved.")


def denied(action, expected):
    try:
        action()
    except ClientError as error:
        assert error.response["Error"]["Code"] in expected, error.response["Error"]["Code"]
    else:
        raise AssertionError("Expected request to be rejected")


def verify():
    key, secret = root_credentials()
    root = client(key, secret)
    credentials = json.loads((BASE / "s3-client.json").read_text())
    app = client(credentials["access_key"], credentials["secret_key"])
    versions = []
    name = "_infra-check/" + secrets.token_hex(16)
    data = b"export-trade local infrastructure self-test\n"
    try:
        for bucket in BUCKETS:
            assert root.get_bucket_versioning(Bucket=bucket)["Status"] == "Enabled"
        result = app.put_object(Bucket=BUCKETS[0], Key=name, Body=data, IfNoneMatch="*",
                                Metadata={"sha256": hashlib.sha256(data).hexdigest()})
        version = result["VersionId"]
        versions.append((BUCKETS[0], version, False))
        assert app.get_object(Bucket=BUCKETS[0], Key=name, VersionId=version)["Body"].read() == data
        denied(lambda: app.put_object(Bucket=BUCKETS[0], Key=name, Body=b"conflict", IfNoneMatch="*"), {"PreconditionFailed", "ConditionalRequestConflict"})
        retained_until = datetime.now(timezone.utc) + timedelta(minutes=2)
        result = app.put_object(
            Bucket=BUCKETS[2], Key=name, Body=data, IfNoneMatch="*",
            ContentMD5=base64.b64encode(hashlib.md5(data).digest()).decode(),
            ObjectLockMode="GOVERNANCE", ObjectLockRetainUntilDate=retained_until,
        )
        version = result["VersionId"]
        versions.append((BUCKETS[2], version, True))
        retention = root.get_object_retention(Bucket=BUCKETS[2], Key=name, VersionId=version)["Retention"]
        assert retention["Mode"] == "GOVERNANCE"
        denied(lambda: root.delete_object(Bucket=BUCKETS[2], Key=name, VersionId=version), {"AccessDenied"})
        denied(lambda: app.delete_object(Bucket=BUCKETS[2], Key=name, VersionId=version, BypassGovernanceRetention=True), {"AccessDenied"})
        denied(lambda: app.create_bucket(Bucket="forbidden-" + secrets.token_hex(8)), {"AccessDenied"})
        try:
            with urlopen(ENDPOINT + "/" + BUCKETS[0] + "/" + name, timeout=5):
                raise AssertionError("Anonymous read unexpectedly succeeded")
        except HTTPError as error:
            assert error.code == 403
    finally:
        for bucket, version, locked in versions:
            root.delete_object(Bucket=bucket, Key=name, VersionId=version, **({"BypassGovernanceRetention": True} if locked else {}))
    print("S3: exact-version read, conditional no-overwrite, retention, app restrictions and anonymous denial verified.")


if __name__ == "__main__":
    if sys.argv[1:] == ["init"]:
        initialize()
    elif sys.argv[1:] == ["verify"]:
        verify()
    else:
        raise SystemExit("Usage: s3.py init|verify")
