#!/bin/bash
# Package skills for OpenClaw distribution

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist-skills"
PACKAGES_DIR="$SCRIPT_DIR/packages"

mkdir -p "$PACKAGES_DIR"

echo "📦 Packaging Superpowers skills..."

for skill in browse qa ship plan-ceo-review; do
  echo "  → Packaging $skill..."
  
  # Create tar.gz with skill contents
  tar -czf "$PACKAGES_DIR/${skill}.skill" \
    -C "$DIST_DIR" \
    "$skill/SKILL.md" \
    "$skill/package.json" \
    "$skill/dist/"
    
  SIZE=$(du -h "$PACKAGES_DIR/${skill}.skill" | cut -f1)
  echo "    ✓ ${skill}.skill ($SIZE)"
done

echo ""
echo "✅ All skills packaged in $PACKAGES_DIR/"
ls -lh "$PACKAGES_DIR/"
