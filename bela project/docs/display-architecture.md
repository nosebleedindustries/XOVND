# Display architecture — satellite ESP32 panels over the free PRU pins

**Decision (2026-07-07).** The synth's UI runs on **2 × LILYGO T-Display-S3 Long**, mounted
**horizontally** (each rotated to 640 × 180 landscape) and sat **side by side** as one wide
dual-panel strip. They are *smart* displays — each carries its own **ESP32-S3** and draws its
own graphics — so the PocketBeagle 2 only streams high-level **UI state**, not pixels.

## Why not a raw TFT / a hardware UART
Verified against the factory Bela Gem KiCad (`source/Bela_Gem_Stereo.kicad_pcb`, connector `U1`):
the Gem cape is a hungry cape and **takes every hardware serial bus**.

- **All 5 UARTs used** — UART0 `P1.30/32` (console + OLD.DIG), UART1 `P1.6/8` (SPI_ADC + SPI2.CLK),
  UART2 `P2.2/4` (LED_INDICATOR), **UART4 `P2.5/7` = `AUD_DOUT`/`AUD_DIN`** (this is why the MIDI
  board's UART4 is a *no-Gem* design), UART5 `P2.6/8` (ON_OFF_BUTTON, POWER_LED).
- **Both SPI used** — SPI0 `P2.29/31`, SPI2 `P1.8/10/12` (Gem ADC / audio).
- **I2C2 used** `P1.26/28`; audio-codec I2C on `P1.33/36`. (I2C3.SCL `P2.9` is free but its SDA is not.)

⇒ A bare SPI TFT or a hardware-UART link **does not fit** with the Gem fitted. The ESP32 displays
sidestep this: they need only a low-bandwidth data pipe, and that goes on the **free pins**.

## The T-Display-S3 Long
ESP32-S3R8 · 16 MB flash · 8 MB PSRAM · **180 × 640 QSPI AMOLED** (3.4", bar) · cap-touch (CST3530)
· **Wi-Fi + BLE** · **USB-C** · 3.3 V logic. Programmed in Arduino/ESP-IDF — flash it with **LVGL +
a small serial protocol** that receives UI state and renders locally.

## Connection — PRU-serial, two independent links
The AM62 has two **PRU real-time cores** (200 MHz, deterministic); **their pins are free** on the
Gem. Bit-bang a reliable serial (no jitter, no hardware UART needed). ESP32-S3 is 3.3 V →
**direct, no level-shifter**. Because the panels render themselves, the stream is only a few KB/s —
bandwidth is a non-issue.

| Panel | Link | Free pins | Role |
|---|---|---|---|
| **Display A** | PRU0 serial | `P1.29` (PRU0.7), `P1.31` (PRU0.4) | TX (Beagle→ESP32) / RX |
| **Display B** | PRU1 serial | `P2.28` (PRU1.15), `P2.30` (PRU1.12) | TX / RX |
| both | handshake / reset / IRQ (opt.) | `P1.4` (GPIO89), `P2.33` (GPIO52) | per-panel control |
| both | spare PRU1 | `P2.17` (PRU1.19), `P2.32` (PRU1.11), `P2.34` (PRU1.14) | 3rd wire / clock if SPI |
| power | rails | `GND` (shared), `+5V` `P1.24/P2.13`, `+3V3` `P1.14/P2.23` | see caveat |

> ⚠ **Power the AMOLEDs separately.** The panels pull real current; the PB2 3V3 rail is limited.
> Feed the displays from their own 5 V, share **GND** + the PRU data lines only. Data over the pins
> is fine — it's the panel supply that shouldn't hang off the Beagle rail.

## Full free-pin inventory (Gem fitted)
`P1`: 1(VIN) · 2(AIN6/GPIO87) · 3(USB1.DRVVBUS) · 4(GPIO89) · 17/18(VREF) · 19/21/23/25/27(AIN0-4) ·
**29(PRU0.7)** · **31(PRU0.4)** · 34(GPIO1_2).
`P2`: 3(PWM1A) · 9(I2C3.SCL only) · **17(PRU1.19)** · **28(PRU1.15)** · **30(PRU1.12)** ·
**32(PRU1.11)** · 33(GPIO52) · **34(PRU1.14)** · 36(AIN7).

## Build path
1. **Prototype (fast):** connect each panel by **USB-C → PB2 USB host** (hub for two); they enumerate
   as `/dev/ttyACM*`. Get the UI protocol + LVGL working in minutes.
2. **Product (clean):** move the link to **PRU-serial on the header pins** — one ribbon to the free
   pins, no USB hanging out of the case, USB port left free. Write the PRU firmware (C/asm) on the
   Beagle side + the matching receiver on each ESP32.

## Open items
- Finalize PRU pin roles + baud once the UI protocol is defined (2-wire UART vs 3-4-wire SPI).
- Confirm the PocketBeagle 2 USB-C can host (for the prototype path) + power budget.
- Mechanical: two 640×180 panels side-by-side → ~1280 × 180 UI surface behind the front panel.
