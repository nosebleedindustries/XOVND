import Part, os
from FreeCAD import Vector as V
# Lumberg 1503-03 horizontal TRS approximation: plastic body + metal barrel (-Y out the edge)
body=Part.makeBox(11,9,6.5,V(-5.5,-1,0))
barrel=Part.makeCylinder(3,6,V(0,-1,3),V(0,-1,0))
jack=body.fuse(barrel)
dst=r"C:\Program Files\KiCad\9.0\share\kicad\3dmodels\Connector_Audio.3dshapes\Jack_3.5mm_Lumberg_1503_03_Horizontal.step"
try:
    jack.exportStep(dst); print("WROTE_KICAD_PATH")
except Exception as e:
    loc=r"C:\Users\stala\Downloads\pb2_midi\models\Jack_3.5mm_Lumberg_1503_03_Horizontal.step"
    os.makedirs(os.path.dirname(loc),exist_ok=True); jack.exportStep(loc); print("WROTE_LOCAL",loc,e)
