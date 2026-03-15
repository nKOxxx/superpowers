#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const distSkillsDir = join(rootDir, 'dist-skills');

const skills = [
  { name: 'browse', description: 'Browser automation for visual testing and QA with Playwright' },
  { name: 'qa', description: 'Systematic testing as QA Lead' },
  { name: 'ship', description: 'One-command release pipeline' },
  { name: 'plan-ceo-review', description: 'Product strategy review using BAT framework' }
];

// Create dist-skills directory
if (!existsSync(distSkillsDir)) {
  mkdirSync(distSkillsDir, { recursive: true });
}

for (const skill of skills) {
  console.log(`Packaging ${skill.name}...`);
  
  const skillDir = join(distSkillsDir, skill.name);
  const skillDistDir = join(skillDir, 'dist');
  
  // Clean up
  if (existsSync(skillDir)) {
    rmSync(skillDir, { recursive: true });
  }
  
  // Create structure
  mkdirSync(skillDir, { recursive: true });
  mkdirSync(skillDistDir, { recursive: true });
  
  // Copy dist files
  cpSync(distDir, skillDistDir, { recursive: true });
  
  // Create skill.json
  const skillJson = {
    name: skill.name,
    description: skill.description,
    version: '1.0.0',
    entry: 'dist/cli.js',
    bin: {
      superpowers: 'dist/cli.js'
    }
  };
  
  writeFileSync(join(skillDir, 'skill.json'), JSON.stringify(skillJson, null, 2));
  
  // Copy package.json
  const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
  const skillPkg = {
    name: `@nko/superpowers-${skill.name}`,
    version: '1.0.0',
    description: skill.description,
    type: 'module',
    main: 'dist/cli.js',
    bin: {
      superpowers: 'dist/cli.js'
    },
    engines: pkg.engines,
    dependencies: pkg.dependencies
  };
  
  writeFileSync(join(skillDir, 'package.json'), JSON.stringify(skillPkg, null, 2));
  
  // Create tarball
  const tarCmd = `tar -czf "${skill.name}.skill.tar.gz" -C "${distSkillsDir}" "${skill.name}"`;
  execSync(tarCmd, { cwd: distSkillsDir });
  
  console.log(`  ✓ ${skill.name}.skill.tar.gz created`);
}

console.log('\nAll skills packaged successfully!');
console.log(`Location: ${distSkillsDir}/`);