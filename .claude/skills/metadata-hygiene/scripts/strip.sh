#!/usr/bin/env bash
# Remove privacy-sensitive metadata, preserving authorship, ICC profile and orientation.
set -euo pipefail

if ! command -v exiftool >/dev/null 2>&1; then
  echo "error: exiftool not found." >&2
  echo "  install: apt-get install libimage-exiftool-perl | brew install exiftool" >&2
  exit 127
fi

outdir=""
dry_run=0
strip_dates=0

usage() {
  cat >&2 <<'EOF'
usage: strip.sh [options] FILE...

  -o DIR          write outputs into DIR (default: alongside input, .cleaned.EXT)
  --dry-run       print the exiftool command, change nothing
  --strip-dates   also remove capture/modify timestamps
  --keep-dates    keep timestamps (default)
  -h, --help      this message

Originals are never modified.
EOF
}

while [ $# -gt 0 ]; do
  case $1 in
    -o)            outdir=${2:?-o needs a directory}; shift 2 ;;
    --dry-run)     dry_run=1; shift ;;
    --strip-dates) strip_dates=1; shift ;;
    --keep-dates)  strip_dates=0; shift ;;
    -h|--help)     usage; exit 0 ;;
    --)            shift; break ;;
    -*)            echo "unknown option: $1" >&2; usage; exit 2 ;;
    *)             break ;;
  esac
done

[ $# -ge 1 ] || { usage; exit 2; }
[ -n "$outdir" ] && mkdir -p "$outdir"

# Targeted removals. Deliberately NOT -all=, which would destroy the ICC
# profile, orientation, and copyright fields.
args=(
  -GPS:all=
  -OwnerName= -CameraOwnerName=
  -SerialNumber= -InternalSerialNumber= -LensSerialNumber=
  -BodySerialNumber= -CameraSerialNumber=
  -PreviewImage= -ThumbnailImage= -JpgFromRaw=
  -XMP-photoshop:History= -XMP-xmpMM:DocumentAncestors= -XMP-xmpMM:DerivedFrom=
  -PreservedFileName= -OriginalDocumentID=
  -XMP-crs:all=
  -Software= -CreatorTool= -HostComputer=
)

if [ "$strip_dates" -eq 1 ]; then
  args+=( -DateTimeOriginal= -CreateDate= -ModifyDate= -GPSDateStamp= -GPSTimeStamp= )
fi

status=0

for file in "$@"; do
  if [ ! -f "$file" ]; then
    echo "skip (not a file): $file" >&2
    status=1
    continue
  fi

  ext=${file##*.}
  stem=$(basename "$file" ".$ext")
  if [ -n "$outdir" ]; then
    out="$outdir/$stem.$ext"
  else
    out="${file%.*}.cleaned.$ext"
  fi

  if [ "$dry_run" -eq 1 ]; then
    echo "would run: exiftool ${args[*]} -o $out $file"
    continue
  fi

  # -o writes a new file and leaves the original untouched.
  # exiftool refuses to overwrite an existing -o target, so clear it first.
  [ -e "$out" ] && rm -f "$out"

  if err=$(exiftool "${args[@]}" -o "$out" "$file" 2>&1 >/dev/null); then
    echo "cleaned: $file -> $out"
  else
    echo "FAILED:  $file" >&2
    [ -n "$err" ] && echo "  $err" >&2
    status=1
  fi

  base=${file%.*}
  for sc in "$base.xmp" "$base.XMP"; do
    if [ -f "$sc" ]; then
      echo "  WARNING: sidecar not cleaned, handle separately: $sc" >&2
    fi
  done
done

exit $status
