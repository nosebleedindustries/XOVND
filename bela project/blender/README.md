# Blender assembly-render pipeline

Drives the full 4-board synth stack (PocketBeagle 2 + Bela Gem + MIDI carrier +
dual-screen carrier) into Blender for the Cycles/EEVEE renders used in the build journal.
Talks to the [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) addon over a
local socket (127.0.0.1:9876) — Blender must be open with the addon's server running.

Run order (each sends its script to the live Blender via `bl.py`):

| Script | What it does |
|---|---|
| `bl.py` | Minimal socket client — `python bl.py <script.py>` sends the file to Blender |
| `bl_ensemble.py` | Clears the scene, imports the 4 boards (PB2 `.obj`, three `.glb` ×1000 mm) into groups |
| `bl_ens_pos.py` | Positions the stack (U1 male header over the beagle, carrier seated), lights, EEVEE top render |
| `bl_ens_views.py` | Moves the camera for the side + front stack views |
| `bl_spacers.py` | Models the 4 brass M2.5 hex corner standoffs holding the screen carrier |

GLBs come from `kicad-cli pcb export glb` (KiCad exports in **metres** → scaled ×1000 in
Blender). Paths inside the scripts are absolute to the local working dirs.
