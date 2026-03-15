#!/usr/bin/env node
/**
 * Package skills for OpenClaw distribution
 * Creates *.skill.tar.gz files for each skill
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'packages');

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];

// Ensure packages directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

console.log('📦 Packaging Superpowers skills...\n');

for (const skill of skills) {
  const skillDir = path.join(ROOT_DIR, skill);
  const packageName = `${skill}.skill`;
  const packageDir = path.join(DIST_DIR, packageName);
  
  // Check if skill exists
  if (!fs.existsSync(skillDir)) {
    console.warn(`⚠ Skipping ${skill} - directory not found`);
    continue;
  }
  
  // Clean and create package directory
  if (fs.existsSync(packageDir)) {
    fs.rmSync(packageDir, { recursive: true });
  }
  fs.mkdirSync(packageDir, { recursive: true });
  
  // Copy skill.json
  fs.copyFileSync(
    path.join(skillDir, 'skill.json'),
    path.join(packageDir, 'skill.json')
  );
  
  // Copy cli.js
  fs.copyFileSync(
    path.join(skillDir, 'cli.js'),
    path.join(packageDir, 'cli.js')
  );
  
  // Copy package.json
  fs.copyFileSync(
    path.join(skillDir, 'package.json'),
    path.join(packageDir, 'package.json')
  );
  
  // Copy dist folder
  const distSource = path.join(skillDir, 'dist');
  const distDest = path.join(packageDir, 'dist');
  
  if (fs.existsSync(distSource)) {
    copyDir(distSource, distDest);
  } else {
    console.warn(`⚠ ${skill}: No dist folder found. Run 'npm run build' first.`);
  }
  
  // Create tarball
  const tarballName = `${packageName}.tar.gz`;
  const tarballPath = path.join(DIST_DIR, tarballName);
  
  execSync(`tar -czf ${tarballPath} -C ${DIST_DIR} ${packageName}`);
  
  // Get file size
  const stats = fs.statSync(tarballPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  
  console.log(`✓ ${skill} → ${tarballName} (${sizeKB} KB)`);
}

console.log('\n✅ All skills packaged!');
console.log(`\nLocation: ${DIST_DIR}/`);

// Helper function to copy directory
function copyDir(src, dest) {
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
