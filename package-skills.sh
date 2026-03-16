#!/bin/bash

# Package all skills into .skill.tar.gz files for OpenClaw

set -e

echo "📦 Packaging Superpowers Skills..."

# Create dist-skills directory
mkdir -p dist-skills

# Package each skill
for skill in browse qa ship plan-ceo-review; do
  echo "  Packaging $skill..."
  
  # Create skill directory structure
  mkdir -p "dist-skills/$skill"
  
  # Copy SKILL.md and metadata
  cp "$skill/SKILL.md" "dist-skills/$skill/"
  
  # Copy built files if they exist, otherwise warn
  if [ -d "$skill/dist" ]; then
    cp -r "$skill/dist" "dist-skills/$skill/"
  fi
  
  # Copy package.json for reference
  cp "$skill/package.json" "dist-skills/$skill/"
  
  # Create skill tarball
  tar -czf "${skill}.skill.tar.gz" -C dist-skills "$skill"
  
  echo "    ✓ ${skill}.skill.tar.gz created"
done

echo ""
echo "✅ All skills packaged successfully!"
echo ""
ls -lh *.skill.tar.gz
