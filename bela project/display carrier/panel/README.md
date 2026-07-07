# Aluminium front-panel cutout — 2× T-Display-S3 Long

`aluminium_cutout.png` — dimensioned drawing for the 1 mm Al front panel. Origin = seam centre.

## EXACT (from the LILYGO factory files)
- **Glass / viewable window:** 88.83 × 25.72 mm per panel → butted = **177.66 × 25.72 mm**
  (source: factory shell STEP `T-Display-S3-Long-Shell.stp`, `dimensions/` folder).
- **Mounting holes:** **8× Ø1.8 mm** at (±10.86, ±42.41) per module → in the butted frame:
  X = ±86.82 and ±2.01, Y = ±10.86 (all from seam centre). Hole pitch 84.82 (long) × 21.72.
- **Module:** 27.2 × 88.8 × 11.1 mm (factory H685 STEP).

## COMPUTED (verify against the DWG / a physical unit)
- **Active (lit) area:** 83.1 × 23.4 mm per panel (3.4″ 640×180).
- **Seam between the two lit areas ≈ 5.7 mm** (2× end bezel) — the one number that depends on
  the exact bezel offset. The `DISPLAY.dwg` has it, but needs an ODA/AutoCAD reader to open
  (FreeCAD couldn't). To minimise the seam, butt the small-bezel ends (that's why DS2 is mirrored).

## Cut
- One **177.66 × 25.72** window (recommended, shows both glasses) **or** two 88.83 × 25.72 windows
  with a ~4 mm Al bridge at the seam for support. Corner radii ~R1.
- Drill the 8× Ø1.8 (or Ø2.0 for M2 clearance) at the coordinates above.
