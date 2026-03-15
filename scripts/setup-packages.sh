#!/bin/bash

# Setup script for reorganizing superpowers into packages/ structure
set -e

echo "Setting up packages structure..."

# Create packages directory
mkdir -p packages

# Function to setup a skill package
setup_skill() {
  local skill=$1
  echo "Setting up packages/$skill..."
  
  # Create package directory
  mkdir -p packages/$skill/src
  
  # Copy source files
  cp $skill/src/index.ts packages/$skill/src/
  
  echo "  ✓ Copied source files for $skill"
}

# Setup each skill
setup_skill "browse"
setup_skill "qa"
setup_skill "ship"
setup_skill "plan-ceo-review"

echo ""
echo "✅ Package structure created!"
echo "Next: Run 'npm install' and 'npm run build' to compile"
