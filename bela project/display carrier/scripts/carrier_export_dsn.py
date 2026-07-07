#!/usr/bin/env python3
"""Export a Specctra DSN for Freerouting (2-layer, both F/B signal) for the display carrier.

The large TDisplay footprints carry fp_rect / dashed-Dwgs graphics that trip KiCad's DSN
exporter (a non-closed-outline C++ assert *aborts the process*). pcbnew can't strip them
(GraphicalItems() isn't iterable here and fp.Remove segfaults — Joan's brain), so we strip
the footprint graphic s-exprs by BALANCED-PAREN TEXT surgery on a throwaway copy of the
board, export the DSN from that copy, and normalise clearance to 150 (0.15 mm). The real
board keeps all its graphics; the routed SES re-imports into it by net name."""
import pcbnew, os, re
HERE = r"C:\Users\stala\Downloads\display_carrier"
SRC  = os.path.join(HERE, "display_carrier.kicad_pcb")
TMP  = os.path.join(HERE, "routing", "display_carrier_route.kicad_pcb")
os.makedirs(os.path.join(HERE, "routing"), exist_ok=True)

def strip_fp_graphics(txt, tokens=("fp_rect","fp_line","fp_poly","fp_circle","fp_arc")):
    """Remove each (token ... ) s-expr (balanced parens). Keeps pads, edge cuts (gr_*), text."""
    out = []; i = 0; n = len(txt)
    pat = re.compile(r"\((?:%s)\b" % "|".join(tokens))
    while i < n:
        m = pat.search(txt, i)
        if not m:
            out.append(txt[i:]); break
        out.append(txt[i:m.start()])
        # walk balanced parens from m.start()
        depth = 0; j = m.start()
        while j < n:
            c = txt[j]
            if c == "(": depth += 1
            elif c == ")":
                depth -= 1
                if depth == 0: j += 1; break
            j += 1
        i = j
    return "".join(out)

raw = open(SRC, encoding="utf-8").read()
before = len(re.findall(r"\((?:fp_rect|fp_line|fp_poly|fp_circle|fp_arc)\b", raw))
clean = strip_fp_graphics(raw)
after = len(re.findall(r"\((?:fp_rect|fp_line|fp_poly|fp_circle|fp_arc)\b", clean))
open(TMP, "w", encoding="utf-8").write(clean)
print(f"stripped fp graphics: {before} -> {after}")

b = pcbnew.LoadBoard(TMP); b.BuildConnectivity()
dsn = os.path.join(HERE, "routing", "display_carrier.dsn")
try: pcbnew.ExportSpecctraDSN(b, dsn)
except TypeError: pcbnew.ExportSpecctraDSN(dsn)
t = open(dsn, encoding="utf-8").read()
t = re.sub(r'\(clearance 2\d\d(\.\d+)?\)', '(clearance 150)', t)   # 0.20/0.25 -> 0.15
open(dsn, "w", encoding="utf-8").write(t)
print("DSN:", os.path.getsize(dsn), "bytes ->", dsn)
