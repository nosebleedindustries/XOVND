# Display carrier — 2× LILYGO T-Display-S3 Long

A carrier PCB that mounts **two T-Display-S3 Long** AMOLED bars (ESP32-S3, 640×180)
**landscape and butted** as one wide ~1280×180 UI strip, and **sandwiches onto the
Beagle+Bela** via the PocketBeagle-2 header block (`U1`).

**This is the TOP board of the stack**, so **all connectors sit on the BACK (`B.Cu`)** —
`U1` (PB2 sandwich header), `JA`, `JB` and `J_PWR` face **down** into the Beagle+Bela
sandwich, while the two displays stay on the **front (`F.Cu`), facing up**. See
`renders/ensemble_stack_side.png` / `ensemble_stack_front.png` for the assembled stack.

**`U1` = MALE 2×18 pin headers** (`PinHeader_2x18_P2.54mm_Vertical` ×2), pins pointing
**down** so the carrier plugs into female sockets on top of the sandwich — you can't
mate two female sockets. `JA`/`JB` are male 1×5 headers too (cables to the panels).
The `ensemble_*` renders show the full stack aligned + sandwiched: `U1` sits over the
Beagle's P1/P2 headers and its pins insert into the sandwich; the MIDI board is the
ribbon satellite in front.

- The panels are **smart satellites** — each ESP32 renders its own graphics, so the
  carrier only carries **power + a PRU-serial link** to each (Bela Gem leaves no HW
  UART/SPI free — see `../docs/display-architecture.md`). PRU0→panel A, PRU1→panel B.
- `JA` / `JB` (1×5): `+5V · GND · TX · RX · RST` — the cable to each panel plugs here.
- Displays are **mounted mirror-symmetric** (USB-C/electronics outward, screens meeting
  in the middle) for a continuous face. Module = **27.2 × 88.8 × 11.1 mm** (factory STEP).

Board ≈ **194 × 81 mm**, 2-layer, AISLER rules, with a 7 mm mounting border carrying
**4× M2.5 corner holes** (`H1–H4`). The wide board is carried on **4 brass M2.5 hex
standoffs (~23 mm)** from the enclosure floor to the corners — the central U1 header does
the wiring, the corner legs do the holding. `scripts/add_mounts.py` grows the border +
holes on the routed board (routing untouched; the new margin is a bare mounting border).

## Assembled stack height (male pins fully seated)
Measured from the factory 3D models with the carrier's 2×18 male header pushed **fully** into
the sandwich's female connector: **total PCB-stack height ≈ 36.2 mm** (device base → display glass).
- PocketBeagle 2 (PCB + headers): 0 → 8.7 mm
- Bela Gem (mated cape, PCB 11.7–13.3): **audio jacks up to 21.8 mm ← the limiting component**
- Carrier PCB: 22.8 → 24.4 mm (1 mm above the Bela jacks; male pins ~6 mm into the female)
- T-Display module → glass top: **36.19 mm**

**The height floor is the Bela's LINE IN/OUT jacks (21.8 mm)** — the carrier can't sit lower
without hitting them, so the male pins can only insert as far as that clearance allows. Lower-profile
or relocated jacks would let the stack compress further. Add the 1 mm aluminium enclosure +
top/bottom clearances (~3–5 mm) for the external height (~40–41 mm).

## Notes / to refine
- The `TDisplayS3Long` footprint's **mounting-hole positions are estimates** + the active-
  area seam offset should be verified against the factory DWG (`dimensions/` in the LILYGO
  repo) or a physical unit — then nudge the two modules for a perfect join.
- 3D model = the factory **`H685-PCB-3D.stp`** (from `T-Display-S3-Long-PCB-3D.zip`, LILYGO
  GitHub `dimensions/`) — not committed (7.75 MB); the footprint references it by path.

## Routing (done)
**Fully routed + fab-ready.** Freerouting 2.2.4, 2-layer (both signal). A parallel **clearance
sweep** {0.15, 0.175, 0.20, 0.25 mm} picked **0.25 mm** as the loosest that still routes clean
(most fab margin), then **GND poured on F.Cu + B.Cu** (solid pad connection), netclass clearance
**0.15 mm** (AISLER). Result: **0 unconnected, 68 tracks, 1 via, 0 hard DRC** (only 2 cosmetic
silk warnings — DS ref field near the edge + DS1/DS2 silk-rect overlap). Authoritative check =
`kicad-cli pcb drc` (verified: 0 shorting, 0 clearance, GND filled both layers, connectors on B.Cu).
Scripts: `scripts/carrier_export_dsn.py` (DSN, strips fp graphics by text so KiCad's exporter
doesn't choke on the big display outlines) + `scripts/carrier_route_variant.py <µm>` (one full
clearance variant → JSON). Routed back-side view: `renders/carrier_routed_bottom.png`.

## Power (rev: dedicated input)
The two AMOLEDs are hungry (~0.4–1 A peak), so they are **NOT** powered from the Beagle rail.
- **`J_PWR`** (2-pin screw terminal) = **+5V / GND** straight from the main PSU → feeds `JA`/`JB` → the panels.
- The **PB2 sandwich header (`U1`) carries only GND (common reference) + the data lines** (TX/RX/RST per panel).
- So display current never flows through the Beagle→Gem→carrier stack — the audio rail stays clean.
