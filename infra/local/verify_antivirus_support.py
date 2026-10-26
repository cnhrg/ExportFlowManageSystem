"""ClamAV protocol helpers shared by real-dependency verification."""
import socket
import struct
from datetime import datetime, timedelta, timezone


def request(command, payload=None):
    with socket.create_connection(("127.0.0.1", 3310), timeout=3) as connection:
        connection.settimeout(10)
        connection.sendall(b"z" + command + b"\0")
        if payload is not None:
            for start in range(0, len(payload), 65536):
                chunk = payload[start:start + 65536]
                connection.sendall(struct.pack("!I", len(chunk)) + chunk)
            connection.sendall(b"\0\0\0\0")
        result = b""
        while not result.endswith(b"\0"):
            chunk = connection.recv(4096)
            if not chunk:
                raise RuntimeError("ClamAV disconnected before complete response")
            result += chunk
        return result.rstrip(b"\0").decode()


def scan(payload):
    return request(b"INSTREAM", payload)


def scan_database_fresh():
    version = request(b"VERSION")
    timestamp = datetime.strptime(version.split("/", 2)[2], "%a %b %d %H:%M:%S %Y").replace(tzinfo=timezone.utc)
    if not timedelta(0) <= datetime.now(timezone.utc) - timestamp < timedelta(days=7):
        raise RuntimeError("ClamAV signature timestamp outside local validation policy")
    return version
