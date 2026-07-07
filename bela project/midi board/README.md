# PocketBeagle 2 — MIDI board (TRS MIDI IN/OUT)

A small script-generated carrier PCB that adds **MIDI IN + MIDI OUT** (3.5 mm TRS
Type-A) to a **PocketBeagle 2**, designed to sit alongside the
[Bela Gem](https://bela.io/products/bela-gem-stereo-and-multi/) audio sandwich and
connect by a **6-way ribbon cable** — so the whole device stays thin.

Companion to the [Bela Gem CAD model](../README.md).

## What it is
- **MIDI IN** — opto-isolated (H11L1M) TRS-A input.
- **MIDI OUT** — resistor-driven TRS-A output.
- **Ribbon-connected** to the Beagle via `J3` (2×3 right-angle header), taps 4 pins of
  header **P2**: `+3V3 = P2.23`, `GND = P2.15`, `UART_RX = P2.5`, `UART_TX = P2.7`
  (**UART4** — chosen to avoid the Linux console UART0 and the Bela audio pins).
- **Jacks matched to the Bela audio jacks**: same **Lumberg 1503-03** part, same
  **10.7 mm** spacing, and mounted on **4× M2.5 hex standoffs** so the MIDI jacks land at
  the same panel plane and height (Z ≈ 16.2 mm) as the audio jacks — everything aligns on
  one enclosure face behind a **1 mm folded/laser-cut cover**.
- **Power on/off button** (`SW1`, Alps SKRTLAE010 side-actuated SMD): sits **in the same
  panel row, 10.7 mm** from the last jack, actuator co-planar with the jack fronts (X = 60.6).
  Soft-power to the Beagle via `J4` (`PWR_BTN`/`GND`/`+3V3`), conditioned on-board with
  `R5` (10 k pull-up, active-low) + `C3` (100 n debounce).
  - ⚠ **Set SW1's rotation so the actuator faces the panel edge** (verify vs the SKRTLAE010
    datasheet — no 3D model ships in KiCad, it's modelled by hand in the assembly). The
    actuator is a couple mm lower than the jack axis on a bare board; a tall side-switch or a
    ~1.7 mm riser puts it exactly on the jack centreline if you want the holes perfectly level.

Board: **44 × 40 mm**, single-sided population, 2-layer (AISLER rules).

## Files
```
cad/
  pb2_midi.kicad_pcb                 the board (KiCad 9)
  pb2_midi.step                      board 3D (STEP)
  pb2_midi_aligned_assembly.step     full aligned device: Bela sandwich + this board on
                                     hex spacers + ribbon + shared 1mm panel with 4 holes
scripts/
  gen_pcb.py                         script that builds the .kicad_pcb (parts + nets + DRC)
  merge_aligned.py                   builds the aligned assembly STEP (jack matching + spacers)
  merge_hat.py                       earlier viz (Gem hat + slim board + ribbon)
lib.pretty/                          footprints used (PB2, Lumberg jack, opto, header, holes)
renders/                             board render + connection-header diagram
bom.csv
```

## MIDI wiring
TRS **Type-A**: Tip = DIN-5, Ring = DIN-4, Sleeve = DIN-2.
- **IN:** J1.R → R1(220) → opto LED anode; opto LED cathode ← J1.T; D1 across the LED.
  Opto output: R4(470) pull-up to +3V3, collector → `UART_RX`.
- **OUT:** `UART_TX` → R2(220) → J2.T (tip); +3V3 → R3(220) → J2.R (ring); J2.S → GND.

## ⚠ Electrical note — Gem + MIDI
`UART4` (P2.5/P2.7) is free **only when the Bela Gem is NOT fitted** (the Gem uses those
pins for audio). For a **standalone MIDI** PocketBeagle this ribbon board is correct. If
you want **Gem audio *and* MIDI on one Beagle**, run MIDI over **USB** instead — no free
serial UART is available with the Gem on.

## Rebuild
```
"C:/Program Files/KiCad/9.0/bin/python.exe" scripts/gen_pcb.py      # -> pb2_midi.kicad_pcb + DRC
kicad-cli pcb export step --subst-models --no-dnp -o cad/pb2_midi.step cad/pb2_midi.kicad_pcb
FreeCADCmd scripts/merge_aligned.py                                 # -> aligned assembly STEP
```

## Routing
Routed with **Freerouting 2.2.4** (2-layer, both F/B signal) then **GND poured on F.Cu + B.Cu**
(solid pad connection). AISLER 2-layer rules: track 0.25, space 0.15, via 0.7/0.3, edge 0.3.
- `scripts/route_export_dsn.py` → `routing/pb2_midi.dsn` (clearance 0.15) → Freerouting `-mp 40`
  → `routing/pb2_midi.ses` → `scripts/route_import_ses.py` (import + GND pour).
- **Result: routing_complete = True, 0 unconnected, 2 vias, GND plane both layers.**

```
kicad python  gen_pcb.py            # clean board
kicad python  route_export_dsn.py   # -> routing/pb2_midi.dsn
java -jar freerouting-2.2.4.jar -de routing/pb2_midi.dsn -do routing/pb2_midi.ses -mp 40
kicad python  route_import_ses.py   # import SES + pour GND -> pb2_midi.kicad_pcb
```

## Status
- **Routed + GND-poured, fab-ready for AISLER.** Jacks + power button aligned to the Bela audio
  jacks (spacing/plane/height), hex-spacer mounts, DRC **0 errors / 0 unconnected**.
- Conservative KiCad courtyards were shrunk (jacks fit 10.7 mm as on the Bela) and footprint
  silkscreen graphics dropped. One residual **silk-over-copper warning** (C1 ref over its pad) —
  cosmetic; AISLER auto-clips silk off pads.
