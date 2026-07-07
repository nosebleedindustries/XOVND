#!/usr/bin/env python3
"""Route ONE clearance variant of the display carrier, end to end, and print a JSON result.

Usage (with KiCad's python):  python.exe carrier_route_variant.py <clearance_um>
  e.g. 150 = 0.15 mm.  Isolated per-variant filenames (dc_<um>.*), so many can run in parallel.

Pipeline:  base DSN -> substitute clearance -> Freerouting (-de/-do, -mp 40)
        -> import .ses into a COPY of the real board -> pour GND (F.Cu+B.Cu, full pads)
        -> netclass clearance 0.15 (AISLER) -> kicad-cli DRC -> RESULT_JSON:{...}"""
import pcbnew, os, re, sys, json, subprocess, shutil
from collections import Counter
CLR  = int(sys.argv[1])                       # clearance, micrometres
HERE = r"C:\Users\stala\Downloads\display_carrier"
ROUT = os.path.join(HERE, "routing")
JAR  = r"C:\Users\stala\Downloads\modular_8enc_i2c_board\routing\freerouting-2.2.4.jar"
CLI  = r"C:\Program Files\KiCad\9.0\bin\kicad-cli.exe"
REAL = os.path.join(HERE, "display_carrier.kicad_pcb")
base = os.path.join(ROUT, "display_carrier.dsn")
vdsn = os.path.join(ROUT, f"dc_{CLR}.dsn")
vses = os.path.join(ROUT, f"dc_{CLR}.ses")
vpcb = os.path.join(ROUT, f"dc_{CLR}.kicad_pcb")

# 1. clearance-substituted DSN (only the standalone (clearance 150); leave smd_smd 50 alone)
t = open(base, encoding="utf-8").read()
t = re.sub(r'\(clearance 150\)', f'(clearance {CLR})', t)
open(vdsn, "w", encoding="utf-8").write(t)

# 2. Freerouting
fr = subprocess.run(["java","-jar",JAR,"-de",vdsn,"-do",vses,"-mp","40"],
                    capture_output=True, text=True, timeout=420)
routed = os.path.exists(vses) and os.path.getsize(vses) > 500

# 3. import SES into a copy of the REAL (graphics-intact) board + pour GND
shutil.copy(REAL, vpcb)
b = pcbnew.LoadBoard(vpcb)
if routed:
    try: pcbnew.ImportSpecctraSES(b, vses)
    except TypeError: pcbnew.ImportSpecctraSES(vses)
    b.BuildConnectivity()
    gc = b.FindNet("GND").GetNetCode()
    bb = b.GetBoardEdgesBoundingBox(); M = pcbnew.FromMM(0.35)
    x0,y0,x1,y1 = bb.GetLeft()+M, bb.GetTop()+M, bb.GetRight()-M, bb.GetBottom()-M
    for layer in (pcbnew.F_Cu, pcbnew.B_Cu):
        z = pcbnew.ZONE(b); z.SetLayer(layer); z.SetNetCode(gc); z.SetMinThickness(pcbnew.FromMM(0.2))
        z.SetPadConnection(pcbnew.ZONE_CONNECTION_FULL)
        ch = pcbnew.SHAPE_LINE_CHAIN()
        for (px,py) in [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]: ch.Append(px,py)
        ch.SetClosed(True); z.Outline().AddOutline(ch); b.Add(z)
    pcbnew.ZONE_FILLER(b).Fill(b.Zones())
ds = b.GetDesignSettings(); ds.m_NetSettings.GetDefaultNetclass().SetClearance(pcbnew.FromMM(0.15))
b.BuildConnectivity(); pcbnew.SaveBoard(vpcb, b)

# 4. authoritative DRC + track/via stats
drcj = os.path.join(ROUT, f"dc_{CLR}_drc.json")
subprocess.run([CLI,"pcb","drc","--format","json","-o",drcj,vpcb], capture_output=True)
d = json.load(open(drcj, encoding="utf-8"))
viol = d.get("violations", []); un = d.get("unconnected_items", [])
SILK = {"silk_edge_clearance", "silk_overlap", "silk_over_copper", "silk_overlap_item"}
drc_hard = sum(1 for x in viol if x["type"] not in SILK)   # real (non-cosmetic) violations
b2 = pcbnew.LoadBoard(vpcb)
ntracks = sum(1 for _ in b2.GetTracks())
nvias   = sum(1 for x in b2.GetTracks() if isinstance(x, pcbnew.PCB_VIA))
res = {"clearance_um": CLR, "routed_ses": routed, "unconnected": len(un),
       "drc": len(viol), "drc_hard": drc_hard,
       "drc_types": dict(Counter(x['type'] for x in viol)),
       "tracks": ntracks, "vias": nvias, "board": vpcb}
print("RESULT_JSON:" + json.dumps(res))
