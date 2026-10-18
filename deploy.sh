#!/bin/bash
# Manual fallback: publish public/ to the Domeneshop web root, the same way
# the GitHub Action does. Normally you just push to main and the Action does this.
#
#   cd ~/Code/teleosofisk && ./deploy.sh
set -euo pipefail
source ~/.config/meta-epistemology/server-credentials     # exports SSHPASS
HERE="$(cd "$(dirname "$0")" && pwd)"
TARGET=instituteofteleo@login.domeneshop.no
sshpass -e ssh "$TARGET" 'd=~/backups/teleosofisk-$(date +%Y%m%d-%H%M%S); mkdir -p "$d/images"; cd ~/www; for f in index.html no.html styles.css site.js; do [ -f "$f" ] && cp -p "$f" "$d/"; done; [ -d images ] && cp -p images/* "$d/images/" 2>/dev/null; echo "Backed up to $d"'
rsync -rltvz --checksum --chmod=D755,F644 \
  --exclude 'images/horizon-data.js' --exclude '.DS_Store' \
  -e "sshpass -e ssh" "$HERE/public/" "$TARGET:www/"
