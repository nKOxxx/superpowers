#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];
const distSkillsDir = join(process.cwd(), 'dist-skills');

if (!existsSync(distSkillsDir)) {
  mkdirSync(distSkillsDir, { recursive: true });
}

for (const skill of skills) {
  const skillDir = join(process.cwd(), skill);
  const skillDist = join(skillDir, 'dist');
  
  if (!existsSync(skillDist)) {
    console.log(`⚠️  ${skill}: dist/ not found, skipping`);
    continue;
  }
  
  console.log(`📦 Packaging ${skill}...`);
  
  // Read skill.json for metadata
  const skillJsonPath = join(skillDir, 'skill.json');
  const skillJson = existsSync(skillJsonPath) 
    ? JSON.parse(readFileSync(skillJsonPath, 'utf-8'))
    : { name: skill, version: '1.0.0' };
  
  // Create package manifest
  const manifest = {
    ...skillJson,
    packagedAt: new Date().toISOString(),
    files: ['cli.js', 'dist/', 'skill.json']
  };
  
  // Write manifest to skill dir temporarily for packaging
  const manifestPath = join(skillDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  // Create tar.gz
  const outputFile = join(distSkillsDir, `${skill}.skill.tar.gz`);
  
  try {
    // Use tar to create the package
    execSync(`tar -czf ${outputFile} -C ${skillDir} cli.js dist skill.json manifest.json`, {
      stdio: 'inherit'
    });
    
    // Clean up manifest
    // unlinkSync(manifestPath);
    
    // Get file size
    const stats = existsSync(outputFile);
    if (stats) {
      const { execSync } = await import('child_process');
      const size = execSync(`du -h ${outputFile} | cut -f1`, { encoding: 'utf-8' }).trim();
      console.log(`   ✅ ${skill}.skill.tar.gz (${size})`);
    }
  } catch (error) {
    console.error(`   ❌ Failed to package ${skill}: ${error}`);
  }
}

console.log('\n📦 All skills packaged to dist-skills/');