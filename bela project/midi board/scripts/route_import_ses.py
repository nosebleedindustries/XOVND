#!/usr/bin/env python3
"""Import the Freerouting .ses into the board, then pour a GND plane on F.Cu + B.Cu
(inset from the edge for clearance) and fill. Sets netclass clearance to 0.15 so the
routed tracks (DSN 0.15) pass DRC with no false clearance flags."""
import pcbnew, os
HERE = r"C:\Users\stala\Downloads\pb2_midi"
pcb = os.path.join(HERE, "pb2_midi.kicad_pcb"); ses = os.path.join(HERE, "routing", "pb2_midi.ses")
b = pcbnew.LoadBoard(pcb)
try: pcbnew.ImportSpecctraSES(b, ses)
except Exception: pcbnew.ImportSpecctraSES(ses)
b.BuildConnectivity()
gnd = b.FindNet("GND"); gc = gnd.GetNetCode()
bb = b.GetBoardEdgesBoundingBox(); M = pcbnew.FromMM(0.35)
x0, y0, x1, y1 = bb.GetLeft()+M, bb.GetTop()+M, bb.GetRight()-M, bb.GetBottom()-M
for layer in (pcbnew.F_Cu, pcbnew.B_Cu):
    z = pcbnew.ZONE(b); z.SetLayer(layer); z.SetNetCode(gc)
    z.SetMinThickness(pcbnew.FromMM(0.2))
    z.SetPadConnection(pcbnew.ZONE_CONNECTION_FULL)   # solid pad->plane (no starved thermals)
    ch = pcbnew.SHAPE_LINE_CHAIN()
    for (px, py) in [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]: ch.Append(px, py)
    ch.SetClosed(True); z.Outline().AddOutline(ch); b.Add(z)
pcbnew.ZONE_FILLER(b).Fill(b.Zones())
# nudge the C1 reference off its exposed pad (silk_over_copper)
for fp in b.GetFootprints():
    if fp.GetReference() == "C1":
        r = fp.Reference(); p = r.GetPosition()
        r.SetPosition(pcbnew.VECTOR2I(p.x, p.y - pcbnew.FromMM(1.6)))
ds = b.GetDesignSettings(); ds.m_NetSettings.GetDefaultNetclass().SetClearance(pcbnew.FromMM(0.15))
b.BuildConnectivity(); pcbnew.SaveBoard(pcb, b)
print("imported SES + poured GND on F.Cu+B.Cu; zones:", len(list(b.Zones())))
