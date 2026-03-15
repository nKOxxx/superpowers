#!/usr/bin/env node
/**
 * Package all skills into distributable .skill.tar.gz files
 */
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, copyFileSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const skillsDir = resolve('skills');
const distDir = resolve('dist-skills');
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Get all skill directories
const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

console.log('Packaging skills...\n');

for (const skillName of skillDirs) {
  const skillDir = join(skillsDir, skillName);
  const skillJsonPath = join(skillsDir, `${skillName}.skill.json`);
  
  if (!existsSync(skillJsonPath)) {
    console.log(`⚠ Skipping ${skillName}: No skill.json found`);
    continue;
  }

  const skillJson = JSON.parse(readFileSync(skillJsonPath, 'utf-8'));
  const outputFile = join(distDir, `${skillName}.skill.tar.gz`);

  // Create temporary package directory
  const tempDir = join(distDir, `temp-${skillName}`);
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  // Copy skill files
  copyFileSync(skillJsonPath, join(tempDir, 'skill.json'));
  copyFileSync(join(skillDir, 'SKILL.md'), join(tempDir, 'SKILL.md'));

  // Add package metadata
  const metadata = {
    name: skillJson.name,
    version: skillJson.version,
    packageVersion: packageJson.version,
    description: skillJson.description,
    author: skillJson.author,
    builtAt: new Date().toISOString()
  };
  writeFileSync(join(tempDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  // Create tarball
  try {
    execSync(`tar -czf "${outputFile}" -C "${tempDir}" .`, { stdio: 'pipe' });
    const stats = readFileSync(outputFile);
    const sizeKb = (stats.length / 1024).toFixed(1);
    console.log(`✓ ${skillName}.skill.tar.gz (${sizeKb} KB)`);
  } catch (error) {
    console.error(`✗ Failed to package ${skillName}:`, error);
  }

  // Cleanup temp dir
  try {
    execSync(`rm -rf "${tempDir}"`, { stdio: 'pipe' });
  } catch {
    // Ignore cleanup errors
  }
}

console.log('\n✓ All skills packaged to dist-skills/');
