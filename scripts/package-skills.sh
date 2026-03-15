#!/bin/bash
set -e

echo "📦 Packaging Superpowers Skills..."

cd "$(dirname "$0")/.."

# Create dist-skills directory
mkdir -p dist-skills

# Package each skill
package_skill() {
  local name=$1
  local config=$2
  
  echo "  Packing $name..."
  
  # Create temp directory
  rm -rf "dist-skills/.temp-$name"
  mkdir -p "dist-skills/.temp-$name"
  
  # Copy files
  cp -r "dist/$name" "dist-skills/.temp-$name/" 2>/dev/null || cp "dist/$name.js" "dist-skills/.temp-$name/" 2>/dev/null
  cp "$config" "dist-skills/.temp-$name/skill.json"
  
  # Create tarball
  tar -czf "dist-skills/$name.skill.tar.gz" -C "dist-skills/.temp-$name" .
  
  # Cleanup
  rm -rf "dist-skills/.temp-$name"
  
  # Show size
  local size=$(du -h "dist-skills/$name.skill.tar.gz" | cut -f1)
  echo "    ✓ $name.skill.tar.gz ($size)"
}

# Package all skills
package_skill "browse" "skill-browse.json"
package_skill "qa" "skill-qa.json"
package_skill "ship" "skill-ship.json"
package_skill "plan-ceo-review" "skill-plan-ceo-review.json"

echo ""
echo "✅ All skills packaged in dist-skills/"
ls -lh dist-skills/*.skill.tar.gz
