# -*- coding: utf-8 -*-
"""Aligned device: MIDI jacks matched to Bela audio jacks (same 10.7mm spacing, same
+X panel plane X=60.6, same axis Z=16.2), MIDI board LIFTED on 4 hex spacers, ribbon
J3->PB2, shared 1mm panel with all 4 jack holes. Feature points transformed with the
SAME FreeCAD rotation as the board (robust to rotation-sign convention)."""
import Part, os, math, traceback
from FreeCAD import Vector as V, Rotation
SAND = r"C:\Users\stala\Downloads\bela_gem_cad\bela_gem_light.step"
MIDI = r"C:\Users\stala\Downloads\pb2_midi\pb2_midi.step"
OUT  = r"C:\Users\stala\Downloads\pb2_midi\pb2_midi_aligned_assembly.step"
LOG  = r"C:\Users\stala\Downloads\pb2_midi\_aligned_log.txt"
def log(m): open(LOG, "a", encoding="utf-8").write(str(m) + "\n")
def c_jack(ox, oy, zc):                      # audio-style jack, barrel toward +X, axis z=zc
    body = Part.makeBox(11, 8, 6, V(ox - 5.5, oy - 4, zc - 3))
    bar = Part.makeCylinder(3.0, 3.4, V(ox + 5.5, oy, zc), V(1, 0, 0))
    bar = bar.cut(Part.makeCylinder(1.75, 3.6, V(ox + 5.4, oy, zc), V(1, 0, 0)))
    return body.fuse(bar)
def hexspacer(cx, cy, z0, h, af=5.0):
    r = af / math.sqrt(3.0)
    pts = [V(cx + r * math.cos(math.radians(60 * i + 30)),
             cy + r * math.sin(math.radians(60 * i + 30)), z0) for i in range(6)]
    sp = Part.Face(Part.makePolygon(pts + [pts[0]])).extrude(V(0, 0, h))
    return sp.cut(Part.makeCylinder(1.3, h + 1, V(cx, cy, z0 - 0.5), V(0, 0, 1)))
try:
    open(LOG, "w").close()
    JX = 60.6; JZ = 16.2; OX = 51.7; LIFT = 11.6
    sw = Part.Shape(); sw.read(SAND)
    b0 = sw.BoundBox; sw.translate(V(-b0.XMin, -b0.YMin, -b0.ZMin)); sb = sw.BoundBox
    log("sandwich 0..%.1f 0..%.1f 0..%.1f" % (sb.XMax, sb.YMax, sb.ZMax))
    ANG = -90.0; rot = Rotation(V(0, 0, 1), ANG)
    mi = Part.Shape(); mi.read(MIDI); mi.rotate(V(0, 0, 0), V(0, 0, 1), ANG)
    # NOTE: STEP frame has Y = -(KiCad Y); feed feature points with negated Y.
    rp1 = rot.multVec(V(14.65, -8, 0)); mb1 = mi.BoundBox
    dx = OX - rp1.x
    dy = (sb.YMax + 2.0) - mb1.YMin              # board just beyond the sandwich (no collision)
    dz = LIFT - mb1.ZMin
    mi.translate(V(dx, dy, dz)); mb = mi.BoundBox
    def xf(px, py, pz=0.0):
        p = rot.multVec(V(px, py, pz)); return (p.x + dx, p.y + dy, p.z + dz)
    j1 = xf(14.65, -8); j2 = xf(25.35, -8)
    log("MIDI board X %.1f..%.1f Y %.1f..%.1f Z %.1f..%.1f" % (mb.XMin, mb.XMax, mb.YMin, mb.YMax, mb.ZMin, mb.ZMax))
    log("MIDI jacks world  J1(%.1f,%.1f)  J2(%.1f,%.1f)   audio Y 19.1/29.8" % (j1[0], j1[1], j2[0], j2[1]))
    mj1 = c_jack(OX, j1[1], JZ); mj2 = c_jack(OX, j2[1], JZ)
    spacers = [hexspacer(*xf(hx, hy)[:2], 0.0, LIFT) for hx, hy in [(4, -4.5), (36, -4.5), (4, -34), (36, -34)]]
    j3 = xf(20, -34)
    log("J3 world (%.1f,%.1f,%.1f)" % j3)
    # ribbon: J3 (raised board) down to the PB2 header edge of the sandwich
    p0 = V(j3[0], sb.YMax - 3.0, 8.0); p1 = V(j3[0], j3[1], LIFT + 1.5)
    def rect(c):
        pts = [V(c.x - 4, c.y, c.z - 0.3), V(c.x + 4, c.y, c.z - 0.3), V(c.x + 4, c.y, c.z + 0.3), V(c.x - 4, c.y, c.z + 0.3)]
        return Part.makePolygon(pts + [pts[0]])
    ribbon = Part.makeLoft([rect(p0), rect(p1)], True)
    # shared 1mm panel at X=60.6 with 4 jack holes
    panel = Part.makeBox(1.0, 82.0, 15.0, V(JX - 1.0, 12.0, JZ - 7.5))
    for jy in [19.1, 29.8, j1[1], j2[1]]:
        panel = panel.cut(Part.makeCylinder(3.7, 3.0, V(JX - 1.5, jy, JZ), V(1, 0, 0)))
    comp = Part.makeCompound([sw, mi, mj1, mj2, ribbon, panel] + spacers)
    comp.exportStep(OUT); ab = comp.BoundBox
    log("DONE size=%d  env %.1f x %.1f x %.1f" % (os.path.getsize(OUT), ab.XLength, ab.YLength, ab.ZLength))
except Exception:
    log("FAILED\n" + traceback.format_exc())
