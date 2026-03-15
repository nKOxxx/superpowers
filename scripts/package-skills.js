#!/usr/bin/env node
/**
 * Package skills for OpenClaw distribution
 * Creates .skill packages for each skill
 */

import { mkdirSync, copyFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distSkillsDir = join(rootDir, 'dist-skills');

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];

console.log('📦 Packaging Superpowers skills...\n');

// Ensure dist-skills directory exists
if (!existsSync(distSkillsDir)) {
  mkdirSync(distSkillsDir, { recursive: true });
}

for (const skillName of skills) {
  const skillDir = join(rootDir, skillName);
  const outputDir = join(distSkillsDir, skillName);
  
  if (!existsSync(skillDir)) {
    console.log(`⚠️  Skipping ${skillName} - directory not found`);
    continue;
  }
  
  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Copy skill.json
  const skillJsonSrc = join(skillDir, 'skill.json');
  const skillJsonDest = join(outputDir, 'skill.json');
  if (existsSync(skillJsonSrc)) {
    copyFileSync(skillJsonSrc, skillJsonDest);
  } else {
    console.log(`⚠️  No skill.json found for ${skillName}`);
  }
  
  // Copy SKILL.md documentation
  const skillMdSrc = join(skillDir, 'SKILL.md');
  const skillMdDest = join(outputDir, 'SKILL.md');
  if (existsSync(skillMdSrc)) {
    copyFileSync(skillMdSrc, skillMdDest);
  }
  
  // Copy dist files for this skill
  const distDir = join(rootDir, 'dist', skillName);
  const distOutputDir = join(outputDir, 'dist', skillName);
  
  if (existsSync(distDir)) {
    if (!existsSync(distOutputDir)) {
      mkdirSync(distOutputDir, { recursive: true });
    }
    
    const files = readdirSync(distDir);
    for (const file of files) {
      copyFileSync(join(distDir, file), join(distOutputDir, file));
    }
  }
  
  // Copy shared dist files (types, utils)
  const sharedFiles = ['types.js', 'utils.js', 'types.d.ts', 'utils.d.ts'];
  const sharedDistDir = join(outputDir, 'dist');
  if (!existsSync(sharedDistDir)) {
    mkdirSync(sharedDistDir, { recursive: true });
  }
  
  for (const file of sharedFiles) {
    const src = join(rootDir, 'dist', file);
    if (existsSync(src)) {
      copyFileSync(src, join(sharedDistDir, file));
    }
  }
  
  console.log(`✅ ${skillName}`);
}

// Create package manifest
const manifest = {
  name: "@nko/superpowers",
  version: "1.0.0",
  description: "OpenClaw AI-driven development workflows",
  skills: skills,
  install: {
    npm: "@nko/superpowers",
    bins: ["node", "npx"]
  }
};

writeFileSync(
  join(distSkillsDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('\n📦 Package manifest created');
console.log(`\n✨ All skills packaged to: ${distSkillsDir}`);
