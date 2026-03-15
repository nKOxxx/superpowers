#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];
const outputDir = path.join(__dirname, '..', 'dist-skills');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📦 Packaging Superpowers Skills\n');

for (const skill of skills) {
  const skillDir = path.join(__dirname, '..', skill);
  const outputFile = path.join(outputDir, `${skill}.skill`);
  
  console.log(`📁 Packaging ${skill}...`);
  
  // Create tar.gz archive
  try {
    execSync(`tar -czf ${outputFile} -C ${skillDir} .`, {
      cwd: __dirname,
      stdio: 'pipe'
    });
    
    const stats = fs.statSync(outputFile);
    console.log(`   ✅ ${skill}.skill (${(stats.size / 1024).toFixed(1)}KB)`);
  } catch (error) {
    console.error(`   ❌ Failed to package ${skill}:`, error.message);
  }
}

console.log(`\n✅ All skills packaged to: ${outputDir}`);
console.log('\n📊 Package Sizes:');
for (const skill of skills) {
  const outputFile = path.join(outputDir, `${skill}.skill`);
  if (fs.existsSync(outputFile)) {
    const stats = fs.statSync(outputFile);
    console.log(`   ${skill}.skill: ${(stats.size / 1024).toFixed(1)}KB`);
  }
}