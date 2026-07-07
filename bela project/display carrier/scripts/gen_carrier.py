# -*- coding: utf-8 -*-
"""Display carrier — 2x LILYGO T-Display-S3 Long (640x180 AMOLED bars) mounted
LANDSCAPE and butted on the horizontal axis (one wide ~1280x180 UI strip), on a
board that SANDWICHES onto the Beagle+Bela via the PB2 header block. Each panel is
a smart ESP32 satellite: the carrier only routes power + a PRU-serial link to each
(free pins — PRU0 -> panel A, PRU1 -> panel B). Displays = mechanical footprints
(no electrical pads); the cable to each plugs into JA/JB."""
import pcbnew, os, json, subprocess
from collections import Counter
HERE = r"C:\Users\stala\Downloads\display_carrier"
LIB  = os.path.join(HERE, "lib.pretty")
FromMM = pcbnew.FromMM; V2 = pcbnew.VECTOR2I
CLI  = r"C:\Program Files\KiCad\9.0\bin\kicad-cli.exe"
OUT  = os.path.join(HERE, "display_carrier.kicad_pcb")

# module native 27.2(X) x 88.8(Y); rot 90 -> 88.8 wide x 27.2 tall. Butt at x=99.4.
PARTS = {
    "DS1": ("TDisplayS3Long",  "T-Display-S3-Long", "",            55.0,  25.0,  90),
    "DS2": ("TDisplayS3Long",  "T-Display-S3-Long", "",           143.8,  25.0, 270),
    "U1":  ("PB2",             "PocketBeagle2",     "PB2 stack",  100.0,  62.0,   0),  # sandwich to Beagle+Bela
    "JA":  ("PinHeader_1x05_P2.54mm_Vertical", "DISP_A", "1x5",    55.0,  47.0,   0),  # cable to panel A
    "JB":  ("PinHeader_1x05_P2.54mm_Vertical", "DISP_B", "1x5",   143.8,  47.0,   0),  # cable to panel B
    "J_PWR":("TerminalBlock_bornier-2_P5.08mm","PWR_IN","+5V/GND", 16.0,  64.0,   0),  # dedicated 5V from the main PSU
}
# JA/JB pin order: 1=+5V 2=GND 3=TX 4=RX 5=RST  ·  J_PWR: 1=+5V 2=GND
# Displays powered from J_PWR (NOT the Beagle rail); PB2 sandwich carries only GND + data.
NETS = {
    "+5V":    [("J_PWR","1"),("JA","1"),("JB","1")],
    "GND":    [("J_PWR","2"),("U1","P1.16"),("U1","P2.15"),("JA","2"),("JB","2")],   # common GND: PSU + Beagle + panels
    "DA_TX":  [("U1","P1.29"),("JA","3")],   # PRU0.7 -> panel A
    "DA_RX":  [("U1","P1.31"),("JA","4")],   # PRU0.4 <- panel A
    "DA_RST": [("U1","P1.4"),("JA","5")],    # GPIO89
    "DB_TX":  [("U1","P2.28"),("JB","3")],   # PRU1.15 -> panel B
    "DB_RX":  [("U1","P2.30"),("JB","4")],   # PRU1.12 <- panel B
    "DB_RST": [("U1","P2.33"),("JB","5")],   # GPIO52
}

loaded = {ref: pcbnew.FootprintLoad(LIB, fp) for ref,(fp,*_ ) in PARTS.items()}
assert all(loaded.values()), "FootprintLoad failed: " + str([r for r,f in loaded.items() if not f])
b = pcbnew.NewBoard(OUT)
for ref,(fp,val,mpn,x,y,rot) in PARTS.items():
    f = loaded[ref]
    f.SetReference(ref); f.SetValue(val)
    f.SetPosition(V2(FromMM(x), FromMM(y))); f.SetOrientationDegrees(rot)
    try:
        for fld in f.GetFields():
            try:
                if fld.GetName() != "Reference": fld.SetVisible(False)
            except Exception: pass
    except Exception: pass
    try: f.Value().SetVisible(False)
    except Exception: pass
    try:
        r = f.Reference(); r.SetVisible(True); r.SetTextSize(V2(FromMM(1.4),FromMM(1.4))); r.SetTextThickness(FromMM(0.2))
    except Exception: pass
    b.Add(f)
fps = {ff.GetReference(): ff for ff in b.GetFootprints()}

netmap = {}
def net(n):
    if n not in netmap:
        ni = pcbnew.NETINFO_ITEM(b, n); b.Add(ni); netmap[n] = ni
    return netmap[n]
miss=[]
for name, conns in NETS.items():
    ni = net(name)
    for ref, pad in conns:
        ps = [p for p in fps[ref].Pads() if p.GetNumber() == pad]
        if not ps: miss.append((ref,pad)); continue
        for p in ps: p.SetNet(ni)
print("nets:", len(NETS), "| missing:", miss)

ds = b.GetDesignSettings()
ds.m_CopperEdgeClearance = FromMM(0.3)
nc = ds.m_NetSettings.GetDefaultNetclass()
nc.SetClearance(FromMM(0.15)); nc.SetTrackWidth(FromMM(0.25))
nc.SetViaDiameter(FromMM(0.7)); nc.SetViaDrill(FromMM(0.3))

pcbnew.SaveBoard(OUT, b)   # intermediate: all footprints still on F.Cu
# Screen board is the TOP of the stack -> connectors go on the BACK (B.Cu) so they plug DOWN
# into the Beagle+Bela sandwich; displays stay on F.Cu (facing up). The big PB2 footprint won't
# flip on the just-Add'ed in-memory board (SWIG quirk); a reloaded/deserialized board flips fine.
b = pcbnew.LoadBoard(OUT)
for ref in ("U1","JA","JB","J_PWR"):
    f = b.FindFootprintByReference(ref)
    if f and not f.IsFlipped():   # F.Cu parts -> B.Cu; U1 (PB2) is natively B.Cu already, leave it
        f.Flip(f.GetPosition(), False)
fps = {ff.GetReference(): ff for ff in b.GetFootprints()}

xs=[]; ys=[]
for f in fps.values():
    bx=f.GetBoundingBox(False, False)
    xs += [bx.GetLeft()/1e6, bx.GetRight()/1e6]; ys += [bx.GetTop()/1e6, bx.GetBottom()/1e6]
M=3.0
X0=round(min(xs)-M,1); X1=round(max(xs)+M,1); Y0=round(min(ys)-M,1); Y1=round(max(ys)+M,1)
def seg(x1,y1,x2,y2):
    s=pcbnew.PCB_SHAPE(b); s.SetShape(pcbnew.SHAPE_T_SEGMENT)
    s.SetStart(V2(FromMM(x1),FromMM(y1))); s.SetEnd(V2(FromMM(x2),FromMM(y2)))
    s.SetLayer(pcbnew.Edge_Cuts); s.SetWidth(FromMM(0.1)); b.Add(s)
for (a,c,d,e) in [(X0,Y0,X1,Y0),(X1,Y0,X1,Y1),(X1,Y1,X0,Y1),(X0,Y1,X0,Y0)]: seg(a,c,d,e)

pcbnew.SaveBoard(OUT, b)
print(f"board {X1-X0:.1f} x {Y1-Y0:.1f} mm saved -> {OUT}")
outj=os.path.join(HERE,"_drc.json")
subprocess.run([CLI,"pcb","drc","--format","json","-o",outj,OUT],capture_output=True)
d=json.load(open(outj,encoding="utf-8")); v=d.get("violations",[]); un=d.get("unconnected_items",[])
print("DRC:",len(v),dict(Counter(x["type"] for x in v)),"| unconnected:",len(un))
