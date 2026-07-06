# -*- coding: utf-8 -*-
import FreeCAD as App, FreeCADGui as Gui, json, os
HERE = r"C:\Users\stala\Downloads\bela_gem_cad"
COLORS = json.load(open(os.path.join(HERE, "colors.json")))
doc = App.openDocument(os.path.join(HERE, "bela_gem_stereo.FCStd"))
for _ in range(6): Gui.updateGui()
for o in doc.Objects:
    try:
        o.ViewObject.Visibility = True
        if o.Name in COLORS:
            c = COLORS[o.Name]; o.ViewObject.ShapeColor = (float(c[0]), float(c[1]), float(c[2]))
    except Exception: pass
for _ in range(6): Gui.updateGui()
v = Gui.activeDocument().activeView()
def shot(fname, setv):
    setv()
    for _ in range(4): v.fitAll(); Gui.updateGui()
    v.saveImage(os.path.join(HERE, fname), 2000, 1300, "White"); print("saved", fname)
shot("bela_fc_iso.png", v.viewAxonometric)
shot("bela_fc_front.png", v.viewFront)
App.closeDocument(doc.Name); Gui.getMainWindow().close()
