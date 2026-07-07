# -*- coding: utf-8 -*-
"""PocketBeagle 2 MIDI board (MIDI-only, RIBBON-connected) — script-generated PCB.
Compact remote jack-board: MIDI IN (opto-isolated H11L1) + MIDI OUT (TRS Type-A).
NO PB2 cape footprint — connects to the Beagle by a 6-pin (2x3) IDC ribbon so it lies
flat -> thin device. Ribbon J3: 1=+3V3, 2=GND, 3=UART_RX, 4=UART_TX, 5=GND, 6=NC.
Taps PB2 pads P2.23=+3V3, P2.15=GND, P2.5=UART4.RX, P2.7=UART4.TX.
H11L1: 1=Anode 2=Cathode 3=NC 4=Vo 5=GND 6=Vcc. Jack pads T/R/S. TRS-A: Tip=DIN5, Ring=DIN4, Sleeve=DIN2."""
import pcbnew, os, json, subprocess
from collections import Counter
HERE = r"C:\Users\stala\Downloads\pb2_midi"
LIB  = os.path.join(HERE, "lib.pretty")
FromMM = pcbnew.FromMM; V2 = pcbnew.VECTOR2I
CLI  = r"C:\Program Files\KiCad\9.0\bin\kicad-cli.exe"
OUT  = os.path.join(HERE, "pb2_midi.kicad_pcb")

# ---- parts: ref -> (footprint, value, MPN, x, y, rot) ----
# Compact single-sided jack-board: jacks on the bottom edge (out), ribbon header J3 on top.
PARTS = {
    # panel-edge row (face -Y), all 10.7mm apart & aligned: 2 jacks + power button
    "J1": ("Jack_3.5mm_Lumberg_1503_03_Horizontal","MIDI_IN", "Lumberg1503-03", 14.65, 8.0,  0),
    "J2": ("Jack_3.5mm_Lumberg_1503_03_Horizontal","MIDI_OUT","Lumberg1503-03", 25.35, 8.0,  0),
    "SW1":("SW_Push_1P1T-MP_NO_Horizontal_Alps_SKRTLAE010","PWR","SKRTLAE010",  36.05, 8.0,  0),
    "U2": ("DIP-6_W7.62mm",                    "H11L1M",   "H11L1M",           20.0, 23.0,   0),
    "J3": ("PinHeader_2x03_P2.54mm_Horizontal","RIBBON",   "2x3-2.54-IDC-RA",  16.0, 37.0,  90),
    "J4": ("PinHeader_1x03_P2.54mm_Horizontal","PWR_HDR",  "1x3-2.54-RA",      41.0, 36.0,  90),
    "R1": ("R_0603_1608Metric",                "220",      "RC0603FR-07220RL",  9.0, 20.0,  90),
    "D1": ("D_SOD-123",                        "1N4148",   "1N4148W-7-F",       9.0, 25.0,  90),
    "R4": ("R_0603_1608Metric",                "470",      "RC0603FR-07470RL", 30.0, 20.0,  90),
    "C1": ("C_0603_1608Metric",                "100n",     "CL10B104KB8NNNC",  30.0, 25.0,  90),
    "R2": ("R_0603_1608Metric",                "220",      "RC0603FR-07220RL", 33.0, 20.0,  90),
    "R3": ("R_0603_1608Metric",                "220",      "RC0603FR-07220RL", 33.0, 25.0,  90),
    "C2": ("C_0603_1608Metric",                "100n",     "CL10B104KB8NNNC",  13.0, 30.0,   0),
    "R5": ("R_0603_1608Metric",                "10k",      "RC0603FR-0710KL",  43.0, 22.0,  90),  # PWR pull-up
    "C3": ("C_0603_1608Metric",                "100n",     "CL10B104KB8NNNC",  43.0, 27.0,  90),  # PWR debounce
    # M2.5 mounting holes for the hex spacers that lift the board to jack height
    "H1": ("MountingHole_2.7mm_M2.5",          "M2.5",     "",                  4.0,  5.0,   0),
    "H2": ("MountingHole_2.7mm_M2.5",          "M2.5",     "",                 49.0,  5.0,   0),
    "H3": ("MountingHole_2.7mm_M2.5",          "M2.5",     "",                  4.0, 40.0,   0),
    "H4": ("MountingHole_2.7mm_M2.5",          "M2.5",     "",                 49.0, 40.0,   0),
}
# ---- nets: name -> [(ref, pad), ...] ----  (J3 ribbon to PB2; J4 = power button to sandwich)
NETS = {
    "+3V3":         [("J3","1"),("U2","6"),("R4","1"),("R3","1"),("C1","1"),("C2","1"),("R5","2"),("J4","3")],
    "GND":          [("J3","2"),("J3","5"),("U2","5"),("J2","S"),("C1","2"),("C2","2"),("SW1","2"),("C3","2"),("J4","2")],
    "UART_RX":      [("J3","3"),("U2","4"),("R4","2")],
    "UART_TX":      [("J3","4"),("R2","1")],
    "MIDI_OUT_TIP": [("R2","2"),("J2","T")],
    "MIDI_OUT_RING":[("R3","2"),("J2","R")],
    "MIDI_IN_RING": [("J1","R"),("R1","1")],
    "MIDI_IN_A":    [("R1","2"),("U2","1"),("D1","1")],
    "MIDI_IN_K":    [("U2","2"),("J1","T"),("D1","2")],
    "PWR_BTN":      [("SW1","1"),("R5","1"),("C3","1"),("J4","1")],   # active-low soft power to sandwich
}

# ---- load ALL footprints first (skill §7), then build ----
loaded = {ref: pcbnew.FootprintLoad(LIB, fp) for ref,(fp,*_ ) in PARTS.items()}
assert all(loaded.values()), "FootprintLoad failed: " + str([r for r,f in loaded.items() if not f])

b = pcbnew.NewBoard(OUT)
fps = {}
for ref,(fp,val,mpn,x,y,rot) in PARTS.items():
    f = loaded[ref]
    f.SetReference(ref); f.SetValue(val)
    f.SetPosition(V2(FromMM(x), FromMM(y))); f.SetOrientationDegrees(rot)
    try: f.SetField("MPN", mpn)
    except Exception: pass
    # --- modify the footprint BEFORE b.Add(f) (SWIG handle goes stale after Add) ---
    try:
        for fld in f.GetFields():
            try:
                if fld.GetName() != "Reference": fld.SetVisible(False)
            except Exception: pass
    except Exception: pass
    try: f.Value().SetVisible(False)
    except Exception: pass
    try:
        r = f.Reference()
        r.SetVisible(True); r.SetTextSize(V2(FromMM(1.0), FromMM(1.0))); r.SetTextThickness(FromMM(0.15))
    except Exception: pass
    b.Add(f)
# rebuild fps from the board — pre-Add Python handles go stale after Add (SWIG)
fps = {ff.GetReference(): ff for ff in b.GetFootprints()}

# nets
netmap = {}
def net(name):
    if name not in netmap:
        n = pcbnew.NETINFO_ITEM(b, name); b.Add(n); netmap[name] = n
    return netmap[name]
miss=[]
for name, conns in NETS.items():
    n = net(name)
    for ref, pad in conns:
        ps = [p for p in fps[ref].Pads() if p.GetNumber() == pad]   # all pads w/ that number
        if not ps: miss.append((ref,pad)); continue
        for p in ps: p.SetNet(n)
print("nets:", len(NETS), "| missing pads:", miss)

# design rules (AISLER 2-layer HASL, §12)
ds = b.GetDesignSettings()
ds.m_CopperEdgeClearance = FromMM(0.3)
ds.m_HoleClearance = FromMM(0.1)           # copper-to-hole (Alps SW NPTH sits close to its own pads; NPTH is unplated so 0.1 is fab-safe)
ds.m_HoleToHoleMin = FromMM(0.25)
nc = ds.m_NetSettings.GetDefaultNetclass()
nc.SetClearance(FromMM(0.15)); nc.SetTrackWidth(FromMM(0.25))   # AISLER: space>=0.15, track>=0.2
nc.SetViaDiameter(FromMM(0.7)); nc.SetViaDrill(FromMM(0.3))

# board outline: bbox of all fps + margin, rect
bb = b.GetBoardEdgesBoundingBox() if False else None
xs=[]; ys=[]
for f in fps.values():
    bx=f.GetBoundingBox(False, False)
    xs += [bx.GetLeft()/1e6, bx.GetRight()/1e6]; ys += [bx.GetTop()/1e6, bx.GetBottom()/1e6]
M=3.0
X0=round(min(xs)-M,1); X1=round(max(xs)+M,1); Y0=round(min(ys)-M,1); Y1=round(max(ys)+M,1)
# jacks (Lumberg) now face -Y: the panel edge is the MIN-Y side. Trim it flush with
# the jack front (barrel pokes through the 1mm folded/laser-cut cover).
Y0=round(min(ys),1)
def seg(x1,y1,x2,y2):
    s=pcbnew.PCB_SHAPE(b); s.SetShape(pcbnew.SHAPE_T_SEGMENT)
    s.SetStart(V2(FromMM(x1),FromMM(y1))); s.SetEnd(V2(FromMM(x2),FromMM(y2)))
    s.SetLayer(pcbnew.Edge_Cuts); s.SetWidth(FromMM(0.1)); b.Add(s)
for (a,c,d,e) in [(X0,Y0,X1,Y0),(X1,Y0,X1,Y1),(X1,Y1,X0,Y1),(X0,Y1,X0,Y0)]: seg(a,c,d,e)

pcbnew.SaveBoard(OUT, b)
print(f"board {X1-X0:.1f} x {Y1-Y0:.1f} mm saved -> {OUT}")

# DRC
outj=os.path.join(HERE,"_drc.json")
subprocess.run([CLI,"pcb","drc","--format","json","-o",outj,OUT],capture_output=True)
d=json.load(open(outj,encoding="utf-8")); v=d.get("violations",[]); un=d.get("unconnected_items",[])
print("DRC violations:",len(v),dict(Counter(x["type"] for x in v)),"| unconnected:",len(un))
for x in v:
    if x["type"] in ("invalid_outline","courtyards_overlap","shorting_items","solder_mask_bridge","clearance"):
        its=x.get("items",[]); locs=[]
        for it in its:
            locs.append(it.get("description","")[:40])
        print("  ",x["type"],"::"," | ".join(locs)[:150])
