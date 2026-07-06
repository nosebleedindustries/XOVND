# -*- coding: utf-8 -*-
"""Open the assembly in FreeCAD GUI, apply colours, fit the view, maximise the
window, and LEAVE IT OPEN (for a desktop screenshot). Does not saveImage/close."""
import FreeCAD as App, FreeCADGui as Gui, json, os
HERE = r"C:\Users\stala\Downloads\bela_gem_cad"
COLORS = json.load(open(os.path.join(HERE, "colors.json")))
doc = App.openDocument(os.path.join(HERE, "bela_gem_light.FCStd"))
mw = Gui.getMainWindow(); mw.showMaximized()
for _ in range(10): Gui.updateGui()
for o in doc.Objects:
    try:
        o.ViewObject.Visibility = True
        if o.Name in COLORS:
            c = COLORS[o.Name]; o.ViewObject.ShapeColor = (float(c[0]), float(c[1]), float(c[2]))
    except Exception: pass
for _ in range(10): Gui.updateGui()
v = Gui.activeDocument().activeView()
v.viewAxonometric()
for _ in range(8): v.fitAll(); Gui.updateGui()
print("READY_FOR_SCREENSHOT")
