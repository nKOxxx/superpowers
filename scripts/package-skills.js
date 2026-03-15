#!/usr/bin/env node

/**
 * Package skills for distribution
 */

const fs = require('fs');
const path = require('path');

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];
const distDir = path.join(__dirname, '..', 'dist-skills');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy compiled JS files from dist to skill packages
for (const skill of skills) {
  const skillDir = path.join(distDir, skill);
  
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }

  // Copy skill files
  const srcDir = path.join(__dirname, '..', 'dist');
  
  // Copy all compiled files
  if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);
    for (const file of files) {
      const src = path.join(srcDir, file);
      const dest = path.join(skillDir, file);
      
      if (fs.statSync(src).isDirectory()) {
        // Copy recursively
        copyDir(src, dest);
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  }

  console.log(`✓ Packaged ${skill}`);
}

console.log(`\n✓ All skills packaged to ${distDir}`);

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
