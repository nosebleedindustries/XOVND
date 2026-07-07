#!/usr/bin/env python3
"""Export Specctra DSN for Freerouting (2-layer, both F/B signal). Tries a direct
export; if KiCad aborts on footprint courtyard graphics ('non-closed outline'),
strips footprint graphics and retries (real board keeps them; SES imports back).
Sets DSN clearance to 0.15 (AISLER min space)."""
import pcbnew, os, re
HERE = r"C:\Users\stala\Downloads\pb2_midi"
b = pcbnew.LoadBoard(os.path.join(HERE, "pb2_midi.kicad_pcb")); b.BuildConnectivity()
os.makedirs(os.path.join(HERE, "routing"), exist_ok=True)
dsn = os.path.join(HERE, "routing", "pb2_midi.dsn")
def export():
    try: pcbnew.ExportSpecctraDSN(b, dsn)
    except TypeError: pcbnew.ExportSpecctraDSN(dsn)
ok = False
try:
    export(); ok = os.path.exists(dsn) and os.path.getsize(dsn) > 1000
except Exception as e:
    print("direct export failed:", e)
if not ok:
    print("stripping footprint graphics and retrying...")
    for fp in b.GetFootprints():
        rem = [d for d in fp.GraphicalItems() if isinstance(d, pcbnew.PCB_SHAPE)]
        for d in rem:
            fp.Remove(d)
    b.BuildConnectivity(); export()
t = open(dsn, encoding="utf-8").read()
t = re.sub(r'\(clearance 2\d\d(\.\d+)?\)', '(clearance 150)', t)   # 0.20/0.25 -> 0.15
open(dsn, "w", encoding="utf-8").write(t)
print("DSN:", os.path.getsize(dsn), "bytes ->", dsn)
