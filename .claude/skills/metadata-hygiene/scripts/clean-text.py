#!/usr/bin/env python3
"""Report and remove invisible/confusable Unicode from text files."""

import argparse
import sys
import unicodedata

# Removed outright.
ZERO_WIDTH = {
    "​": "ZERO WIDTH SPACE",
    "‌": "ZERO WIDTH NON-JOINER",
    "‍": "ZERO WIDTH JOINER",
    "⁠": "WORD JOINER",
    "﻿": "ZERO WIDTH NO-BREAK SPACE (BOM)",
    "­": "SOFT HYPHEN",
}

# Removed, and flagged loudly: these enable Trojan Source (CVE-2021-42574).
BIDI = {
    "‪": "LEFT-TO-RIGHT EMBEDDING",
    "‫": "RIGHT-TO-LEFT EMBEDDING",
    "‬": "POP DIRECTIONAL FORMATTING",
    "‭": "LEFT-TO-RIGHT OVERRIDE",
    "‮": "RIGHT-TO-LEFT OVERRIDE",
    "⁦": "LEFT-TO-RIGHT ISOLATE",
    "⁧": "RIGHT-TO-LEFT ISOLATE",
    "⁨": "FIRST STRONG ISOLATE",
    "⁩": "POP DIRECTIONAL ISOLATE",
}

# Normalized to a plain ASCII space.
EXOTIC_SPACE = {
    " ": "NO-BREAK SPACE",
    " ": "EN QUAD", " ": "EM QUAD",
    " ": "EN SPACE", " ": "EM SPACE",
    " ": "THREE-PER-EM SPACE", " ": "FOUR-PER-EM SPACE",
    " ": "SIX-PER-EM SPACE", " ": "FIGURE SPACE",
    " ": "PUNCTUATION SPACE", " ": "THIN SPACE",
    " ": "HAIR SPACE", " ": "NARROW NO-BREAK SPACE",
    " ": "MEDIUM MATHEMATICAL SPACE", "　": "IDEOGRAPHIC SPACE",
}


def is_tag_char(ch):
    """U+E0000-E007F: invisible, used to smuggle payloads into text."""
    return 0xE0000 <= ord(ch) <= 0xE007F


def scan(text):
    """Return {(char, name): [line numbers]} for every flagged char."""
    found = {}
    for lineno, line in enumerate(text.splitlines(), 1):
        for ch in line:
            if ch in ZERO_WIDTH:
                key = (ch, ZERO_WIDTH[ch])
            elif ch in BIDI:
                key = (ch, BIDI[ch])
            elif ch in EXOTIC_SPACE:
                key = (ch, EXOTIC_SPACE[ch])
            elif is_tag_char(ch):
                key = (ch, "TAG CHARACTER")
            else:
                continue
            found.setdefault(key, []).append(lineno)
    return found


def clean(text):
    out = []
    for ch in text:
        if ch in ZERO_WIDTH or ch in BIDI or is_tag_char(ch):
            continue
        out.append(" " if ch in EXOTIC_SPACE else ch)
    return "".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("file")
    ap.add_argument("-o", "--output", help="write cleaned text here (default: report only)")
    args = ap.parse_args()

    try:
        with open(args.file, encoding="utf-8") as fh:
            text = fh.read()
    except UnicodeDecodeError:
        sys.exit(f"error: {args.file} is not UTF-8 text (binary file?)")
    except OSError as exc:
        sys.exit(f"error: {exc}")

    found = scan(text)

    if not found:
        print(f"{args.file}: clean — no invisible or confusable characters")
        if args.output:
            with open(args.output, "w", encoding="utf-8") as fh:
                fh.write(text)
        return

    has_bidi = any(ch in BIDI for ch, _ in found)

    print(f"{args.file}:")
    for (ch, name), lines in sorted(found.items(), key=lambda kv: -len(kv[1])):
        shown = ", ".join(str(n) for n in lines[:8])
        if len(lines) > 8:
            shown += f", +{len(lines) - 8} more"
        print(f"  U+{ord(ch):04X}  {name:<34} x{len(lines):<5} lines: {shown}")

    if has_bidi:
        print(
            "\n  WARNING: bidirectional control characters present.\n"
            "  In source code these enable Trojan Source attacks (CVE-2021-42574),\n"
            "  where displayed code differs from what the compiler sees.\n"
            "  Review these lines manually before accepting a cleaned version.",
            file=sys.stderr,
        )

    if args.output:
        with open(args.output, "w", encoding="utf-8") as fh:
            fh.write(clean(text))
        print(f"\ncleaned -> {args.output}")
    else:
        print("\n(report only; pass -o FILE to write a cleaned copy)")


if __name__ == "__main__":
    main()
