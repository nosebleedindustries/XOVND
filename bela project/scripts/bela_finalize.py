# -*- coding: utf-8 -*-
"""Finalize: drop crude PB2, import the OFFICIAL PocketBeagle 2 (colored) into the
sandwich under the Gem, colour the Gem parts, export a COLOURED STEP (ImportGui)."""
import FreeCAD as App, FreeCADGui as Gui, ImportGui, json, os
HERE = r"C:\Users\stala\Downloads\bela_gem_cad"
COLORS = json.load(open(os.path.join(HERE, "colors.json")))
doc = App.openDocument(os.path.join(HERE, "bela_gem_stereo.FCStd"))
Gui.updateGui()

# 1) remove my crude PB2 boxes/pins (keep the Gem's stack sockets)
for o in list(doc.Objects):
    if o.Name.startswith("PB2") or o.Name.lower().startswith("pocketbeagle"):
        doc.removeObject(o.Name)
doc.recompute()

# 2) colour Gem parts
for o in doc.Objects:
    c = COLORS.get(o.Name, [0.6, 0.6, 0.62])
    try: o.ViewObject.ShapeColor = (float(c[0]), float(c[1]), float(c[2]))
    except Exception: pass

# 3) import official PB2 (keeps its per-part colours)
before = set(o.Name for o in doc.Objects)
ImportGui.insert(os.path.join(HERE, "pocketbeagle2.step"), doc.Name)
doc.recompute()
newo = [o for o in doc.Objects if o.Name not in before and hasattr(o, "Shape")]
print("imported PB2 objects:", len(newo))

# 4) transform PB2 into the sandwich (centre under U1, top just below Gem bottom)
bb = None
for o in newo:
    try:
        b = o.Shape.BoundBox
        bb = b if bb is None else bb.united(b)
    except Exception: pass
cx = (bb.XMin+bb.XMax)/2.0; cy = (bb.YMin+bb.YMax)/2.0; ztop = bb.ZMax
BX, BY, W, H = 103.69, 77.23, 55.05, 44.65
U1x, U1y = 131.22, 99.56
Tx = U1x - BX; Ty = H - (U1y - BY)
ROTZ = 0.0; TOPZ = -1.0                      # PB2 top 1mm below the Gem bottom
place = App.Placement(App.Vector(Tx, Ty, TOPZ), App.Rotation(App.Vector(0,0,1), ROTZ)).multiply(
        App.Placement(App.Vector(-cx, -cy, -ztop), App.Rotation()))
for o in newo:
    o.Placement = place.multiply(o.Placement)
doc.recompute()

# 5) export coloured STEP + save
ImportGui.export(doc.Objects, os.path.join(HERE, "bela_gem_stereo.step"))
doc.saveAs(os.path.join(HERE, "bela_gem_stereo.FCStd"))
print("exported coloured STEP")

# 6) screenshots
for o in doc.Objects:
    try: o.ViewObject.Visibility = True
    except Exception: pass
Gui.updateGui()
v = Gui.activeDocument().activeView()
for nm, setv in [("bela_fc_iso.png", v.viewAxonometric), ("bela_fc_front.png", v.viewFront)]:
    setv(); v.fitAll(); Gui.updateGui(); Gui.updateGui()
    v.saveImage(os.path.join(HERE, nm), 2000, 1300, "White")
    print("saved", nm)
App.closeDocument(doc.Name); Gui.getMainWindow().close()
