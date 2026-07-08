import Part
from FreeCAD import Vector as V
import math, time
D=r"C:\Users\stala"
def load(f,tx,ty,tz,name):
    t=time.time(); s=Part.Shape(); s.read(f); s.translate(V(tx,ty,tz))
    print("  loaded %-6s %d solids (%.1fs)"%(name,len(s.Solids),time.time()-t),flush=True); return s
shapes=[]
shapes.append(load(D+r"\Downloads\bela_gem_cad\pocketbeagle2.step",332.4,-269.4,4.7,"PB2"))
shapes.append(load(D+r"\Downloads\pb2_midi\bela_gem.step",-103.3,117.1,11.7,"BELA"))
_mi=Part.Shape(); _mi.read(D+r"\Downloads\pb2_midi\pb2_midi.step")
_mi.rotate(V(0,0,0),V(0,0,1),180); _mi.translate(V(40.75,-70.5,2))   # flip 180deg -> jacks face front
shapes.append(_mi); print("  loaded MIDI (flipped 180) %d solids"%len(_mi.Solids),flush=True)
shapes.append(load(D+r"\Downloads\display_carrier\display_carrier.step",-72,79.5,22.85,"CARR"))
# TRS jack bodies (Lumberg 1503 model not installed in this KiCad -> add approximations)
def jack(cx,cy,cz,axis):
    if axis=='Y':
        bd=Part.makeBox(7.5,7,6,V(cx-3.75,cy-3.5,cz-3)); br=Part.makeCylinder(3,9,V(cx,cy+2,cz),V(0,-1,0))
    else:
        bd=Part.makeBox(6,7.5,7,V(cx-3,cy-3.75,cz-3.5)); br=Part.makeCylinder(3,9,V(cx-2,cy,cz),V(1,0,0))
    return bd.fuse(br)
for (cx,cy) in [(26.1,-60.0),(15.4,-60.0)]: shapes.append(jack(cx,cy,5.0,'Y'))   # MIDI, front
for (cx,cy) in [(52.0,23.0),(52.0,12.3)]:   shapes.append(jack(cx,cy,16.0,'X'))  # Bela audio, right edge
def hexp(cx,cy,z0,z1,af=5.0):
    R=af/(2*math.cos(math.radians(30)))
    pts=[V(cx+R*math.cos(math.radians(30+60*i)),cy+R*math.sin(math.radians(30+60*i)),z0) for i in range(6)]
    pts.append(pts[0]); return Part.Face(Part.makePolygon(pts)).extrude(V(0,0,z1-z0))
for (x,y) in [(-68.3,73.4),(120.8,73.4),(-68.3,-2.4),(120.8,-2.4)]:
    shapes.append(hexp(x,y,0.0,22.8))
# 6-way IDC ribbon: MIDI board J3 -> carrier J_MIDI (underside)
import FreeCAD
_A=FreeCAD.Vector(24.75,-32.5,8.6); _B=FreeCAD.Vector(-12,0.5,16.0); _d=_B.sub(_A)
_rib=Part.makeBox(_d.Length,8.0,0.7, FreeCAD.Vector(0,-4,-0.35))
_rib.Placement=FreeCAD.Placement(_A, FreeCAD.Rotation(FreeCAD.Vector(1,0,0), _d))
shapes.append(_rib); print("  ribbon %.0f mm added"%_d.Length,flush=True)
print("  compounding %d shapes..."%len(shapes),flush=True)
comp=Part.Compound(shapes)
OUT=D+r"\Downloads\XOVND_ensemble.step"
comp.exportStep(OUT); import os
print("EXPORTED %s (%.1f MB)"%(OUT, os.path.getsize(OUT)/1e6),flush=True)
