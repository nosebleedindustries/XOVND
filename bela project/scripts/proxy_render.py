import sys, os, json, math
sys.path.insert(0, r"C:\Users\stala\Downloads\button_square\cad")
from stepwrl import emit, box
HERE=r"C:\Users\stala\Downloads\bela_gem_cad"
D=json.load(open(os.path.join(HERE,"placement.json")))
B=D["board"]; BX,BY,W,H=B["x"],B["y"],B["w"],B["h"]; T=1.6
def tx(k): return k-BX
def ty(k): return H-(k-BY)
GREEN="0.09 0.42 0.24"; BLK="0.10 0.10 0.11"; SIL="0.72 0.73 0.76"; WHT="0.92 0.92 0.9"; GOLD="0.80 0.70 0.35"; BASE="0.15 0.15 0.16"
s=[]
def bx(c,l,w,h,x,y,z): s.append((c, box(x-l/2,x+l/2,y-w/2,y+w/2,z,z+h)))
# Gem PCB
s.append((GREEN, box(0,W,0,H,0,T)))
for f in D["footprints"]:
    if f["back"]: continue
    lib=f["lib"].split(":")[-1]; x,y=tx(f["cx"]),ty(f["cy"]); cw,ch=f["cw"],f["ch"]
    if "USB_A" in lib: bx(SIL,cw,ch,6.5,x,y,T)
    elif "Jack_3.5mm" in lib: bx(BLK,cw,ch,6,x,y,T)
    elif "qwiic" in lib: bx(WHT,cw,ch,2.9,x,y,T)
    elif "PinSocket" in lib: bx(BLK,cw,ch,8.5,x,y,T)
    elif "PTS810" in lib: bx(SIL,cw,ch,2,x,y,T)
    elif "LED" in lib: bx((0.95,0.95,0.8) if False else "0.95 0.95 0.6",cw,ch,0.8,x,y,T)
# PB2 proxy (sandwiched, top at -1)
u=next(f for f in D["footprints"] if f["ref"]=="U1"); ux,uy=tx(u["x"]),ty(u["y"])
pbz=-1-1.6
s.append((GREEN, box(ux-27.5,ux+27.5,uy-17.5,uy+17.5,pbz-0.0,pbz+1.6)))
bx(BLK,46,5,6,ux,uy-15,pbz+1.6); bx(BLK,46,5,6,ux,uy+15,pbz+1.6)   # 2x18 headers up
bx(SIL,9,3.2,3.1,ux-22,uy,pbz-1.5); bx(SIL,12,11,1.5,ux+20,uy,pbz-1.5); bx(BLK,11,11,1.1,ux,uy,pbz-1.2)
# baseplate + spacers
s.append((BASE, box(-2,W+2,-2,H+2,-10,-8)))
for f in D["footprints"]:
    if "MountingHole_3.2" in f["lib"]:
        x,y=tx(f["x"]),ty(f["y"]); s.append((GOLD, box(x-2.5,x+2.5,y-2.5,y+2.5,-8,0)))
emit(HERE,"bela_proxy", s)
print("proxy solids:", len(s))
