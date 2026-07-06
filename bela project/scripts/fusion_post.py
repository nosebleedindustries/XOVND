import sys, json, httpx
secret=open(r"C:\Users\stala\.fusion-mcp-secret").read().strip()
script=open(sys.argv[1], encoding="utf-8").read()
r=httpx.post("http://127.0.0.1:7654/execute", json={"script":script},
             headers={"Authorization":"Bearer "+secret}, timeout=float(sys.argv[2]) if len(sys.argv)>2 else 60)
print("HTTP", r.status_code)
print(r.text[:2500])
