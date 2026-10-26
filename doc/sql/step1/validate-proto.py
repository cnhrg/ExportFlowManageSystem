"""Compile resource contracts and verify HTTP mappings and synthetic ProtoJSON."""
import base64
import json
import pathlib
import re
import subprocess
import tempfile

from google.api import annotations_pb2
from google.protobuf import descriptor_pb2, descriptor_pool, json_format, message_factory
from google.protobuf import any_pb2
from google.rpc import status_pb2

ROOT = pathlib.Path(__file__).resolve().parents[3]
EXAMPLES = ROOT / "doc/examples/step1"
TYPES = {
    "trade-input": "TradeInput", "supplier-filing": "SupplierFiling",
    "payer-filing": "PayerFiling", "supplier-replacement": "SupplierFiling",
    "payer-replacement": "PayerFiling", "reservation-input": "ReservationInput",
    "reservation": "TradeNumberReservation", "file-upload-input": "FileUploadInput",
    "file-upload": "FileUpload", "file-confirmation": "FileConfirmationInput",
    "file-revision": "FileRevision", "supplier-resource": "SupplierFilingResource",
    "payer-resource": "PayerFilingResource", "trade": "Trade",
    "supplier-submit-accepted": "Trade", "payer-submit-accepted": "PayerFilingResource",
    "supplier-edit-accepted": "SupplierFilingResource",
    "payer-edit-accepted": "PayerFilingResource", "usd-input": "TradeInput",
    "usd-error": "HttpProblem", "stale-error": "HttpProblem",
    "idempotency-error": "HttpProblem", "missing-evidence-error": "HttpProblem",
    "operations-overview": "operations.FilingOverview",
    "invocation-proof": "InvocationProof", "receipt-proof": "ReceiptProof",
    "rpc-failure": "RpcFailure",
    "commit-unknown-error": "HttpProblem", "receipt-pending-error": "HttpProblem",
    "file-upload-retry": "FileUpload",
    "operation-intent": "OperationIntent", "operation-confirmation": "OperationConfirmation",
}

with tempfile.TemporaryDirectory(prefix="step1-http-proto-") as directory:
    output = pathlib.Path(directory) / "contracts.pb"
    include = pathlib.Path(annotations_pb2.__file__).resolve().parents[2]
    subprocess.run([
        "protoc", "-I", str(ROOT / "proto"), "-I", str(include),
        "--include_imports", "--descriptor_set_out=" + str(output),
        str(ROOT / "proto/trade/filing/v1/filing.proto"),
        str(ROOT / "proto/trade/filing/v1/operations.proto"),
    ], check=True)
    descriptors = descriptor_pb2.FileDescriptorSet.FromString(output.read_bytes())
    pool = descriptor_pool.DescriptorPool()
    for item in descriptors.file:
        pool.Add(item)
    pool.AddSerializedFile(any_pb2.DESCRIPTOR.serialized_pb)
    pool.AddSerializedFile(status_pb2.DESCRIPTOR.serialized_pb)

    def message_class(name):
        package = "trade.filing.operations.v1." if name.startswith("operations.") else "trade.filing.v1."
        return message_factory.GetMessageClass(pool.FindMessageTypeByName(package + name.split(".")[-1]))

    for name, type_name in TYPES.items():
        text = (EXAMPLES / (name + ".json")).read_text()
        message = json_format.Parse(text, message_class(type_name)(), ignore_unknown_fields=False)
        assert message == json_format.Parse(json_format.MessageToJson(message), message_class(type_name)()), name

    contract = json.loads((EXAMPLES / "http-contract.json").read_text())
    spec = (ROOT / "doc/步骤一HTTP接口协议.md").read_text()
    mapped, rpc_methods = {}, {}
    services = []
    for file in descriptors.file:
        for service in file.service:
            services.append(service.name)
            for method in service.method:
                option = method.options.Extensions[annotations_pb2.http]
                verb = option.WhichOneof("pattern")
                route = getattr(option, verb)
                mapped[method.name] = (verb.upper(), route, option.body)
                rpc_methods[method.name] = method
                if service.name.startswith("Internal"):
                    assert route.startswith("/internal/")
                else:
                    assert route.startswith("/api/")
    assert set(services) == {"ExternalTradeFilingService", "InternalFilingOperationsService"}
    assert len(mapped) == len(contract) == 16
    for endpoint in contract:
        assert mapped[endpoint["rpc"]] == (endpoint["method"], endpoint["path"], endpoint["body"])
        assert endpoint["method"] + " " + endpoint["path"] in spec
        assert endpoint["timeout"]["serverMs"] < endpoint["timeout"]["clientMs"]
        proto_path = "operations.proto" if endpoint["audience"] == "内部运营" else "filing.proto"
        proto_source = (ROOT / "proto/trade/filing/v1" / proto_path).read_text()
        assert re.search(
            rf"// Deadline client/server: {endpoint['timeout']['clientMs']}/{endpoint['timeout']['serverMs']} ms\.[^\n]*\n  rpc {endpoint['rpc']}\(",
            proto_source), endpoint["rpc"]

    examples = json.loads((EXAMPLES / "http-examples.json").read_text())
    for example in examples:
        request, response = example["request"], example["response"]
        matches = [endpoint for endpoint in contract
                   if endpoint["method"] == request["method"] and re.fullmatch(
                       re.sub(r"\{[^}]+\}", r"[^/]+", endpoint["path"]), request["path"])]
        assert len(matches) == 1
        endpoint = matches[0]
        method = rpc_methods[endpoint["rpc"]]
        assert method.input_type.endswith("." + endpoint["rpc"] + "ReqMsg")
        assert method.output_type.endswith("." + endpoint["rpc"] + "RspMsg")
        assert method.options.Extensions[annotations_pb2.http].response_body == "resource"
        if request["method"] != "GET":
            parsed_body = json_format.ParseDict(request["body"], message_class(endpoint["input"])())
            rebuilt_body = json_format.MessageToDict(parsed_body, always_print_fields_with_no_presence=True)
            assert rebuilt_body == request["body"], "HTTP/RPC canonical body changed: " + endpoint["rpc"]
        output_name = "operations." + endpoint["output"] if endpoint["audience"] == "内部运营" else endpoint["output"]
        json_format.ParseDict(response["body"], message_class(output_name)(), ignore_unknown_fields=False)
        assert response["status"] == int(endpoint["status"])
        assert example["designOnly"] and example["curl"] and example["httpResponse"]
        if request["method"] != "GET":
            assert "Idempotency-Key" in request["headers"]
            if endpoint["id"] != "confirmation":
                assert "X-Confirmation-Id" in request["headers"]
        assert example["timeoutMs"] == endpoint["timeout"]["clientMs"]
        if request["method"] == "PUT":
            assert request["headers"]["If-Match"].startswith('"s1-')
            assert "content" not in response["body"]
        if request["method"] == "POST":
            assert response["headers"]["Location"]
    upload = json.loads((EXAMPLES / "file-upload.json").read_text())["signedUpload"]
    file = json.loads((EXAMPLES / "file-revision.json").read_text())
    checksum = next(header["value"] for header in upload["requiredHeaders"]
                    if header["name"] == "x-amz-checksum-sha256")
    assert base64.b64decode(checksum, validate=True).hex() == file["sha256"]
    assert file["sizeBytes"] == str((EXAMPLES / "material-bundle.html").stat().st_size)
    forged = json.loads((EXAMPLES / "payer-filing.json").read_text())
    forged["actorId"] = "FORGED"
    try:
        json_format.ParseDict(forged, message_class("PayerFiling")())
    except json_format.ParseError:
        pass
    else:
        raise AssertionError("Unknown actor field accepted")
    rpc_examples = json.loads((EXAMPLES / "rpc-examples.json").read_text())
    rpc_error = json_format.Parse((EXAMPLES / "rpc-error.json").read_text(), status_pb2.Status(), descriptor_pool=pool)
    assert rpc_error.code == 14
    rpc_failure = message_class("RpcFailure")()
    assert rpc_error.details[0].Unpack(rpc_failure)
    assert rpc_failure.outcome_unknown and rpc_failure.retryable and rpc_failure.http_status == 503
    for example in rpc_examples:
        method = rpc_methods[example["method"]]
        input_class = message_factory.GetMessageClass(pool.FindMessageTypeByName(method.input_type.lstrip(".")))
        output_class = message_factory.GetMessageClass(pool.FindMessageTypeByName(method.output_type.lstrip(".")))
        json_format.ParseDict(example["request"], input_class(), ignore_unknown_fields=False)
        json_format.ParseDict(example["response"], output_class(), ignore_unknown_fields=False)
        endpoint = next(item for item in contract if item["rpc"] == example["method"])
        assert example["deadlineMs"] == endpoint["timeout"]["clientMs"]
        assert "authorization" in example["metadata"]
        if endpoint["method"] != "GET" and endpoint["id"] != "confirmation":
            assert "confirmation-id" in example["metadata"]
            assert "receipt-proof-bin" in example["successTrailers"]
        assert example["response"]["resource"] == next(item["response"]["body"] for item in examples if item["rpc"] == example["method"])
    known = set(TYPES) | {"http-examples", "http-contract", "rpc-examples", "rpc-error", "transport-policy"}
    assert {file.stem for file in EXAMPLES.glob("*.json")} == known, "Stale/unvalidated JSON example"
    print(json.dumps({"compiled": True, "strictProtoJsonExamples": len(TYPES),
                      "httpExamples": len(examples), "httpMappings": len(mapped),
                      "rpcExamples": len(rpc_examples), "explicitDeadlines": True,
                      "interfaceAudiences": 2, "deploymentCount": 1, "unknownActorRejected": True}))
