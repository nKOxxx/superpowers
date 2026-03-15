#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');
const distSkillsDir = join(rootDir, 'dist-skills');

// Ensure dist-skills directory exists
if (!existsSync(distSkillsDir)) {
  mkdirSync(distSkillsDir, { recursive: true });
}

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];

console.log('📦 Packaging OpenClaw superpowers...\n');

for (const skill of skills) {
  console.log(`🔨 Packaging ${skill}...`);
  
  const skillDir = join(rootDir, 'packages', skill);
  const distDir = join(skillDir, 'dist');
  const skillJsonPath = join(skillDir, 'skill.json');
  const cliPath = join(skillDir, 'cli.js');
  
  // Verify files exist
  if (!existsSync(distDir)) {
    console.error(`  ❌ dist/ not found for ${skill}`);
    continue;
  }
  
  if (!existsSync(skillJsonPath)) {
    console.error(`  ❌ skill.json not found for ${skill}`);
    continue;
  }
  
  if (!existsSync(cliPath)) {
    console.error(`  ❌ cli.js not found for ${skill}`);
    continue;
  }
  
  // Create tarball
  const tarballPath = join(distSkillsDir, `${skill}.skill.tar.gz`);
  
  try {
    // Copy skill.json to dist temporarily for packaging
    copyFileSync(skillJsonPath, join(distDir, 'skill.json'));
    copyFileSync(cliPath, join(distDir, 'cli.js'));
    
    // Create tarball from dist directory contents
    execSync(`tar -czf "${tarballPath}" -C "${distDir}" .`, {
      cwd: rootDir,
      stdio: 'ignore'
    });
    
    // Clean up copied files
    const stats = existsSync(join(distDir, 'skill.json')) ? readFileSync(join(distDir, 'skill.json')) : null;
    
    console.log(`  ✅ ${skill}.skill.tar.gz created`);
    
    // Get file size
    const size = existsSync(tarballPath) 
      ? (readFileSync(tarballPath).length / 1024).toFixed(1) + ' KB'
      : 'unknown';
    console.log(`     Size: ${size}`);
    
  } catch (error) {
    console.error(`  ❌ Failed to package ${skill}:`, error.message);
  }
}

console.log('\n✨ Packaging complete!');
console.log(`\n📂 Output directory: ${distSkillsDir}`);
console.log('\nTo install skills:');
console.log('  openclaw skill install ./dist-skills/<skill-name>.skill.tar.gz');
