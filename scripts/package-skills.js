#!/usr/bin/env node

/**
 * Package skills into distributable tar.gz files
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];
const skillsDir = resolve(process.cwd());
const outputDir = resolve(process.cwd(), 'dist-skills');

console.log('📦 Packaging skills...\n');

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

for (const skill of skills) {
  const skillDir = join(skillsDir, skill);
  const distDir = join(skillDir, 'dist');
  const skillJsonPath = join(skillDir, 'skill.json');
  const cliPath = join(skillDir, 'cli.js');
  const packageJsonPath = join(skillDir, 'package.json');
  const readmePath = join(skillDir, 'README.md');
  
  // Check if build exists
  if (!existsSync(distDir)) {
    console.error(`❌ ${skill}: No dist directory found. Run 'npm run build' first.`);
    continue;
  }
  
  // Create temporary packaging directory
  const tempDir = join(outputDir, `.temp-${skill}`);
  if (existsSync(tempDir)) {
    execSync(`rm -rf ${tempDir}`);
  }
  mkdirSync(tempDir, { recursive: true });
  
  // Copy files to temp directory
  execSync(`cp -r ${distDir} ${join(tempDir, 'dist')}`);
  copyFileSync(skillJsonPath, join(tempDir, 'skill.json'));
  copyFileSync(cliPath, join(tempDir, 'cli.js'));
  copyFileSync(packageJsonPath, join(tempDir, 'package.json'));
  copyFileSync(readmePath, join(tempDir, 'README.md'));
  
  // Create tarball
  const tarballPath = join(outputDir, `${skill}.skill.tar.gz`);
  execSync(`tar -czf ${tarballPath} -C ${tempDir} .`);
  
  // Clean up temp directory
  execSync(`rm -rf ${tempDir}`);
  
  // Get file size
  const stats = execSync(`ls -lh ${tarballPath} | awk '{print $5}'`, { encoding: 'utf-8' }).trim();
  console.log(`✅ ${skill}: ${tarballPath.replace(process.cwd() + '/', '')} (${stats})`);
}

console.log('\n🎉 All skills packaged successfully!');
console.log(`\nOutput directory: ${outputDir}`);
