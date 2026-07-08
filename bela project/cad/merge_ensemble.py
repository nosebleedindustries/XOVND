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
shapes.append(load(D+r"\Downloads\pb2_midi\pb2_midi.step",-12,-24,2,"MIDI"))
shapes.append(load(D+r"\Downloads\display_carrier\display_carrier.step",-72,79.5,22.85,"CARR"))
def hexp(cx,cy,z0,z1,af=5.0):
    R=af/(2*math.cos(math.radians(30)))
    pts=[V(cx+R*math.cos(math.radians(30+60*i)),cy+R*math.sin(math.radians(30+60*i)),z0) for i in range(6)]
    pts.append(pts[0]); return Part.Face(Part.makePolygon(pts)).extrude(V(0,0,z1-z0))
for (x,y) in [(-68.3,73.4),(120.8,73.4),(-68.3,-2.4),(120.8,-2.4)]:
    shapes.append(hexp(x,y,0.0,22.8))
print("  compounding %d shapes..."%len(shapes),flush=True)
comp=Part.Compound(shapes)
OUT=D+r"\Downloads\XOVND_ensemble.step"
comp.exportStep(OUT); import os
print("EXPORTED %s (%.1f MB)"%(OUT, os.path.getsize(OUT)/1e6),flush=True)
