#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extract board outline (with true arc mid-points), every footprint placement,
AND every pad (position + drill) from the Bela Gem Stereo KiCad PCB -> placement.json."""
import pcbnew, os, json
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
b = pcbnew.LoadBoard(os.path.join(HERE, "Bela_Gem_Stereo.kicad_pcb"))
def mm(v): return v / 1e6

# --- outline (Edge.Cuts) with exact arc mids ---
edges = []
for d in b.GetDrawings():
    if d.GetLayer() != pcbnew.Edge_Cuts: continue
    t = d.GetShape()
    if t == pcbnew.SHAPE_T_SEGMENT:
        edges.append(("seg", mm(d.GetStart().x), mm(d.GetStart().y), mm(d.GetEnd().x), mm(d.GetEnd().y)))
    elif t == pcbnew.SHAPE_T_ARC:
        s, m, e = d.GetStart(), d.GetArcMid(), d.GetEnd()
        edges.append(("arc", mm(s.x), mm(s.y), mm(m.x), mm(m.y), mm(e.x), mm(e.y)))
    elif t == pcbnew.SHAPE_T_CIRCLE:
        edges.append(("circ", mm(d.GetCenter().x), mm(d.GetCenter().y), mm(d.GetRadius())))
    elif t == pcbnew.SHAPE_T_RECT:
        edges.append(("rect", mm(d.GetStart().x), mm(d.GetStart().y), mm(d.GetEnd().x), mm(d.GetEnd().y)))

bb = b.GetBoardEdgesBoundingBox()
board = dict(x=mm(bb.GetX()), y=mm(bb.GetY()), w=mm(bb.GetWidth()), h=mm(bb.GetHeight()))

# --- footprints + their pads ---
fps = []; pads = []
for f in b.GetFootprints():
    ref, val, lib = f.GetReference(), f.GetValue(), f.GetFPIDAsString()
    p = f.GetPosition(); rot = f.GetOrientationDegrees(); back = f.IsFlipped()
    try:
        poly = f.GetCourtyard(pcbnew.B_CrtYd if back else pcbnew.F_CrtYd)
        if poly.OutlineCount() == 0: poly = f.GetCourtyard(pcbnew.F_CrtYd if back else pcbnew.B_CrtYd)
        bx = poly.BBox(); cw, ch = mm(bx.GetWidth()), mm(bx.GetHeight()); cx, cy = mm(bx.GetCenter().x), mm(bx.GetCenter().y)
    except Exception: cw = ch = cx = cy = 0
    if cw < 0.2 or ch < 0.2:
        bx = f.GetBoundingBox(False, False); cw, ch = mm(bx.GetWidth()), mm(bx.GetHeight()); cx, cy = mm(bx.GetCenter().x), mm(bx.GetCenter().y)
    fps.append(dict(ref=ref, val=val, lib=lib, x=mm(p.x), y=mm(p.y), rot=rot, back=back,
                    cw=round(cw, 3), ch=round(ch, 3), cx=round(cx, 3), cy=round(cy, 3)))
    for pad in f.Pads():
        dr = pad.GetDrillSize(); pp = pad.GetPosition()
        drw, drh = mm(dr.x), mm(dr.y)
        pads.append(dict(ref=ref, num=pad.GetNumber(), x=mm(pp.x), y=mm(pp.y),
                         drw=round(drw, 3), drh=round(drh, 3),
                         sw=round(mm(pad.GetSizeX()), 3), sh=round(mm(pad.GetSizeY()), 3),
                         rot=pad.GetOrientationDegrees(), tht=(drw > 0.05)))

json.dump(dict(board=board, edges=edges, footprints=fps, pads=pads),
          open(os.path.join(HERE, "placement.json"), "w"), indent=1)
tht = [p for p in pads if p["tht"]]
print(f"board {board['w']:.2f}x{board['h']:.2f} | {len(fps)} fps | {len(pads)} pads ({len(tht)} THT holes)")
print("edges:", [e[0] for e in edges])
print("THT drills by ref:", dict(Counter(p['ref'] for p in tht)))
