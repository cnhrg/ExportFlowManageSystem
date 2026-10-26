"""Strict typed step-five examples, including non-OK HttpProblem/RpcFailure."""
import json
from pathlib import Path
import re
import subprocess

from google.api import annotations_pb2
from google.protobuf import descriptor_pb2, descriptor_pool, json_format, message_factory

ROOT = Path(__file__).resolve().parents[3]
FOLDER = ROOT / "doc/examples/step5"
output = FOLDER / ".step5-descriptor.pb"
try:
    include = Path(annotations_pb2.__file__).resolve().parents[2]
    subprocess.run(["protoc", "-I", str(ROOT / "proto"), "-I", str(include),
                    "-I", "/opt/homebrew/opt/protobuf/include", "--include_imports",
                    "--descriptor_set_out=" + str(output),
                    str(ROOT / "proto/trade/funds/v1/funds.proto")], check=True)
    pool = descriptor_pool.DescriptorPool()
    for file in descriptor_pb2.FileDescriptorSet.FromString(output.read_bytes()).file:
        pool.Add(file)

    def parse(name, data):
        cls = message_factory.GetMessageClass(pool.FindMessageTypeByName(name))
        return json_format.ParseDict(data, cls(), ignore_unknown_fields=False)

    contracts = json.loads((FOLDER / "http-contract.json").read_text())
    examples = json.loads((FOLDER / "http-examples.json").read_text())
    rpcs = json.loads((FOLDER / "rpc-examples.json").read_text())
    assert len(contracts) == len(examples) == len(rpcs) == 24
    checks = []
    for endpoint, http, rpc in zip(contracts, examples, rpcs):
        method = pool.FindServiceByName(rpc["service"]).FindMethodByName(endpoint["rpc"])
        option = method.GetOptions().Extensions[annotations_pb2.http]
        assert option.response_body == "resource"
        assert option.body == endpoint["body"]
        assert getattr(option, option.WhichOneof("pattern")) == endpoint["path"]
        assert option.WhichOneof("pattern").upper() == endpoint["method"]
        assert method.input_type.name == endpoint["reqMsg"]
        assert method.output_type.name == endpoint["rspMsg"]
        request = parse(method.input_type.full_name, rpc["request"])
        actual_path = endpoint["path"]
        for name in re.findall(r"\{([^}]+)\}", actual_path):
            actual_path = actual_path.replace("{" + name + "}", str(getattr(request, name)))
        assert actual_path == http["request"]["path"]
        assert rpc["deadlineMs"] == http["timeoutMs"] == endpoint["timeout"]["clientMs"]
        assert endpoint["timeout"]["clientMs"] > endpoint["timeout"]["serverMs"]
        if option.body:
            actual_body = json_format.MessageToDict(
                getattr(request, option.body), always_print_fields_with_no_presence=True)
            assert actual_body == http["request"]["body"], (endpoint["rpc"], actual_body)
            assert rpc["metadata"]["confirmation-id"]
            assert rpc["metadata"]["idempotency-key"] == http["request"]["headers"]["Idempotency-Key"]
        if http["response"]["status"] >= 400:
            parse("trade.filing.v1.HttpProblem", http["response"]["body"])
            parse("trade.filing.v1.RpcFailure", rpc["error"]["details"])
            assert rpc["error"]["code"] in ("NOT_FOUND", "FAILED_PRECONDITION")
            assert "response" not in rpc
            assert http["response"]["headers"]["Content-Type"] == "application/problem+json"
            assert rpc["error"]["details"]["httpStatus"] == http["response"]["status"]
            assert rpc["error"]["details"]["errors"] == http["response"]["body"]["errors"]
        else:
            response = parse(method.output_type.full_name, rpc["response"])
            resource = response.DESCRIPTOR.fields_by_name["resource"].message_type.full_name
            parse(resource, http["response"]["body"])
            assert rpc["response"]["resource"] == http["response"]["body"]
            assert http["response"]["status"] == int(endpoint["status"])
            if endpoint["method"] == "POST":
                assert http["response"]["headers"]["Location"].startswith(("/api/", "/internal/"))
        head, body = http["httpResponse"].split("\n\n", 1)
        assert head.startswith("HTTP/1.1 " + str(http["response"]["status"]))
        assert json.loads(body) == http["response"]["body"]
        assert http["response"]["headers"]["Cache-Control"] == "no-store"
        assert "--retry" not in http["curl"]
        assert "--request " + endpoint["method"] in http["curl"]
        subprocess.run(["bash", "-n"], input=http["curl"], text=True, check=True)
        checks.append({"rpc": endpoint["rpc"], "passed": True,
                       "status": http["response"]["status"]})
    result = {"endpoints": len(checks), "typedFailures": sum(
        item["status"] >= 400 for item in checks), "checks": checks,
        "strictUnknownFieldRejection": True, "curlSyntaxChecks": len(checks)}
    for case in json.loads((FOLDER / "fee-evidence-cases.json").read_text()):
        parse("trade.funds.v1.CreateBankReceiptEvidenceReqMsg", case["request"])
        assert case["expectedError"] == "BANK_EVIDENCE_REQUIRED"
        assert case["cargoBucketsUnchanged"]
    result["typedIndependentFeeEvidenceCases"] = 2
    projection = json.loads((FOLDER / "entity-projection.json").read_text())
    assert projection["bankSuccess"] is False
    ddl = (ROOT / "doc/sql/domain/schema.sql").read_text()
    for table, rows in projection["sourceTableProjections"].items():
        block = re.search(r"CREATE TABLE `" + table + r"` \((.*?)\n\) ENGINE",
                          ddl, re.S).group(1)
        fields = dict(re.findall(r"^\s*`([^`]+)` ([A-Z]+)", block, re.M))
        for row in rows:
            assert set(row).issubset(fields), (table, set(row) - set(fields))
            for name, value in row.items():
                if value is None:
                    continue
                kind = fields[name]
                if kind == "DECIMAL":
                    assert isinstance(value, str) and re.fullmatch(r"\d+\.\d{2}", value)
                elif kind == "JSON":
                    assert isinstance(value, (list, dict))
                elif kind in ("BIGINT", "INT", "TINYINT", "SMALLINT"):
                    assert isinstance(value, int) and not isinstance(value, bool)
                else:
                    assert isinstance(value, str)
    result["authoritativeEntityTableProjections"] = len(projection["sourceTableProjections"])
    for name, invalid in [
        ("trade.funds.v1.GetTradeFundsOverviewReqMsg", {"tradeNumber": "X", "unknown": True}),
        ("trade.filing.v1.RpcFailure", {"code": "X", "unknown": True}),
        ("trade.funds.v1.FundAllocationDecisionInput", {"outcome": "NOT_AN_ENUM"}),
    ]:
        try:
            parse(name, invalid)
        except json_format.ParseError:
            pass
        else:
            raise AssertionError("Unexpected acceptance of invalid typed JSON: " + name)
    result["negativeTypedJsonChecks"] = 3
    print(json.dumps(result))
finally:
    output.unlink(missing_ok=True)
