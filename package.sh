#!/bin/bash

# Package script for OpenClaw superpowers
set -e

echo "📦 Packaging OpenClaw superpowers..."

cd "$(dirname "$0")"

# Create dist directory for packages
mkdir -p dist/packages

# Package each skill
for skill_dir in skills/*/; do
    skill_name=$(basename "$skill_dir")
    echo "  📦 Packaging $skill_name..."
    
    # Create skill package
    tar -czf "dist/packages/${skill_name}.skill.tar.gz" \
        -C "$skill_dir" \
        skill.json \
        package.json \
        dist/
done

# Create root package
tar -czf "dist/packages/superpowers.tar.gz" \
    cli.js \
    package.json \
    README.md

echo "✅ Packaging complete!"
echo ""
echo "Packages created:"
ls -la dist/packages/
