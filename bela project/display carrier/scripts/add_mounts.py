import pcbnew, os
HERE=r"C:\Users\stala\Downloads\display_carrier"
OUT=os.path.join(HERE,"display_carrier.kicad_pcb")
MHDIR=os.path.join(HERE,"lib.pretty")   # local lib
FromMM=pcbnew.FromMM; V2=pcbnew.VECTOR2I
# FootprintLoad must run BEFORE LoadBoard touches the IO plugin (KiCad 9 quirk — same as gen_carrier)
mh=[pcbnew.FootprintLoad(MHDIR,"MountingHole_2.7mm_M2.5") for _ in range(4)]
assert all(mh), "MountingHole load failed"
b=pcbnew.LoadBoard(OUT)
# footprint extents
xs=[];ys=[]
for f in b.GetFootprints():
    bb=f.GetBoundingBox(False,False); xs+=[bb.GetLeft()/1e6,bb.GetRight()/1e6]; ys+=[bb.GetTop()/1e6,bb.GetBottom()/1e6]
M=7.0
X0=round(min(xs)-M,1);X1=round(max(xs)+M,1);Y0=round(min(ys)-M,1);Y1=round(max(ys)+M,1)
# replace edge cuts
for d in list(b.GetDrawings()):
    if d.GetLayer()==pcbnew.Edge_Cuts: b.Remove(d)
def seg(x1,y1,x2,y2):
    s=pcbnew.PCB_SHAPE(b);s.SetShape(pcbnew.SHAPE_T_SEGMENT)
    s.SetStart(V2(FromMM(x1),FromMM(y1)));s.SetEnd(V2(FromMM(x2),FromMM(y2)))
    s.SetLayer(pcbnew.Edge_Cuts);s.SetWidth(FromMM(0.1));b.Add(s)
for (a,c,d,e) in [(X0,Y0,X1,Y0),(X1,Y0,X1,Y1),(X1,Y1,X0,Y1),(X0,Y1,X0,Y0)]: seg(a,c,d,e)
# 4 corner M2.5 mounting holes (2.7mm NPTH) in the BARE outer margin (outside the old GND
# plane, which stays inset ~0.35 from the OLD edges) so no hole_clearance to copper. Inset 2.5mm.
holes=[(X0+2.5,Y0+2.5),(X1-2.5,Y0+2.5),(X0+2.5,Y1-2.5),(X1-2.5,Y1-2.5)]
for i,((hx,hy),fp) in enumerate(zip(holes,mh),1):
    fp.SetReference("H%d"%i); fp.SetPosition(V2(FromMM(hx),FromMM(hy)))
    b.Add(fp)
print("edges+holes ok", flush=True)
# holes sit in the bare outer margin (outside the GND plane) -> no re-fill needed
# (ZONE_FILLER hangs on this 2-plane board; the existing fill stays valid).
b.BuildConnectivity()
pcbnew.SaveBoard(OUT,b)
print("board %.1f x %.1f mm | holes at:"%(X1-X0,Y1-Y0), [(round(h[0],1),round(h[1],1)) for h in holes])
