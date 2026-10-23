#!/bin/sh
# Installs the Cadence Kit desktop fonts (Redaction, all 7 families) into
# ~/Library/Fonts so Figma, Keynote and every other Mac app can see them.
# Safe to re-run: it only copies .otf files and overwrites older copies.
#
# Run from anywhere:
#   curl -fsSL https://raw.githubusercontent.com/julie-torrisi/cadence-kit/main/cadence-kit/scripts/install-fonts-mac.sh | sh
set -e

REPO_RAW="https://raw.githubusercontent.com/julie-torrisi/cadence-kit/main/cadence-kit/fonts/redaction/otf"
DEST="$HOME/Library/Fonts"
mkdir -p "$DEST"

for grade in "" 10 20 35 50 70 100; do
  for style in Regular Italic Bold; do
    file="Redaction${grade}-${style}.otf"
    curl -fsSL "$REPO_RAW/$file" -o "$DEST/$file"
    echo "Installed $file"
  done
done

echo ""
echo "Done: 21 Redaction fonts are in $DEST."
echo "Quit Figma completely (Cmd+Q) and reopen it. In the browser, Figma's font helper picks them up after a reload."
