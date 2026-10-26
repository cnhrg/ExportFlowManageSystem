"""Compile and type-check step-four transport examples without temporary-directory writes."""
import json
from pathlib import Path
import re
import subprocess
import uuid
from urllib.parse import urlsplit
from google.api import annotations_pb2
from google.protobuf import descriptor_pb2, descriptor_pool, json_format, message_factory

ROOT = Path(__file__).resolve().parents[3]
output = ROOT / ("doc/sql/step4/.descriptor-" + uuid.uuid4().hex + ".pb")
try:
    include = Path(annotations_pb2.__file__).resolve().parents[2]
    subprocess.run(["protoc", "-I", str(ROOT / "proto"), "-I", str(include), "--include_imports",
                    "--descriptor_set_out=" + str(output), "trade/customs/v1/customs.proto"], check=True)
    pool = descriptor_pool.DescriptorPool()
    methods = {}
    for file in descriptor_pb2.FileDescriptorSet.FromString(output.read_bytes()).file:
        pool.Add(file)
        for service in file.service:
            for method in service.method:
                methods[method.name] = (file.package, service.name, method)

    def cls(name):
        return message_factory.GetMessageClass(pool.FindMessageTypeByName(name.lstrip(".")))

    folder = ROOT / "doc/examples/step4"
    contract = json.loads((folder / "http-contract.json").read_text())
    examples = json.loads((folder / "http-examples.json").read_text())
    rpcs = json.loads((folder / "rpc-examples.json").read_text())
    assert len(contract) == len(examples) == len(rpcs) == 19
    source = (ROOT / "proto/trade/customs/v1/customs.proto").read_text()
    for endpoint, http, rpc in zip(contract, examples, rpcs):
        package, service, method = methods[endpoint["rpc"]]
        option = method.options.Extensions[annotations_pb2.http]
        assert getattr(option, option.WhichOneof("pattern")) == endpoint["path"]
        assert option.WhichOneof("pattern").upper() == endpoint["method"]
        assert option.body == endpoint["body"] and option.response_body == "resource"
        assert method.input_type == f".{package}.{endpoint['rpc']}ReqMsg"
        assert method.output_type == f".{package}.{endpoint['rpc']}RspMsg"
        assert rpc["service"] == package + "." + service
        request = json_format.ParseDict(rpc["request"], cls(method.input_type)())
        response = json_format.ParseDict(rpc["response"], cls(method.output_type)())
        if option.body:
            typed_body = getattr(request, option.body)
            expected = json_format.ParseDict(http["request"]["body"], type(typed_body)())
            assert expected == typed_body
            assert rpc["metadata"]["confirmation-id"] == http["request"]["headers"]["X-Confirmation-Id"]
        else:
            assert "body" not in http["request"]
        actual_path = endpoint["path"]
        for name in re.findall(r"\{([^}]+)\}", actual_path):
            actual_path = actual_path.replace("{" + name + "}", str(getattr(request, name)))
        assert http["request"]["path"] == actual_path and not urlsplit(actual_path).query
        assert response.resource == json_format.ParseDict(http["response"]["body"], type(response.resource)())
        assert http["response"]["status"] == int(endpoint["status"])
        assert http["response"]["headers"]["Cache-Control"] == "no-store"
        assert http["timeoutMs"] == rpc["deadlineMs"] == endpoint["timeout"]["clientMs"]
        assert re.search(rf"// Deadline client/server: {endpoint['timeout']['clientMs']}/{endpoint['timeout']['serverMs']} ms\.[^\n]*\n  rpc {endpoint['rpc']}\(", source)
        assert json.loads(http["httpResponse"].split("\n\n", 1)[1]) == http["response"]["body"]
        subprocess.run(["bash", "-n"], input=http["curl"], text=True, check=True)
        assert "--retry" not in http["curl"]
        if endpoint["method"] == "POST":
            assert http["response"]["headers"]["Location"].startswith(("/api/", "/internal/"))
    for failure in json.loads((folder / "failure-examples.json").read_text()):
        json_format.ParseDict(failure, cls("trade.filing.v1.HttpProblem")())
    variants = json.loads((folder / "operation-variants.json").read_text())
    for variant in variants:
        http, rpc = variant["http"], variant["rpc"]
        package, service, method = methods[rpc["method"]]
        request = json_format.ParseDict(rpc["request"], cls(method.input_type)())
        option = method.options.Extensions[annotations_pb2.http]
        assert getattr(request, option.body) == json_format.ParseDict(http["request"]["body"], type(getattr(request, option.body))())
        json_format.ParseDict(http["response"]["body"], cls("trade.filing.v1.HttpProblem")())
        json_format.ParseDict(rpc["error"]["details"], cls("trade.filing.v1.RpcFailure")())
        assert rpc["error"]["code"] in ("PERMISSION_DENIED", "FAILED_PRECONDITION")
        assert "response" not in rpc and rpc["deadlineMs"] == 10000
        subprocess.run(["bash", "-n"], input=http["curl"], text=True, check=True)
    print(json.dumps({"methodsWithReqMsgRspMsg": 19, "typedHttpResponses": 19, "curlSyntaxChecks": 19 + len(variants),
                      "httpRpcRoundTrips": 19, "typedFailureVariants": len(variants)}))
finally:
    output.unlink(missing_ok=True)
