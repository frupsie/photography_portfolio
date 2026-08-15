---
name: metadata-hygiene
description: >
  Strip privacy-sensitive metadata from photos and documents before publishing or
  sharing — GPS coordinates, camera/lens serial numbers, owner names, embedded
  original-image previews, and editor history — while preserving authorship,
  copyright, ICC color profiles, and orientation. Also cleans invisible Unicode
  (zero-width chars, bidi controls, exotic spaces) that breaks diffs, search, and
  paste. Use when the user asks to scrub EXIF, remove GPS/location from photos,
  clean metadata before publishing, check what a file leaks, or fix invisible
  characters in text.
---

# Metadata hygiene

Two jobs: **inspect** what a file leaks, then **strip** the sensitive parts without
destroying the parts that matter.

Default posture is **inspect first, strip second**. Never overwrite originals.

## Why not just `exiftool -all=`

The naive strip is destructive in ways photographers notice immediately:

| Field | Naive `-all=` | Correct |
| --- | --- | --- |
| ICC color profile | **destroyed** — colors shift on wide-gamut displays | preserve |
| `Orientation` | **destroyed** — portrait shots display sideways | preserve |
| `Copyright` / `Artist` | **destroyed** — you lose authorship claim | preserve |
| IPTC credit lines | **destroyed** | preserve |
| GPS, serials, owner | removed | removed |

Always use the targeted strip below, not `-all=`.

## Inspect

```bash
scripts/inspect.sh photo.jpg
```

Reports, grouped by severity:

- **HIGH** — GPS coordinates, owner name, camera/body/lens serial numbers
- **MEDIUM** — embedded preview/thumbnail (can contain the *pre-edit* image),
  editor history, original filename and local paths, document ancestors
- **LOW** — timestamps, software version, lens model
- **PRESERVED** — what the strip will deliberately keep

Run this before advising anything. Do not guess what a file contains.

## Strip

```bash
scripts/strip.sh photo.jpg                 # writes photo.cleaned.jpg
scripts/strip.sh -o out/ shoot/*.jpg       # batch to a directory
scripts/strip.sh --dry-run photo.jpg       # show the exiftool command, change nothing
scripts/strip.sh --keep-dates photo.jpg    # retain capture timestamps
scripts/strip.sh --strip-dates photo.jpg   # also remove all timestamps
```

Removed by default: all `GPS:*`, `SerialNumber`, `InternalSerialNumber`,
`LensSerialNumber`, `BodySerialNumber`, `CameraSerialNumber`, `OwnerName`,
`CameraOwnerName`, `PreviewImage`, `ThumbnailImage`, `JpgFromRaw`,
`XMP-photoshop:History`, `XMP-xmpMM:DocumentAncestors`, `PreservedFileName`,
`XMP-crs:*` raw-develop settings, `Software`, `HostComputer`, `CreatorTool`.

Kept by default: `Copyright`, `Artist`, `Creator`, `Rights`, `UsageTerms`,
`CreatorContactInfo`, IPTC credit/source, ICC profile, `Orientation`, capture
dates.

### Verify after stripping

Always re-inspect the output and show the user the before/after:

```bash
scripts/inspect.sh photo.cleaned.jpg
```

If GPS still appears, the file likely has a sidecar `.xmp` — check for one next
to the original; `exiftool` does not touch sidecars unless asked.

## Text: invisible Unicode

```bash
scripts/clean-text.py draft.md              # report only
scripts/clean-text.py draft.md -o out.md    # write cleaned
```

Removes zero-width chars (U+200B–200D, U+FEFF), bidi controls (U+202A–202E,
U+2066–2069), tag characters (U+E0000–E007F), and normalizes exotic spaces
(U+00A0, U+2000–200A, U+202F, U+205F) to ASCII space.

Bidi controls in **source code** are a security issue (Trojan Source, CVE-2021-42574) —
flag those loudly rather than silently fixing them.

## Scope

This skill removes metadata for **privacy** — location, identity, equipment,
and local filesystem traces in files the user owns.

It deliberately does **not** strip C2PA Content Credentials or other provenance
manifests. Those establish authorship and are actively adopted across the
photography industry; removing them works against a photographer's interest, and
stripping them to disguise AI-generated work as human-made is out of scope. If a
user explicitly wants C2PA inspected, `c2patool` reads manifests without altering
them.

If GPS is genuinely wanted in published work (travel/landscape portfolios often
want it), say so rather than assuming — the strip is reversible only from the
original.

## Dependencies

`exiftool` is required for image work. Check and report clearly if absent:

```bash
command -v exiftool || echo "install: apt-get install libimage-exiftool-perl | brew install exiftool"
```

`clean-text.py` needs Python 3.8+, stdlib only.
