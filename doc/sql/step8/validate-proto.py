"""Strict step-eight protocol round trips without writing outside the repository."""
import json
from pathlib import Path
import re
import secrets
import subprocess

from google.api import annotations_pb2
from google.protobuf import descriptor_pb2, descriptor_pool, json_format, message_factory

ROOT = Path(__file__).resolve().parents[3]
OUTPUT = Path(__file__).resolve().parent / ("descriptor-" + secrets.token_hex(6) + ".pb")
SOURCE = ROOT / "proto/trade/reconciliation/v1/reconciliation.proto"
try:
    subprocess.run(["protoc", "-I", str(ROOT / "proto"), "-I",
                    str(Path(annotations_pb2.__file__).resolve().parents[2]), "--include_imports",
                    "--descriptor_set_out=" + str(OUTPUT), str(SOURCE),
                    str(ROOT / "proto/trade/filing/v1/filing.proto")], check=True)
    pool, methods = descriptor_pool.DescriptorPool(), {}
    for file in descriptor_pb2.FileDescriptorSet.FromString(OUTPUT.read_bytes()).file:
        pool.Add(file)
        for service in file.service:
            for method in service.method:
                methods[method.name] = (file.package, service.name, method)

    def cls(name):
        return message_factory.GetMessageClass(pool.FindMessageTypeByName(name.lstrip(".")))

    folder = ROOT / "doc/examples/step8"
    endpoints, http, rpc = [json.loads((folder / name).read_text()) for name in
                            ("http-contract.json", "http-examples.json", "rpc-examples.json")]
    assert len(endpoints) == len(http) == len(rpc)
    checks = []
    for endpoint, example, call in zip(endpoints, http, rpc):
        package, service, method = methods[endpoint["rpc"]]
        option = method.options.Extensions[annotations_pb2.http]
        assert getattr(option, option.WhichOneof("pattern")) == endpoint["path"]
        assert option.body == endpoint["body"] and option.response_body == "resource"
        assert method.input_type.endswith("." + endpoint["reqMsg"])
        assert method.output_type.endswith("." + endpoint["rspMsg"])
        assert call["service"] == package + "." + service
        request = json_format.ParseDict(call["request"], cls(method.input_type)())
        failed = example["response"]["status"] >= 400
        if failed:
            assert "response" not in call and call["error"]["code"] == "FAILED_PRECONDITION"
            failure = json_format.ParseDict(call["error"]["details"], cls("trade.filing.v1.RpcFailure")())
            problem = json_format.ParseDict(example["response"]["body"], cls("trade.filing.v1.HttpProblem")())
            assert problem.status == failure.http_status == example["response"]["status"]
            assert example["response"]["headers"]["Content-Type"] == "application/problem+json"
            assert call["error"]["details"]["errors"] == example["response"]["body"]["errors"]
        else:
            response = json_format.ParseDict(call["response"], cls(method.output_type)())
        if option.body:
            body = getattr(request, option.body)
            assert json_format.MessageToDict(body, always_print_fields_with_no_presence=True) == example["request"]["body"], endpoint["rpc"]
        else:
            assert "body" not in example["request"]
        if not failed:
            assert call["response"]["resource"] == example["response"]["body"]
            resource = response.DESCRIPTOR.fields_by_name["resource"].message_type.full_name
            json_format.ParseDict(example["response"]["body"], cls(resource)())
            assert example["response"]["status"] == int(endpoint["status"])
        path = endpoint["path"]
        for name in re.findall(r"\{([^}]+)\}", path):
            path = path.replace("{" + name + "}", str(getattr(request, name)))
        assert path == example["request"]["path"]
        assert re.search(rf"// Deadline client/server: {endpoint['timeout']['clientMs']}/{endpoint['timeout']['serverMs']} ms\.[^\n]*\n  rpc {endpoint['rpc']}\(", SOURCE.read_text())
        subprocess.run(["bash", "-n"], input=example["curl"], text=True, check=True)
        checks.append({"method": endpoint["rpc"], "passed": True, "strictTypedRoundTrip": True})
    for error in json.loads((folder / "error-examples.json").read_text()):
        if "httpBody" in error:
            json_format.ParseDict(error["httpBody"], cls("trade.filing.v1.HttpProblem")())
        assert "response" not in error["rpc"]
        json_format.ParseDict(error["rpc"]["error"]["details"], cls("trade.filing.v1.RpcFailure")())
    intentional_errors = sum(example["response"]["status"] >= 400 for example in http)
    output = {"step": 8, "compiledProtoFiles": 2, "methods": len(checks), "checks": checks,
              "intentionalErrors": intentional_errors, "errorCatalogTyped": True, "productionApiExecuted": False}
    print(json.dumps(output))
finally:
    OUTPUT.unlink(missing_ok=True)
