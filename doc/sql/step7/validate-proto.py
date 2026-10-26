"""Strict typed transport checks including intentionally blocked external examples."""
import json
from pathlib import Path
import re
import subprocess

from google.api import annotations_pb2
from google.protobuf import descriptor_pb2, descriptor_pool, json_format, message_factory

ROOT = Path(__file__).resolve().parents[3]
private = ROOT / "infra/local/.step-seven-private"
private.mkdir(mode=0o700, exist_ok=True)
output = private / "taxrefund.pb"
include = Path(annotations_pb2.__file__).resolve().parents[2]
subprocess.run(["protoc", "-I", str(ROOT / "proto"), "-I", str(include),
                "--include_imports", "--descriptor_set_out=" + str(output),
                str(ROOT / "proto/trade/taxrefund/v1/taxrefund.proto")], check=True)
pool = descriptor_pool.DescriptorPool()
methods = {}
for file in descriptor_pb2.FileDescriptorSet.FromString(output.read_bytes()).file:
    pool.Add(file)
    for service in file.service:
        for method in service.method:
            methods[method.name] = (file.package, service.name, method)


def cls(name):
    return message_factory.GetMessageClass(pool.FindMessageTypeByName(name.lstrip(".")))


def load(name):
    return json.loads((ROOT / "doc/examples/step7" / name).read_text())


contract, http, rpc = load("http-contract.json"), load("http-examples.json"), load("rpc-examples.json")
assert len(contract) == len(http) == len(rpc) == 12
successes, blocked = 0, 0
for endpoint, example, call in zip(contract, http, rpc):
    package, service, method = methods[endpoint["rpc"]]
    option = method.options.Extensions[annotations_pb2.http]
    assert getattr(option, option.WhichOneof("pattern")) == endpoint["path"]
    assert option.WhichOneof("pattern").upper() == endpoint["method"]
    assert option.body == endpoint["body"] and option.response_body == "resource"
    assert method.input_type == "." + package + "." + endpoint["rpc"] + "ReqMsg"
    assert method.output_type == "." + package + "." + endpoint["rpc"] + "RspMsg"
    request = json_format.ParseDict(call["request"], cls(method.input_type)(), ignore_unknown_fields=False)
    try:
        json_format.ParseDict({**call["request"], "untrustedApproved": True}, cls(method.input_type)(), ignore_unknown_fields=False)
    except json_format.ParseError:
        pass
    else:
        raise AssertionError("Unknown field accepted")
    if option.body:
        body = json_format.MessageToDict(getattr(request, option.body), always_print_fields_with_no_presence=True)
        assert body == example["request"]["body"], (endpoint["rpc"], body, example["request"]["body"])
    else:
        assert "body" not in example["request"]
    path = endpoint["path"]
    for name in re.findall(r"\{([^}]+)\}", path):
        path = path.replace("{" + name + "}", str(getattr(request, name)))
    assert path == example["request"]["path"] and "?" not in path
    assert call["service"] == package + "." + service
    assert call["deadlineMs"] == endpoint["timeout"]["clientMs"]
    assert call["serverBudgetMs"] == endpoint["timeout"]["serverMs"]
    source = (ROOT / endpoint["file"]).read_text()
    assert re.search(r"// Deadline client/server: " + str(call["deadlineMs"]) + "/" + str(call["serverBudgetMs"]) +
                     r" ms\.\n  rpc " + endpoint["rpc"] + r"\(", source)
    assert example["response"]["headers"]["Cache-Control"] == "no-store"
    assert example["httpResponse"].startswith("HTTP/1.1 " + str(example["response"]["status"]) + " ")
    assert json.loads(example["httpResponse"].split("\n\n", 1)[1]) == example["response"]["body"]
    subprocess.run(["bash", "-n"], input=example["curl"], text=True, check=True)
    if endpoint["method"] != "GET":
        assert re.fullmatch(r"[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}", call["metadata"]["idempotency-key"])
        assert call["metadata"]["confirmation-id"]
    if example["response"]["status"] >= 400:
        assert "response" not in call and call["error"]["code"] == "FAILED_PRECONDITION"
        json_format.ParseDict(example["response"]["body"], cls("trade.filing.v1.HttpProblem")(), ignore_unknown_fields=False)
        json_format.ParseDict(call["error"]["details"], cls("trade.filing.v1.RpcFailure")(), ignore_unknown_fields=False)
        assert call["errorType"] == "trade.filing.v1.RpcFailure"
        assert call["httpErrorType"] == "trade.filing.v1.HttpProblem"
        assert call["error"]["details"]["httpStatus"] == example["response"]["status"]
        assert call["error"]["details"]["errors"] == example["response"]["body"]["errors"]
        assert call["error"]["details"]["code"] == example["response"]["body"]["errors"][0]["code"]
        assert example["response"]["headers"]["Content-Type"] == "application/problem+json"
        assert example["response"]["status"] == 422
        blocked += 1
    else:
        response = json_format.ParseDict(call["response"], cls(method.output_type)(), ignore_unknown_fields=False)
        assert call["response"]["resource"] == example["response"]["body"]
        assert example["response"]["status"] == int(endpoint["status"])
        assert response.HasField("resource")
        successes += 1
output.unlink()
result = {"designOnly": True, "methods": len(contract), "typedSuccessExamples": successes, "blockedExamples": blocked,
          "unknownFieldNegativeCases": len(contract), "explicitReqRsp": True, "httpResourceMapping": True,
          "requestBodyRoundTrips": True, "curlSyntax": True, "metadataDeadlines": True,
          "externalAuthoritySuccessVerified": False, "bankSuccessVerified": False}
print(json.dumps(result))
