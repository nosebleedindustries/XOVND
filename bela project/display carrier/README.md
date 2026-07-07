# Display carrier — 2× LILYGO T-Display-S3 Long

A carrier PCB that mounts **two T-Display-S3 Long** AMOLED bars (ESP32-S3, 640×180)
**landscape and butted** as one wide ~1280×180 UI strip, and **sandwiches onto the
Beagle+Bela** via the PocketBeagle-2 header block (`U1`).

**This is the TOP board of the stack**, so **all connectors sit on the BACK (`B.Cu`)** —
`U1` (PB2 sandwich header), `JA`, `JB` and `J_PWR` face **down** into the Beagle+Bela
sandwich, while the two displays stay on the **front (`F.Cu`), facing up**. See
`renders/ensemble_stack_side.png` / `ensemble_stack_front.png` for the assembled stack.

- The panels are **smart satellites** — each ESP32 renders its own graphics, so the
  carrier only carries **power + a PRU-serial link** to each (Bela Gem leaves no HW
  UART/SPI free — see `../docs/display-architecture.md`). PRU0→panel A, PRU1→panel B.
- `JA` / `JB` (1×5): `+5V · GND · TX · RX · RST` — the cable to each panel plugs here.
- Displays are **mounted mirror-symmetric** (USB-C/electronics outward, screens meeting
  in the middle) for a continuous face. Module = **27.2 × 88.8 × 11.1 mm** (factory STEP).

Board ≈ **184 × 73 mm**, 2-layer, AISLER rules.

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
