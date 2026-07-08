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
    "U1":  ("PB2",             "PocketBeagle2",     "PB2 stack",  165.0, -26.0,   0),  # BOTTOM SKIRT (below the lower encoder row) — clean faceplate front; sandwich hangs off the bottom edge
    "JA":  ("PinSocket_2x15_P1.27mm_Vertical", "DISP_A", "P5-2x15",  61.0, 30.7,  90),  # socket pad-centre = the ACTUAL H685 P5 body (verified in STEP at 69.9,31.3)
    "JB":  ("PinSocket_2x15_P1.27mm_Vertical", "DISP_B", "P5-2x15", 137.8, 19.3, 270),  # socket pad-centre = the ACTUAL H685 P5 body (verified in STEP at 128.9,18.7)
    "J_PWR":("TerminalBlock_bornier-2_P5.08mm","PWR_IN","+5V/GND", 16.0, -26.0,   0),  # bottom skirt (left)
    "J_MIDI":("PinHeader_2x03_P2.54mm_Vertical","MIDI_HUB","2x3-IDC", 60.0, -26.0, 0),  # bottom skirt (centre) — MIDI ribbon plugs in here
    # --- RP2040 encoder-reader subsystem, on B.Cu (back), grouped in the skirt between J_MIDI and U1.
    #     MECHANICAL PLACEMENT ONLY (footprints correct; wiring goes in a proper schematic next). ---
    "U2":  ("RP2040_QFN56",       "RP2040",   "RP2040",         100.0, -17.0,  0),   # the MCU (reads 12 enc A/B + I2C to Beagle)
    "U3":  ("Flash_SOIC8",        "W25Q128",  "W25Q128JVSIQ",    87.0, -15.0,  0),   # QSPI boot flash
    "Y1":  ("XTAL_3225",          "12MHz",    "ABM8-272",       112.0, -13.0,  0),   # 12 MHz crystal (USB clock)
    "U4":  ("LDO_SOT235",         "3V3",      "AP2112K-3.3",    121.0, -14.0,  0),   # 5V -> 3.3V rail
    "U5":  ("SR_74HC165_SOIC16",  "74HC165",  "74HC165",         82.0, -33.0, 90),   # switch shift-reg 1 (enc SW 1-8)
    "U6":  ("SR_74HC165_SOIC16",  "74HC165",  "74HC165",        108.0, -33.0, 90),   # switch shift-reg 2 (enc SW 9-12 + spare)
    "J_USB":("USBC",              "USB",      "USB-C",           95.0, -47.5,  0),   # flashing (UF2) / optional power
}
# --- 12 endless (no-detent) rotary encoders (Bourns PEC12R-4020F class), on F.Cu (knobs up,
#     same face as the displays): 6 ABOVE + 6 BELOW the display strip. Parameterised to match the
#     hand-placed reference: each screen is treated on its own, the 3 encoders' SHAFTS centred on the
#     display and spaced by one icon = active_width / 3. Active width from the LILYGO DWG (82.56 mm),
#     taken CENTRED on the module (matches the reference placement + physical module symmetry).
#     KEY: gen places the footprint ORIGIN (pad A), but the visible shaft/bushing is at (7.5, 2.5) from
#     it — so we put the SHAFT on the icon centre and back-solve the origin (origin = shaft - offset). ---
_AW  = 82.56                                           # active-area long dimension (LILYGO DWG)
_SP  = _AW / 3.0                                        # 27.52 mm — one icon / partition width
_SHX, _SHY = 7.5, 2.5                                  # bushing/shaft offset from the footprint origin (rot 0)
def _cols3(center):                                    # 3 SHAFT x's centred on the display, one per icon (thirds)
    return [round(center + k * _SP, 3) for k in (-1, 0, 1)]
_shaft_x = _cols3(PARTS["DS1"][3]) + _cols3(PARTS["DS2"][3])   # centre on each module centre (55.0 / 143.8)
_Y_TOP_SH, _Y_BOT_SH = 48.5, 1.5                       # shaft rows, symmetric about the display centre (Y = 25)
for _i, _sx in enumerate(_shaft_x, 1):                 # origin = shaft - bushing offset (rot 0)
    PARTS["ET%d" % _i] = ("RotaryEncoder_PEC12R_Vertical", "ENC", "PEC12R-4020F-S0024", round(_sx - _SHX, 3), round(_Y_TOP_SH - _SHY, 3), 0)  # top row
    PARTS["EB%d" % _i] = ("RotaryEncoder_PEC12R_Vertical", "ENC", "PEC12R-4020F-S0024", round(_sx - _SHX, 3), round(_Y_BOT_SH - _SHY, 3), 0)  # bottom row
# JA/JB pin order: 1=+5V 2=GND 3=TX 4=RX 5=RST  ·  J_PWR: 1=+5V 2=GND
# Displays powered from J_PWR (NOT the Beagle rail); PB2 sandwich carries only GND + data.
NETS = {
    "+5V":    [("J_PWR","1"),("JA","27"),("JB","27")],   # VBUS -> both panels via P5 pin 27
    # JA/JB = the P5 2x15 socket (30 pads). Wire only what the panel needs, on the real P5 pins:
    #   +5V=pad27(VBUS)  GND=pads1,2  TX(U0RXD)=pad18  RX(U0TXD)=pad16  (RST not on P5 -> dropped)
    "GND":    [("J_PWR","2"),("U1","P1.16"),("U1","P2.15"),("JA","1"),("JA","2"),("JB","1"),("JB","2"),("J_MIDI","2"),("J_MIDI","5")],
    "DA_TX":  [("U1","P1.29"),("JA","18")],   # PRU0.7 -> panel A U0RXD
    "DA_RX":  [("U1","P1.31"),("JA","16")],   # PRU0.4 <- panel A U0TXD
    "DB_TX":  [("U1","P2.28"),("JB","18")],   # PRU1.15 -> panel B U0RXD
    "DB_RX":  [("U1","P2.30"),("JB","16")],   # PRU1.12 <- panel B U0TXD
    # --- MIDI-board ribbon, distributed DOWN to the Beagle via U1. UART4 (P2.5/7) is taken by the
    #     Bela's audio, so MIDI RX/TX land on free Beagle pins (soft-serial, like the displays). ---
    "+3V3":     [("J_MIDI","1"),("U1","P2.23")],   # Beagle 3.3V rail -> MIDI board
    "MIDI_RX":  [("J_MIDI","3"),("U1","P2.32")],   # MIDI IN  -> free Beagle pin
    "MIDI_TX":  [("J_MIDI","4"),("U1","P2.34")],   # MIDI OUT <- free Beagle pin
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
for ref in ("U1","J_PWR","J_MIDI","U2","U3","Y1","U4","U5","U6","J_USB"):   # connectors + RP2040 subsystem -> B.Cu (back); JA/JB + encoders stay on F.Cu (faceplate)
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
