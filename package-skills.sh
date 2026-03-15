#!/bin/bash

# Packaging script for OpenClaw skills

set -e

DIST_DIR="dist-skills"
mkdir -p "$DIST_DIR"

echo "📦 Packaging OpenClaw skills..."

# Package each skill
for skill_dir in skills/*/; do
    skill_name=$(basename "$skill_dir")
    skill_file="$DIST_DIR/$skill_name.skill"
    
    echo "  → Packaging $skill_name..."
    
    # Create tar.gz with skill.json and dist contents
    tar -czf "$skill_file" \
        -C "$skill_dir" skill.json \
        -C ../.. dist
    
    size=$(du -h "$skill_file" | cut -f1)
    echo "    ✓ $skill_file ($size)"
done

echo ""
echo "✅ All skills packaged to $DIST_DIR/"
ls -la "$DIST_DIR/"
