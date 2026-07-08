# -*- coding: utf-8 -*-
"""Minimal client for the ahujasid/blender-mcp addon socket (127.0.0.1:9876).
Usage: python bl.py <code.py>   OR   python bl.py get_scene_info"""
import socket, json, sys
def call(cmd, timeout=300):
    s = socket.create_connection(("127.0.0.1", 9876), timeout=timeout)
    s.settimeout(timeout)
    s.sendall(json.dumps(cmd).encode("utf-8"))
    buf = b""
    while True:
        try:
            d = s.recv(1 << 16)
        except socket.timeout:
            break
        if not d:
            break
        buf += d
        try:
            json.loads(buf.decode("utf-8"))
            break
        except Exception:
            continue
    s.close()
    return buf.decode("utf-8", errors="replace")
if __name__ == "__main__":
    a = sys.argv[1] if len(sys.argv) > 1 else "get_scene_info"
    if a.endswith(".py"):
        code = open(a, encoding="utf-8").read()
        print(call({"type": "execute_code", "params": {"code": code}}))
    else:
        print(call({"type": a, "params": {}}))
