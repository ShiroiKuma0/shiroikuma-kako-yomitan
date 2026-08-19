#!/usr/bin/env python3
"""Generate 白い熊 Yomitan's icon set.

The artwork is upstream Yomitan's own icon in the house palette. Upstream ships a vector
master, `resources/icons.svg`, whose layer "Yomitan" holds exactly two shapes: a rounded
16x16 tile and the katakana ヨミ over it. `graphics/icon.svg` carries those two shapes
verbatim — nothing is redrawn — with upstream's cyan-to-magenta gradient replaced by flat
black and its white characters by pure yellow.

Two states are rendered, because this fork swaps the toolbar icon when text scanning is
switched off, where upstream only paints a grey "off" badge over the one image:

    icon<size>.png      enabled     yellow #FFFF00 on black
    icon-off<size>.png  disabled    dimmed #666600 on black

The disabled state stays on the yellow hue rather than introducing a third colour, exactly
as `shiroikuma-kako-stylus` dims its own all-disabled state. A hollow, outline-only variant
was measured and rejected: a glyph bar is 2 px tall at toolbar size and a hollow bar needs
three (border, hole, border), so any stroke thin enough to leave a hole is sub-pixel and
antialiases into mud.

    python3 graphics/make-icons.py

rewrites every icon PNG in `ext/images/` and refreshes `graphics/icon-512.png`, the flat
preview used by the README and the release pages. Needs `rsvg-convert` (librsvg2-bin).
"""

import pathlib
import re
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent
IMAGES = REPO / "ext" / "images"

BLACK = "#000000"
YELLOW = "#FFFF00"
# The one tone that is not full-strength yellow: the disabled state exists to look switched
# off. It stays on the yellow hue rather than introducing a third colour to the palette.
DIM = "#666600"

#         suffix   tile   ink
STATES = [("", BLACK, YELLOW), ("-off", BLACK, DIM)]

# The sizes upstream's manifest declares, in `icons` and in `action.default_icon`.
SIZES = [16, 19, 32, 38, 48, 64, 128]

# The flat preview; also the largest size AMO will ever want.
PREVIEW = 512

MASTER = (HERE / "icon.svg").read_text()
RX_PALETTE = re.compile(r'(<style id="palette">).*?(</style>)', re.S)


def palette(tile, ink):
    """The master SVG with its palette block rewritten for one state."""
    body = '\n    .tile { fill: %s; }\n    .ink  { fill: %s; }\n  ' % (tile, ink)
    svg, n = RX_PALETTE.subn(lambda m: m.group(1) + body + m.group(2), MASTER)
    if n != 1:
        sys.exit('graphics/icon.svg: expected exactly one <style id="palette"> block')
    return svg


def render(svg, out, px):
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["rsvg-convert", "-w", str(px), "-h", str(px), "-o", str(out)],
                   input=svg.encode(), check=True)


def main():
    n = 0
    for suffix, tile, ink in STATES:
        svg = palette(tile, ink)
        for px in SIZES:
            render(svg, IMAGES / ("icon%s%d.png" % (suffix, px)), px)
            n += 1
    print("wrote %d PNGs under %s" % (n, IMAGES))

    render(palette(BLACK, YELLOW), HERE / "icon-512.png", PREVIEW)
    print("wrote graphics/icon-512.png")


if __name__ == "__main__":
    try:
        subprocess.run(["rsvg-convert", "--version"], check=True, capture_output=True)
    except (OSError, subprocess.CalledProcessError):
        sys.exit("rsvg-convert not found — install librsvg2-bin")
    main()
