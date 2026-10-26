"""Verify ClamAV using memory-only clean and inert EICAR test bytes."""
from verify_antivirus_support import request, scan_database_fresh


assert request(b"PING") == "PONG"
version = scan_database_fresh()
assert request(b"INSTREAM", b"export-trade clean infrastructure check\n").endswith(": OK")
eicar = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
assert "FOUND" in request(b"INSTREAM", eicar), "Detection self-test failed"
print("ClamAV: " + version + "; clean stream accepted; inert test signature detected.")
