#!/usr/bin/env bash
# Report privacy-sensitive metadata in an image, grouped by severity.
set -euo pipefail

if ! command -v exiftool >/dev/null 2>&1; then
  echo "error: exiftool not found." >&2
  echo "  install: apt-get install libimage-exiftool-perl | brew install exiftool" >&2
  exit 127
fi

[ $# -ge 1 ] || { echo "usage: inspect.sh FILE..." >&2; exit 2; }

# Print "    Tag: value" per present tag, or nothing.
# Splits on the FIRST ": " only — GPS values and copyright strings contain colons.
show() {
  local file=$1; shift
  exiftool -s "$@" "$file" 2>/dev/null | awk '
    {
      i = index($0, ": ")
      if (i == 0) next
      name = substr($0, 1, i - 1)
      val  = substr($0, i + 2)
      sub(/ +$/, "", name)
      if (val != "" && val != "-") printf "    %s: %s\n", name, val
    }'
}

# Emit a section only when it has content. Must always return 0 under set -e.
section() {
  if [ -n "$2" ]; then
    printf '  %s\n%s\n' "$1" "$2"
  fi
  return 0
}

for file in "$@"; do
  if [ ! -f "$file" ]; then
    echo "skip (not a file): $file" >&2
    continue
  fi

  echo "=== $file ==="

  # 'GPS*' crosses groups so it catches Composite:GPSLatitude/GPSPosition —
  # the decoded coordinates. EXIF-only 'GPS:all' misses those.
  high=$(show "$file" '-GPS*' -OwnerName -CameraOwnerName -SerialNumber \
    -InternalSerialNumber -LensSerialNumber -BodySerialNumber -CameraSerialNumber) || true

  medium=$(show "$file" -PreviewImage -ThumbnailImage -JpgFromRaw \
    -History -DocumentAncestors -DerivedFrom \
    -PreservedFileName -OriginalDocumentID -HostComputer) || true

  low=$(show "$file" -Software -CreatorTool -LensModel -Model -Make \
    -DateTimeOriginal -CreateDate -ModifyDate) || true

  kept=$(show "$file" -Copyright -Artist -Creator -Rights -UsageTerms \
    -Credit -Source -Orientation -ProfileDescription) || true

  section "HIGH   — location / identity / equipment serials" "$high"
  section "MEDIUM — embedded originals / edit history / local paths" "$medium"
  section "LOW    — timestamps / software / body / lens" "$low"
  section "PRESERVED by strip.sh" "$kept"

  if [ -z "$high$medium" ]; then
    echo "  clean: no high or medium severity metadata found"
  fi

  # Sidecars carry metadata exiftool will not touch via the image alone.
  base=${file%.*}
  for sc in "$base.xmp" "$base.XMP" "$file.xmp"; do
    if [ -f "$sc" ]; then
      echo "  NOTE: sidecar present, strip separately: $sc"
    fi
  done

  echo
done
