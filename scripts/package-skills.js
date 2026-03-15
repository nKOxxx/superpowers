#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];
const distDir = './dist';
const outputDir = './dist-skills';

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

for (const skill of skills) {
  console.log(`📦 Packaging ${skill}...`);
  
  const skillDir = join(distDir, skill);
  const tempDir = join(outputDir, `.temp-${skill}`);
  
  // Create temp directory
  execSync(`rm -rf ${tempDir} && mkdir -p ${tempDir}`, { stdio: 'inherit' });
  
  // Copy compiled files
  execSync(`cp -r ${skillDir}/* ${tempDir}/`, { stdio: 'inherit' });
  
  // Copy skill.json
  copyFileSync(
    join('src', skill, 'skill.json'),
    join(tempDir, 'skill.json')
  );
  
  // Copy cli.js for standalone usage
  copyFileSync(
    join('src', skill, 'cli.js'),
    join(tempDir, 'cli.js')
  );
  
  // Create package.json for skill
  const skillPackage = {
    name: `@nko/superpowers-${skill}`,
    version: '1.0.0',
    type: 'module',
    main: 'index.js',
    bin: skill === 'browse' ? { [`superpowers-${skill}`]: 'cli.js' } : undefined
  };
  writeFileSync(
    join(tempDir, 'package.json'),
    JSON.stringify(skillPackage, null, 2)
  );
  
  // Create tar.gz
  const outputFile = join(outputDir, `${skill}.skill.tar.gz`);
  execSync(`tar -czf ${outputFile} -C ${tempDir} .`, { stdio: 'inherit' });
  
  // Cleanup temp
  execSync(`rm -rf ${tempDir}`, { stdio: 'inherit' });
  
  console.log(`✅ ${skill}.skill.tar.gz created`);
}

console.log('\n🎉 All skills packaged!');
