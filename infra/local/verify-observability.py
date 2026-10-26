"""End-to-end local probes; no business job is created or executed."""
import base64
import json
import secrets
import subprocess
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import HTTPCookieProcessor, Request, build_opener, urlopen
import http.cookiejar

BASE = Path.home() / "Library/ExportTradeLocal"
CREDS = json.loads((BASE / "observability-credentials.json").read_text())
assert 4 <= len(CREDS["scheduler"]["password"]) <= 20, "Password must fit XXL-JOB browser login"
DOCKER = ["docker", "--context", "colima"]


def request(url, data=None, headers=None, opener=None):
    encoded = None if data is None else json.dumps(data).encode()
    hdrs = {"Content-Type": "application/json", **(headers or {})}
    operation = Request(url, data=encoded, headers=hdrs)
    with (opener.open(operation, timeout=15) if opener else urlopen(operation, timeout=15)) as response:
        body = response.read()
        return json.loads(body) if body else None


def wait_for(check, description, timeout=120):
    deadline = time.monotonic() + timeout
    while True:
        if check():
            return
        if time.monotonic() >= deadline:
            raise AssertionError("Timeout: " + description)
        time.sleep(3)


def prometheus(query):
    result = request("http://127.0.0.1:9090/api/v1/query?" + urlencode({"query": query}))
    assert result["status"] == "success"
    return result["data"]["result"]


wait_for(lambda: len(prometheus("up")) == 10 and all(float(row["value"][1]) == 1 for row in prometheus("up")), "10 metrics targets healthy")
wait_for(lambda: len(prometheus("probe_success")) == 4 and all(float(row["value"][1]) == 1 for row in prometheus("probe_success")), "four real service probes")
rules = request("http://127.0.0.1:9090/api/v1/rules")["data"]["groups"]
assert sum(len(group["rules"]) for group in rules) == 3

gf = CREDS["grafana"]
auth = base64.b64encode((gf["username"] + ":" + gf["password"]).encode()).decode()
headers = {"Authorization": "Basic " + auth}
for uid in ["prometheus", "loki"]:
    health = request("http://127.0.0.1:3000/api/datasources/uid/" + uid + "/health", headers=headers)
    assert health["status"] == "OK", uid + " datasource unavailable"
# Grafana's Alertmanager plugin is frontend-only; validate its real proxy API instead.
assert "versionInfo" in request(
    "http://127.0.0.1:3000/api/datasources/proxy/uid/alertmanager/api/v2/status", headers=headers)
try:
    request("http://127.0.0.1:3000/api/datasources")
    raise AssertionError("Anonymous Grafana administration allowed")
except HTTPError as error:
    assert error.code == 401

jar = http.cookiejar.CookieJar()
opener = build_opener(HTTPCookieProcessor(jar))
login_url = "http://127.0.0.1:8080/xxl-job-admin/auth/doLogin"
form = urlencode({"userName": CREDS["scheduler"]["username"], "password": CREDS["scheduler"]["password"]}).encode()
with opener.open(Request(login_url, data=form), timeout=15) as response:
    login = json.load(response)
assert login["code"] == 200, "XXL-JOB login failed"
assert list(jar), "Scheduler did not establish authenticated session"
with urlopen(Request(login_url, data=urlencode({"userName": "admin", "password": "123456"}).encode()), timeout=15) as response:
    assert json.load(response)["code"] != 200, "Upstream default password still active"
with opener.open("http://127.0.0.1:8080/xxl-job-admin/", timeout=15) as response:
    assert response.status == 200
request("http://127.0.0.1:8080/xxl-job-admin/auth/logout", data={}, opener=opener)

alert_name = "LocalInfrastructureSelfTest"
now = datetime.now(timezone.utc)
alert = {"labels": {"alertname": alert_name, "severity": "info", "environment": "local"},
         "annotations": {"summary": "Bounded local routing test"},
         "startsAt": now.isoformat(), "endsAt": (now + timedelta(minutes=2)).isoformat()}
try:
    request("http://127.0.0.1:9093/api/v2/alerts", [alert])
    wait_for(lambda: any(group["receiver"]["name"] == "local-ui" and
                        any(item["labels"]["alertname"] == alert_name for item in group["alerts"])
                        for group in request("http://127.0.0.1:9093/api/v2/alerts/groups")), "local alert routing")
finally:
    alert["endsAt"] = datetime.now(timezone.utc).isoformat()
    request("http://127.0.0.1:9093/api/v2/alerts", [alert])

name = "export-trade-log-check-" + secrets.token_hex(6)
marker = "infra-log-check-" + secrets.token_hex(8)
fake_password = "not-a-real-secret-" + secrets.token_hex(8)
try:
    subprocess.run(DOCKER + [
        "run", "-d", "--name", name,
        "--label", "com.docker.compose.project=export-trade-local",
        "--label", "com.docker.compose.service=infra-selftest",
        "--entrypoint", "/bin/sh",
        "prom/prometheus@sha256:6927e0919a144aa7616fd0137d4816816d42f6b816de3af269ab065250859a62",
        "-c", 'echo "$1 password=$2"; sleep 90', "check", marker, fake_password
    ], check=True, stdout=subprocess.DEVNULL)

    def logs_received():
        query = '{service="infra-selftest"} |= "' + marker + '"'
        result = request("http://127.0.0.1:3100/loki/api/v1/query_range?" + urlencode({
            "query": query, "start": str(time.time_ns() - 300_000_000_000), "limit": "20"
        }))
        lines = [line[1] for stream in result["data"]["result"] for line in stream["values"]]
        if not lines:
            return False
        assert all(fake_password not in line and "[REDACTED]" in line for line in lines), "Log redaction failed"
        return True

    wait_for(logs_received, "actual Docker -> Alloy -> Loki log delivery and redaction", 90)
finally:
    subprocess.run(DOCKER + ["rm", "-f", name], check=True, stdout=subprocess.DEVNULL)

print("10 metrics targets, 4 probes, 3 Grafana data sources, alert routing, private scheduler login and real redacted log ingestion verified.")
