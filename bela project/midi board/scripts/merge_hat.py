# -*- coding: utf-8 -*-
"""Device viz WITH Bela hat: Bela Gem + PocketBeagle 2 sandwich (audio) + slim MIDI
board (right-angle J3) beside it, joined by a ribbon with IDC sockets that PROPERLY
seat: socket A wraps J3's right-angle pins; socket B sits on the PB2 header (Z~7);
flat ribbon at header height between them. Headless geometry merge."""
import Part, os, traceback
from FreeCAD import Vector as V
SAND = r"C:\Users\stala\Downloads\bela_gem_cad\bela_gem_light.step"   # Gem + PB2 hat
MIDI = r"C:\Users\stala\Downloads\pb2_midi\pb2_midi.step"
OUT  = r"C:\Users\stala\Downloads\pb2_midi\pb2_midi_hat_assembly.step"
LOG  = r"C:\Users\stala\Downloads\pb2_midi\_hat_log.txt"
def log(m): open(LOG, "a", encoding="utf-8").write(str(m) + "\n")
def box(cx, cy, z0, L, Wd, Ht):
    b = Part.makeBox(L, Wd, Ht); b.translate(V(cx - L/2, cy - Wd/2, z0)); return b
try:
    open(LOG, "w").close()
    # --- sandwich (Gem+PB2 hat) -> origin ---
    sw = Part.Shape(); sw.read(SAND)
    b0 = sw.BoundBox
    sw.translate(V(-b0.XMin, -b0.YMin, -b0.ZMin))
    sb = sw.BoundBox
    scx = (sb.XMin + sb.XMax) / 2.0
    HEADER_Z = 7.0                                  # PB2 header-pin level (from Z-profile)
    log("sandwich -> X %.1f..%.1f Y %.1f..%.1f Z %.1f..%.1f" %
        (sb.XMin, sb.XMax, sb.YMin, sb.YMax, sb.ZMin, sb.ZMax))
    # --- MIDI board: 180 about Z (J3 edge/pins face sandwich), coplanar base ---
    mi = Part.Shape(); mi.read(MIDI)
    mi.rotate(V(0, 0, 0), V(0, 0, 1), 180)
    m1 = mi.BoundBox
    gap = 12.0
    dx = scx - m1.Center.x
    dy = (sb.YMax + gap) - m1.YMin
    dz = sb.ZMin - m1.ZMin
    mi.translate(V(dx, dy, dz))
    j3x = -26 + dx; j3y = 46 + dy                   # J3 world (pins run toward -Y)
    log("J3 world ~ (%.1f, %.1f)  dz=%.1f" % (j3x, j3y, dz))
    # --- IDC sockets ---
    socA = box(j3x, j3y - 4.0, dz + 1.5, 12.0, 11.0, 6.0)   # wraps J3 right-angle pins
    p2y  = sb.YMax - 3.0
    socB = box(scx, p2y, HEADER_Z - 2.5, 14.0, 10.0, 6.0)   # on PB2 header edge
    # --- flat ribbon at header height, J3 socket <-> P2 socket ---
    ry0 = p2y; ry1 = j3y - 9.0
    rx = (scx + j3x) / 2.0
    rz = HEADER_Z + 1.0
    rib = Part.makeBox(8.0, ry1 - ry0, 0.6); rib.translate(V(rx - 4.0, ry0, rz))
    # --- 1mm folded/laser-cut cover at the jack edge (with Ø7 holes; jacks flush) ---
    # jacks KiCad(10/46, 66); board edge KiCad y=71.8, barrel front 72.8.
    jackX = [-10 + dx, -46 + dx]
    cy0 = 71.8 + dy                              # board PCB edge (cover inner face)
    bx0 = -55.3 + dx; bwid = 54.6                # board world X span
    cover = Part.makeBox(bwid, 1.0, 11.0); cover.translate(V(bx0, cy0, dz))
    for jx in jackX:                             # bore the barrel holes
        hole = Part.makeCylinder(3.6, 3.0, V(jx, cy0 - 0.5, dz + 3.05), V(0, 1, 0))
        cover = cover.cut(hole)
    log("cover at Y %.1f (1mm), jack holes X %.1f / %.1f" % (cy0, jackX[0], jackX[1]))
    comp = Part.makeCompound([sw, mi, socA, socB, rib, cover])
    comp.exportStep(OUT)
    ab = comp.BoundBox
    log("DONE exists=%s size=%d  envelope = %.1f x %.1f x %.1f mm" %
        (os.path.exists(OUT), os.path.getsize(OUT), ab.XLength, ab.YLength, ab.ZLength))
except Exception:
    log("FAILED\n" + traceback.format_exc())
