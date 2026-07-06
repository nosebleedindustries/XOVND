# Bela Gem Stereo — CAD model

A faithful CAD model of the **[Bela Gem Stereo](https://bela.io/products/bela-gem-stereo-and-multi/)**
audio board (a cape for the **PocketBeagle 2**), built from the manufacturer's real
open-source KiCad PCB and the official PocketBeagle 2 3D model — assembled as the full
sandwich (Gem board + PocketBeagle 2 + baseplate + M3 spacers).

Board: **55.05 × 44.65 × 1.6 mm**, rounded corners, 4× M3 mounting holes.

## What's faithful
- **Outline, component placement and every THT hole are 1:1 from the factory KiCad**
  (`source/Bela_Gem_Stereo.kicad_pcb`, pulled from `BelaPlatform/bela-hardware`):
  **117 drilled THT holes** (4× M3, the 72-pin PocketBeagle 2 field, jacks, USB-A, headers).
- Connectors modelled with real mm + openings: **USB-A** (GCT USB1125 shell + cavity),
  **2× 3.5 mm TRS jacks** (Lumberg, Ø3.5 bore to the edge), **Qwiic** JST-SH, female
  headers J1/J2/J3/J9 with gold pins at exact pad positions, PTS810 button, LEDs.
- **PocketBeagle 2** = the official Bela 3D model (`source/pocketbeagle2.step`, 533 solids),
  positioned in the sandwich (headers up into the Gem, verified by solid Z-analysis).

## Files
```
cad/
  bela_gem_stereo.step    interchange + Fusion-openable (colored)  ← open this in Fusion
  bela_gem_stereo.FCStd   FreeCAD master (full assembly, colored)
  bela_gem_light.FCStd    lightweight FreeCAD (Gem + simplified PB2, opens instantly)
  bela_gem_stereo.f3d     Fusion archive (materials/scene shell — see Fusion note)
scripts/                  reproducible build pipeline (KiCad → FreeCAD → Fusion)
source/                   real factory KiCad PCB (+ note to fetch the official PB2 STEP)
renders/                  Fusion render preview + FreeCAD views
```

## Open in Fusion 360 (for rendering)
The local `.f3d` export cannot embed STEP-imported geometry (a Fusion quirk — the imported
bodies live as external references that only a cloud save would bundle). So:
1. In Fusion: **File → Open → Upload** `cad/bela_gem_stereo.step` (imports natively, colors intact).
2. To re-apply the PBR materials (FR4 green, black plastic, brass spacers, satin steel),
   run `scripts/fusion_materials.py` through the Fusion MCP bridge (`scripts/fusion_post.py`).
3. Switch to the **Render** workspace → **Render in-canvas** for the photoreal image.
*(You can also just open the `.step` in MoI/SolidWorks/etc. — it carries per-solid colors.)*

## Rebuild from scratch
```
KiCad(9) python  extract_pcb.py      # factory .kicad_pcb → placement.json (outline+pads)
FreeCADCmd       freecad_build.py    # → Gem solids (117 holes, connectors), colors.json
FreeCAD (GUI)    bela_finalize.py    # import official PB2 + colors → colored .step + .FCStd
```
The official PocketBeagle 2 STEP is **not committed here** (8.4 MB). Fetch it from:
`https://raw.githubusercontent.com/BelaPlatform/bela-hardware/master/bela-kicad-library/3dmodels/3d-library.3dshapes/pocketbeagle2_simplified.step`
→ save as `source/pocketbeagle2.step`.

## Sources
- Bela Gem hardware (CC): https://github.com/BelaPlatform/bela-hardware
- Product: https://bela.io/products/bela-gem-stereo-and-multi/
