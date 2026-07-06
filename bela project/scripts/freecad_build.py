# -*- coding: utf-8 -*-
"""Bela Gem Stereo — detailed CAD build in FreeCAD from the REAL KiCad placement + pads.
True board outline, every THT pad drilled where it belongs, header pins at real pad
positions, connectors with openings/bores.  Run:  FreeCADCmd.exe freecad_build.py"""
import FreeCAD as App, Part, json, os, math
from FreeCAD import Vector as V

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, "placement.json")))
B = D["board"]; BX, BY, W, H = B["x"], B["y"], B["w"], B["h"]
PADS = D["pads"]; FPS = D["footprints"]
T = 1.6
def tx(kx): return kx - BX
def ty(ky): return H - (ky - BY)
def padsof(ref): return [p for p in PADS if p["ref"] == ref]

def box(l, w, h, x=0, y=0, z=0): return Part.makeBox(l, w, h, V(x-l/2., y-w/2., z))
def cyl(r, h, x=0, y=0, z=0, d=V(0,0,1)): return Part.makeCylinder(r, h, V(x, y, z), d)

# ---------- board: true outline from edges, drilled ----------
def edge_shape(e):
    if e[0] == "seg":
        return Part.LineSegment(V(tx(e[1]), ty(e[2]), 0), V(tx(e[3]), ty(e[4]), 0)).toShape()
    if e[0] == "arc":
        return Part.Arc(V(tx(e[1]), ty(e[2]), 0), V(tx(e[3]), ty(e[4]), 0), V(tx(e[5]), ty(e[6]), 0)).toShape()
    return None
def board_solid():
    try:
        es = [edge_shape(e) for e in D["edges"] if edge_shape(e)]
        wire = Part.Wire(Part.__sortEdges__(es))
        sol = Part.Face(wire).extrude(V(0, 0, T))
    except Exception as ex:
        print("outline fallback:", ex)
        sol = Part.makeBox(W, H, T)
        vedges = [e for e in sol.Edges if abs(e.Vertexes[0].Point.z - e.Vertexes[1].Point.z) > T/2]
        sol = sol.makeFillet(3.0, vedges)
    # drill every THT pad (mounting holes + all pins)
    cutters = []
    for p in PADS:
        if p["tht"]:
            r = max(p["drw"], p["drh"]) / 2.0
            cutters.append(cyl(r, T + 2, x=tx(p["x"]), y=ty(p["y"]), z=-1))
    if cutters:
        sol = sol.cut(Part.makeCompound(cutters))
    return sol

# ---------- connector library (opening toward -X; rotated to face nearest edge) ----------
def nearest_edge(cx, cy):
    X, Y = tx(cx), ty(cy)
    return min({'-x': X, '+x': W-X, '-y': Y, '+y': H-Y}.items(), key=lambda kv: kv[1])[0]
FACE_ROT = {'-x': 0, '+x': 180, '+y': -90, '-y': 90}

def c_usb_a():
    # GCT USB1125 compact USB-A: shell ~ 14.8(w) x 11.1(deep) x 6.6, opening -X
    sh = box(11.1, 14.8, 6.6, z=0)
    sh = sh.cut(box(9.0, 12.6, 5.0, x=-1.3, z=0.8))           # port cavity
    sh = sh.fuse(box(8.2, 12.0, 2.0, x=-1.0, z=1.9))          # plastic tongue
    return sh
def c_jack():
    body = box(11.0, 8.0, 6.0)
    barrel = cyl(3.0, 3.4, x=-5.5, y=0, z=3.0, d=V(-1,0,0))    # -X barrel
    barrel = barrel.cut(cyl(1.75, 3.5, x=-5.4, y=0, z=3.0, d=V(-1,0,0)))  # Ø3.5 socket bore
    return body.fuse(barrel)
def c_qwiic():
    b = box(4.25, 6.2, 2.9)
    b = b.cut(box(1.2, 5.0, 1.4, x=-1.5, z=0.8))               # 4-way slot opening -X
    return b
def c_button():
    b = box(3.9, 5.6, 1.9)
    b = b.fuse(cyl(1.7, 0.7, z=1.9))                           # round actuator
    return b, (0.75, 0.75, 0.78)
def c_led(w, h):
    b = box(max(w,1.0), max(h,0.6), 0.7)
    b = b.fuse(box(max(w,1.0)*0.6, max(h,0.6)*0.6, 0.35, z=0.7))
    return b

def place_conn(shape, cx, cy):
    e = nearest_edge(cx, cy); shape = shape.copy()
    shape.rotate(V(0,0,0), V(0,0,1), FACE_ROT[e])
    shape.translate(V(tx(cx), ty(cy), T)); return shape

# ---------- female header from real pad positions ----------
def header_from_pads(ref, hh=8.5):
    ps = padsof(ref)
    xs = [tx(p["x"]) for p in ps]; ys = [ty(p["y"]) for p in ps]
    x0, x1, y0, y1 = min(xs)-1.27, max(xs)+1.27, min(ys)-1.27, max(ys)+1.27
    body = Part.makeBox(x1-x0, y1-y0, hh, V(x0, y0, T))
    pins = []
    for p in ps:                                              # recess + gold pin per pad
        x, y = tx(p["x"]), ty(p["y"])
        body = body.cut(box(1.6, 1.6, 1.2, x=x, y=y, z=T+hh-1.2))
        pins.append(cyl(0.32, hh-0.8, x=x, y=y, z=T))
    return body, Part.makeCompound(pins)

# ---------- build ----------
doc = App.newDocument("BelaGem")
COLORS = {}
def add(name, shape, color=(0.6,0.6,0.62)):
    o = doc.addObject("Part::Feature", name); o.Shape = shape
    COLORS[o.Name] = color; return o

GREEN=(0.09,0.42,0.24); BLACK=(0.10,0.10,0.11); SILVER=(0.72,0.73,0.76); WHITE=(0.93,0.93,0.9)

add("gem_pcb", board_solid(), GREEN)

for f in FPS:
    if f["back"]: continue
    lib = f["lib"].split(":")[-1]; ref = f["ref"]
    if "USB_A" in lib:            add("USB_A", place_conn(c_usb_a(), f["cx"], f["cy"]), SILVER)
    elif "Jack_3.5mm" in lib:     add("Jack_"+ref, place_conn(c_jack(), f["cx"], f["cy"]), BLACK)
    elif "qwiic" in lib:          add("Qwiic", place_conn(c_qwiic(), f["cx"], f["cy"]), WHITE)
    elif "PTS810" in lib:         sh,col=c_button(); add("Button", place_conn(sh, f["cx"], f["cy"]), BLACK)
    elif "LED_LiteOn" in lib:     add("LED_"+ref, place_conn(c_led(f["cw"],f["ch"]), f["cx"], f["cy"]), (0.95,0.95,0.85))
    elif lib.startswith("LED_0603"): add("LED_"+ref, place_conn(c_led(1.6,0.8), f["cx"], f["cy"]), (0.95,0.9,0.5))

for ref in ("J1","J2","J3","J9"):
    body, pins = header_from_pads(ref)
    add("Hdr_"+ref, body, BLACK); add("Pins_"+ref, pins, (0.8,0.7,0.35))

# ---------- stacking: two 2x18 sockets on Gem bottom + PB2 pins, from U1's 72 pads ----------
u1 = padsof("U1")
uy = sorted(set(round(ty(p["y"]),1) for p in u1))
ymid = (uy[0]+uy[-1])/2.0
GAP = 8.4
for grp in (lambda p: ty(p["y"]) < ymid, lambda p: ty(p["y"]) >= ymid):
    g = [p for p in u1 if grp(p)]
    xs=[tx(p["x"]) for p in g]; ys=[ty(p["y"]) for p in g]
    sock = Part.makeBox(max(xs)-min(xs)+3, max(ys)-min(ys)+3, GAP, V(min(xs)-1.5, min(ys)-1.5, -GAP))
    add("stack_sock", sock, BLACK)
    pins=[cyl(0.32, GAP+1.6, x=tx(p["x"]), y=ty(p["y"]), z=-GAP-1.6) for p in g]
    add("PB2_pins", Part.makeCompound(pins), (0.8,0.7,0.35))

# ---------- PocketBeagle 2 (55x35) + USB-C + microSD + SoC ----------
U1c = next(f for f in FPS if f["ref"]=="U1")
ux, uyc = tx(U1c["x"]), ty(U1c["y"]); PBW,PBH = 55.0,35.0
pbtop = -GAP - 1.6;
pb = Part.makeBox(PBW, PBH, 1.6, V(ux-PBW/2, uyc-PBH/2, pbtop-1.6))
ve=[e for e in pb.Edges if abs(e.Vertexes[0].Point.z-e.Vertexes[1].Point.z)>0.8]
try: pb=pb.makeFillet(2.0, ve)
except Exception: pass
add("pocketbeagle2", pb, GREEN)
usbc = box(9.0,3.2,3.1, x=ux-PBW/2+5, y=uyc, z=pbtop); usbc=usbc.fuse(cyl(1.55,9.0,x=ux-PBW/2+5,y=uyc-1.6,z=pbtop+1.55,d=V(0,0,1)))
add("PB2_USBC", box(9.0,3.3,3.1, x=ux-PBW/2+4.5, y=uyc+PBH/2-3, z=pbtop), SILVER)
add("PB2_microSD", box(12,11,1.5, x=ux+PBW/2-8, y=uyc, z=pbtop), SILVER)
add("PB2_SoC", box(11,11,1.1, x=ux, y=uyc, z=pbtop), BLACK)
add("PB2_pmic", box(3,3,0.9, x=ux+8, y=uyc-8, z=pbtop), BLACK)

# ---------- baseplate + 4 M3 8mm spacers + screws ----------
base = Part.makeBox(W+4, H+4, 2.0, V(-2,-2,-10)); vb=[e for e in base.Edges if abs(e.Vertexes[0].Point.z-e.Vertexes[1].Point.z)>1]
try: base=base.makeFillet(4.0, vb)
except Exception: pass
add("baseplate", base, (0.15,0.15,0.16))
for f in FPS:
    if "MountingHole_3.2" in f["lib"]:
        x,y=tx(f["x"]),ty(f["y"])
        add("spacer", cyl(2.5,8.0,x=x,y=y,z=-8).cut(cyl(1.6,8.0,x=x,y=y,z=-8)), (0.72,0.62,0.30))
        add("screw_top", cyl(2.9,1.5,x=x,y=y,z=T).fuse(cyl(1.5,3,x=x,y=y,z=-1)), SILVER)
        add("screw_bot", cyl(2.9,1.5,x=x,y=y,z=-11.5), SILVER)

doc.recompute()
Part.export(doc.Objects, os.path.join(HERE, "bela_gem_light.step"))
doc.saveAs(os.path.join(HERE, "bela_gem_light.FCStd"))
json.dump(COLORS, open(os.path.join(HERE,"colors.json"),"w"))
print("OBJECTS:", len(doc.Objects), "| THT holes drilled:", sum(1 for p in PADS if p["tht"]))
print("exported bela_gem_stereo.step + .FCStd")
