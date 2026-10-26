"""Validate explicit RPC messages, HTTP bodies/responses and cURL for eight steps."""
import json
import pathlib
import re
import subprocess
import tempfile
from urllib.parse import parse_qsl, urlencode, urlsplit

from google.api import annotations_pb2
from google.protobuf import descriptor_pb2, descriptor_pool, json_format, message_factory

ROOT = pathlib.Path(__file__).resolve().parents[3]
with tempfile.TemporaryDirectory(prefix="export-req-rsp-") as directory:
    output = pathlib.Path(directory) / "contracts.pb"
    include = pathlib.Path(annotations_pb2.__file__).resolve().parents[2]
    files = [str(file.relative_to(ROOT / "proto")) for file in sorted((ROOT / "proto/trade").rglob("*.proto"))]
    subprocess.run(["protoc", "-I", str(ROOT / "proto"), "-I", str(include),
                    "--include_imports", "--descriptor_set_out=" + str(output),
                    *[str(ROOT / "proto" / file) for file in files]], check=True)
    pool = descriptor_pool.DescriptorPool()
    descriptors = descriptor_pb2.FileDescriptorSet.FromString(output.read_bytes())
    methods = {}
    for file in descriptors.file:
        pool.Add(file)
        for service in file.service:
            for method in service.method:
                methods[(file.name,method.name)] = (file.package, service.name, method)

    def cls(name):
        return message_factory.GetMessageClass(pool.FindMessageTypeByName(name.lstrip(".")))

    count = 0
    intentional_errors = 0
    validated_methods = []
    for step in range(1,9):
        folder = ROOT / f"doc/examples/step{step}"
        contract = json.loads((folder / "http-contract.json").read_text())
        examples = json.loads((folder / "http-examples.json").read_text())
        rpcs = json.loads((folder / "rpc-examples.json").read_text())
        expected=len(contract)
        assert expected>0
        assert len(contract) == len(examples) == len(rpcs)
        assert len({item["rpc"] for item in contract}) == expected
        for endpoint, http, rpc in zip(contract, sorted(examples, key=lambda e: next(
                i for i, item in enumerate(contract) if item["rpc"] == e["rpc"])),
                sorted(rpcs, key=lambda e: next(i for i, item in enumerate(contract)
                                               if item["rpc"] == e["method"]))):
            package, service, method = methods[(endpoint["file"].removeprefix("proto/"),endpoint["rpc"])]
            option = method.options.Extensions[annotations_pb2.http]
            assert getattr(option, option.WhichOneof("pattern")) == endpoint["path"]
            assert option.WhichOneof("pattern").upper() == endpoint["method"]
            assert option.body == endpoint["body"] and option.response_body == "resource"
            assert method.input_type == f".{package}.{endpoint['rpc']}ReqMsg"
            assert method.output_type == f".{package}.{endpoint['rpc']}RspMsg"
            assert rpc["service"] == package + "." + service
            request = json_format.ParseDict(rpc["request"], cls(method.input_type)(),
                                            ignore_unknown_fields=False)
            failed = http["response"]["status"] >= 400
            if failed:
                intentional_errors += 1
                assert "response" not in rpc and "error" in rpc, endpoint["rpc"]
                assert "code" in rpc["error"] and "details" in rpc["error"], (
                    step, endpoint["rpc"], "Expected typed RpcFailure details")
                assert rpc["error"]["code"] in (
                    "INVALID_ARGUMENT", "UNAUTHENTICATED", "PERMISSION_DENIED",
                    "NOT_FOUND", "ALREADY_EXISTS", "FAILED_PRECONDITION",
                    "ABORTED", "RESOURCE_EXHAUSTED", "UNAVAILABLE",
                    "DEADLINE_EXCEEDED", "INTERNAL"), endpoint["rpc"]
                failure = rpc["error"]["details"]
                json_format.ParseDict(failure, cls("trade.filing.v1.RpcFailure")(),
                                      ignore_unknown_fields=False)
                problem = http["response"]["body"]
                json_format.ParseDict(problem, cls("trade.filing.v1.HttpProblem")(),
                                      ignore_unknown_fields=False)
                assert problem["status"] == failure["httpStatus"] == http["response"]["status"]
                error_statuses = {
                    "INVALID_ARGUMENT": {400}, "UNAUTHENTICATED": {401},
                    "PERMISSION_DENIED": {403}, "NOT_FOUND": {404},
                    "ALREADY_EXISTS": {409}, "FAILED_PRECONDITION": {409, 412, 422, 428},
                    "ABORTED": {409}, "RESOURCE_EXHAUSTED": {429},
                    "UNAVAILABLE": {503}, "DEADLINE_EXCEEDED": {504}, "INTERNAL": {500},
                }
                assert problem["status"] in error_statuses[rpc["error"]["code"]], endpoint["rpc"]
                assert failure["errors"] == problem["errors"]
                assert any(item["code"] == failure["code"] for item in problem["errors"])
                assert problem["instance"] == http["request"]["path"]
                assert problem["outcomeUnknown"] == failure["outcomeUnknown"]
            else:
                response = json_format.ParseDict(rpc["response"], cls(method.output_type)(),
                                                 ignore_unknown_fields=False)
            if option.body:
                field = request.DESCRIPTOR.fields_by_name[option.body]
                reconstructed = json_format.MessageToDict(
                    getattr(request, field.name), always_print_fields_with_no_presence=True)
                assert reconstructed == http["request"]["body"], endpoint["rpc"]
            else:
                assert "body" not in http["request"]
            path_fields = re.findall(r"\{([^}]+)\}", endpoint["path"])
            actual_path = endpoint["path"]
            for name in path_fields:
                actual_path = actual_path.replace("{" + name + "}", str(getattr(request, name)))
            parsed_path = urlsplit(http["request"]["path"])
            assert parsed_path.path == actual_path
            query_pairs = parse_qsl(parsed_path.query, keep_blank_values=True)
            assert len({key for key, _ in query_pairs}) == len(query_pairs)
            assert all(key in endpoint.get("query", []) for key, _ in query_pairs)
            for name, value in query_pairs:
                assert request.HasField(name) and str(getattr(request, name)) == value
            assert http["request"]["path"] == actual_path + ("?" + urlencode(query_pairs) if query_pairs else "")
            if not failed:
                resource_type = response.DESCRIPTOR.fields_by_name["resource"].message_type.full_name
                json_format.ParseDict(http["response"]["body"], cls(resource_type)(),
                                      ignore_unknown_fields=False)
                assert rpc["response"]["resource"] == http["response"]["body"]
                assert http["response"]["status"] == int(endpoint["status"])
            assert http["response"]["headers"]["Content-Type"] == ("application/problem+json" if failed else "application/json")
            assert http["response"]["headers"]["Cache-Control"] == "no-store"
            assert http["timeoutMs"] == rpc["deadlineMs"] == endpoint["timeout"]["clientMs"]
            assert endpoint["timeout"]["clientMs"] > endpoint["timeout"]["serverMs"]
            source = (ROOT / endpoint["file"]).read_text()
            assert re.search(
                rf"// Deadline client/server: {endpoint['timeout']['clientMs']}/{endpoint['timeout']['serverMs']} ms\.[^\n]*\n  rpc {endpoint['rpc']}\(",
                source), endpoint["rpc"]
            assert http["httpResponse"].startswith("HTTP/1.1 " + str(http["response"]["status"]) + " ")
            status_and_headers, body = http["httpResponse"].split("\n\n", 1)
            assert json.loads(body) == http["response"]["body"]
            assert "Content-Type: " + http["response"]["headers"]["Content-Type"] in status_and_headers
            assert "--request " + endpoint["method"] in http["curl"]
            assert "--max-time " + str(http["timeoutMs"] // 1000) in http["curl"]
            assert "--retry" not in http["curl"]
            subprocess.run(["bash", "-n"], input=http["curl"], text=True, check=True)
            if endpoint["method"] == "POST" and not failed:
                assert http["response"]["headers"]["Location"].startswith(("/api/", "/internal/"))
            key = http["request"]["headers"].get("Idempotency-Key")
            if key and not (step == 1 and endpoint["id"] == "create"):
                assert re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", key), endpoint["rpc"]
            if endpoint["method"] != "GET" and "Confirmation" not in endpoint["rpc"] and endpoint["id"] != "notice":
                assert "X-Confirmation-Id" in http["request"]["headers"]
                assert "confirmation-id" in rpc["metadata"]
                assert "X-Invocation-Proof" not in http["request"]["headers"]
            if endpoint["id"] == "notice":
                assert "X-Provider-Signature" in http["request"]["headers"]
                assert "Authorization" not in http["request"]["headers"]
                assert "confirmation-id" not in rpc["metadata"]
                assert http["response"]["body"]["state"] == "received"
            if endpoint["audience"] == "内部运营":
                assert endpoint["path"].startswith("/internal/")
            validated_methods.append({
                "step": step, "method": package + "." + service + "." + endpoint["rpc"],
                "httpMethod": endpoint["method"], "resourcePath": endpoint["path"],
                "observedExampleStatus": http["response"]["status"],
                "exampleKind": "intentional_error" if failed else "resource",
                "explicitReqMsgRspMsg": True, "typedRequestAndResponse": True,
                "httpRpcBodyRoundTrip": True, "curlSyntaxAndTimeout": True,
                "metadataAndQueryWhitelist": True, "passed": True,
            })
            count += 1
    for failure in json.loads((ROOT / "doc/examples/step2/failure-examples.json").read_text()):
        json_format.ParseDict(failure, cls("trade.filing.v1.HttpProblem")())
    json_format.Parse((ROOT / "doc/examples/step2/basis-supplier-replacement.json").read_text(),
                      cls("trade.filing.v1.SupplierFiling")())
    json_format.Parse((ROOT / "doc/examples/step2/evidence-review-context.json").read_text(),
                      cls("trade.contracts.v1.TradeReviewContext")())
    session = json.loads((ROOT / "doc/examples/step2/http-examples.json").read_text())
    pending = next(item for item in session if item["rpc"] == "CreateSigningSession")
    ready = next(item for item in session if item["rpc"] == "GetSigningSession")
    assert pending["response"]["headers"]["Location"] == ready["request"]["path"]
    assert "redirectUrl" not in pending["response"]["body"]
    assert ready["response"]["body"]["state"] == "ready"
    signature = next(item for item in session if item["rpc"] == "GetSignatureRequest")
    assert signature["response"]["headers"]["ETag"] == pending["request"]["headers"]["If-Match"]
    for name in ["ReplaceContractDraft", "CreateContractRevision", "CreateContractReviewSubmission",
                 "CreateContractReviewDecision", "CreateContractActivation", "CreateContractTermination"]:
        example = next(item for item in session if item["rpc"] == name)
        assert "content" not in example["response"]["body"]
        assert "signedFile" not in example["response"]["body"]
        assert example["response"]["body"]["acceptanceId"]
        if name not in ("ReplaceContractDraft", "CreateContractRevision"):
            assert example["response"]["headers"]["Location"].endswith("/" + example["response"]["body"]["acceptanceId"])
    context_cls = cls("trade.contracts.v1.GetTradeReviewContextReqMsg")
    context_request = json_format.ParseDict({"tradeNumber": "DEMO", "submittedSnapshotNumber": "EXACT-SUBMITTED"}, context_cls())
    assert context_request.HasField("submitted_snapshot_number")
    context_example = next(item for item in session if item["rpc"] == "GetTradeReviewContext")
    assert "?submitted_snapshot_number=" in context_example["request"]["path"]
    print(json.dumps({"compiledProtoFiles": len(files), "methodsWithReqMsgRspMsg": count,
                      "typedHttpResponses": count, "curlSyntaxChecks": count,
                      "httpRpcBodyRoundTrips": count, "intentionalErrorExamples": intentional_errors,
                      "databaseExecuted": False, "checks": validated_methods}))
