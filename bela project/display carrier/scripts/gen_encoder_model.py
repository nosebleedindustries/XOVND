"""Approximation 3D model for a 12mm vertical panel rotary encoder (Bourns PEC12R /
Alps EC11E-EC12E class) — KiCad ships the footprint but this install's
Rotary_Encoder.3dshapes is EMPTY. Body + threaded bushing + D-shaft, origin at the
shaft axis on the PCB top (matches the footprint origin). Units mm -> STEP."""
import Part
from FreeCAD import Vector as V
import os
OUT = r"C:\Users\stala\Downloads\display_carrier\lib.pretty\RotaryEncoder_12mm_vertical.step"
parts=[]
# body 12 x 13.4 x 6.4, centred on the shaft axis, sitting on F.Cu (Z 0..6.4)
parts.append(Part.makeBox(12.0,13.4,6.4, V(-6.0,-6.7,0.0)))
# threaded bushing Ø7 x 7  (Z 6.4..13.4)
parts.append(Part.makeCylinder(3.5,7.0, V(0,0,6.4), V(0,0,1)))
# shaft Ø6 x 15 (Z 13.4..28.4) with a D-flat milled off
shaft=Part.makeCylinder(3.0,15.0, V(0,0,13.4), V(0,0,1))
flat=Part.makeBox(6.5,1.2,15.0, V(-3.25, 1.8, 13.4))   # D-flat cut
shaft=shaft.cut(flat)
parts.append(shaft)
# 3 solder pins poking below the board (Z -3..0), at the 2.54-ish rear row (cosmetic)
for px in (-2.5,0.0,2.5):
    parts.append(Part.makeBox(0.6,0.4,3.0, V(px-0.3, 5.6, -3.0)))
comp=Part.Compound(parts)
comp.exportStep(OUT)
print("EXPORTED", OUT, "%.1f KB"%(os.path.getsize(OUT)/1024), "| bbox Z", round(comp.BoundBox.ZMin,1),"..",round(comp.BoundBox.ZMax,1))
