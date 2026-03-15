#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, statSync } from 'fs';
import { join, dirname as pathDirname } from 'path';

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];
const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const distSkillsDir = join(rootDir, 'dist-skills');

console.log('📦 Packaging skills for distribution...\n');

// Ensure dist-skills directory exists
if (!existsSync(distSkillsDir)) {
  mkdirSync(distSkillsDir, { recursive: true });
}

for (const skill of skills) {
  console.log(`📦 Packaging ${skill}...`);
  
  const skillDistDir = join(distDir, skill);
  const skillJsonPath = join(rootDir, 'src', skill, 'skill.json');
  
  if (!existsSync(skillDistDir)) {
    console.error(`  ❌ dist/${skill} not found. Run 'npm run build' first.`);
    continue;
  }
  
  if (!existsSync(skillJsonPath)) {
    console.error(`  ❌ skill.json not found for ${skill}`);
    continue;
  }
  
  // Copy skill.json to dist
  copyFileSync(skillJsonPath, join(skillDistDir, 'skill.json'));
  
  // Create package directory
  const packageDir = join(distSkillsDir, skill);
  if (!existsSync(packageDir)) {
    mkdirSync(packageDir, { recursive: true });
  }
  
  // Copy all compiled files
  const files = execSync(`find ${skillDistDir} -type f`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(f => f.length > 0);
  
  for (const file of files) {
    const relativePath = file.replace(skillDistDir + '/', '');
    const destPath = join(packageDir, relativePath);
    const destDir = pathDirname(destPath);
    
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    
    copyFileSync(file, destPath);
  }
  
  // Create tar.gz
  const tarPath = join(distSkillsDir, `${skill}.skill.tar.gz`);
  execSync(`tar -czf ${tarPath} -C ${distSkillsDir} ${skill}`);
  
  // Get size
  const stats = statSync(tarPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  
  console.log(`  ✅ ${skill}.skill.tar.gz (${sizeKB} KB)`);
}

console.log('\n✅ All skills packaged!');
console.log(`\nInstall a skill with: openclaw skills install <path/to/skill.tar.gz>`);