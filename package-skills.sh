#!/bin/bash

# Packaging script for OpenClaw skills

set -e

DIST_DIR="dist-skills"
mkdir -p "$DIST_DIR"

echo "📦 Packaging OpenClaw skills..."

# Package each skill
for skill_dir in browse qa ship plan-ceo-review; do
    skill_name=$(basename "$skill_dir")
    skill_file="$DIST_DIR/$skill_name.skill.tar.gz"
    
    echo "  → Packaging $skill_name..."
    
    # Create tar.gz with skill.json and dist contents
    tar -czf "$skill_file" \
        -C "$skill_dir" skill.json cli.js dist/ package.json README.md 2>/dev/null || \
    tar -czf "$skill_file" \
        -C "$skill_dir" skill.json dist/ package.json README.md
    
    size=$(du -h "$skill_file" | cut -f1)
    echo "    ✓ $skill_file ($size)"
done

echo ""
echo "✅ All skills packaged to $DIST_DIR/"
ls -la "$DIST_DIR/"
