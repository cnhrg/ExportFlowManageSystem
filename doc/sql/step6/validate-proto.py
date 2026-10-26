"""Step-six typed HTTP/RPC validation, including deliberate missing-official-evidence errors."""
import json
from pathlib import Path
import re
import subprocess
import uuid

from google.api import annotations_pb2
from google.protobuf import descriptor_pb2, descriptor_pool, json_format, message_factory

ROOT = Path(__file__).resolve().parents[3]
folder = ROOT / "doc/examples/step6"
output = folder / (".protocol-" + uuid.uuid4().hex + ".pb")
include = Path(annotations_pb2.__file__).resolve().parents[2]
try:
    subprocess.run(["protoc", "-I", str(ROOT / "proto"), "-I", str(include), "--include_imports",
                    "--descriptor_set_out=" + str(output), "trade/taxproof/v1/taxproof.proto",
                    "trade/filing/v1/filing.proto"], check=True)
    pool = descriptor_pool.DescriptorPool()
    methods = {}
    for file in descriptor_pb2.FileDescriptorSet.FromString(output.read_bytes()).file:
        pool.Add(file)
        for service in file.service:
            for method in service.method:
                methods[method.name] = (file.package, service.name, method)
    def cls(name):
        return message_factory.GetMessageClass(pool.FindMessageTypeByName(name.lstrip(".")))
    endpoints = json.loads((folder / "http-contract.json").read_text())
    examples = json.loads((folder / "http-examples.json").read_text())
    rpcs = json.loads((folder / "rpc-examples.json").read_text())
    assert len(endpoints) == len(examples) == len(rpcs) == 17
    typed, blocked = 0, 0
    for endpoint, http, rpc in zip(endpoints, examples, rpcs):
        package, service, method = methods[endpoint["rpc"]]
        assert rpc["service"] == package + "." + service
        assert method.input_type == "." + package + "." + endpoint["reqMsg"]
        assert method.output_type == "." + package + "." + endpoint["rspMsg"]
        request = json_format.ParseDict(rpc["request"], cls(method.input_type)(), ignore_unknown_fields=False)
        option = method.options.Extensions[annotations_pb2.http]
        assert option.body == endpoint["body"] and option.response_body == "resource"
        assert getattr(option, option.WhichOneof("pattern")) == endpoint["path"]
        assert option.WhichOneof("pattern").upper() == endpoint["method"]
        if option.body:
            reconstructed = json_format.MessageToDict(getattr(request, option.body),
                                                       always_print_fields_with_no_presence=True)
            assert reconstructed == http["request"]["body"], (endpoint["rpc"], reconstructed)
        else:
            assert "body" not in http["request"]
        actual_path = endpoint["path"]
        for name in re.findall(r"\{([^}]+)\}", actual_path):
            actual_path = actual_path.replace("{" + name + "}", str(getattr(request, name)))
        assert http["request"]["path"] == actual_path
        assert rpc["deadlineMs"] == endpoint["timeout"]["clientMs"]
        source = (ROOT / endpoint["file"]).read_text()
        assert re.search(rf"// Deadline client/server: {endpoint['timeout']['clientMs']}/{endpoint['timeout']['serverMs']} ms\.[^\n]*\n  rpc {endpoint['rpc']}\(", source)
        if http["response"]["status"] < 400:
            response = json_format.ParseDict(rpc["response"], cls(method.output_type)(), ignore_unknown_fields=False)
            assert rpc["response"]["resource"] == http["response"]["body"]
            assert json_format.ParseDict(json_format.MessageToDict(response), cls(method.output_type)()) == response
            assert http["response"]["status"] == int(endpoint["status"])
            assert http["response"]["headers"]["Content-Type"] == "application/json"
            assert http["response"]["headers"]["ETag"]
            if endpoint["method"] == "POST":
                assert http["response"]["headers"]["Location"].startswith(("/api/", "/internal/"))
            typed += 1
        else:
            problem = http["response"]["body"]
            assert http["response"]["headers"]["Content-Type"] == "application/problem+json"
            assert "response" not in rpc and "resource" not in problem
            assert rpc["httpErrorType"] == "trade.filing.v1.HttpProblem"
            assert rpc["errorType"] == "trade.filing.v1.RpcFailure"
            assert set(rpc["error"]) == {"code", "details"}
            assert rpc["error"]["code"] == ("NOT_FOUND" if http["response"]["status"] == 404 else "FAILED_PRECONDITION")
            details = rpc["error"]["details"]
            assert details["code"] == problem["errors"][0]["code"]
            assert details["httpStatus"] == problem["status"] == http["response"]["status"]
            assert details["errors"] == problem["errors"] and details["requestReference"]
            assert details["retryable"] is False
            assert details["retryAfterMs"] == problem["retryAfterMs"] == 0
            assert details["outcomeUnknown"] is problem["outcomeUnknown"] is False
            json_format.ParseDict(problem, cls(rpc["httpErrorType"])(), ignore_unknown_fields=False)
            json_format.ParseDict(details, cls(rpc["errorType"])(), ignore_unknown_fields=False)
            blocked += 1
        assert http["response"]["headers"]["Cache-Control"] == "no-store"
        status_headers, body = http["httpResponse"].split("\n\n", 1)
        assert status_headers.startswith("HTTP/1.1 " + str(http["response"]["status"]) + " ")
        assert json.loads(body) == http["response"]["body"]
        subprocess.run(["bash", "-n"], input=http["curl"], text=True, check=True)
        if endpoint["method"] != "GET":
            assert re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", http["request"]["headers"]["Idempotency-Key"])
            assert rpc["metadata"]["confirmation-id"] == http["request"]["headers"]["X-Confirmation-Id"]
    print(json.dumps({"step": 6, "compiledMethods": 17, "typedSuccessResponses": typed,
                      "deliberateBlockedErrorResponses": blocked, "typedRequestsAndCurl": 17}))
finally:
    output.unlink(missing_ok=True)
