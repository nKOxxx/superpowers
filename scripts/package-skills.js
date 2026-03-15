#!/usr/bin/env node

/**
 * Package skills into .skill files
 * Each .skill file is a zip containing the skill folder contents
 */

import { zip } from 'compressing';
import { readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const skillsDir = join(process.cwd(), 'skills');
const outputDir = join(process.cwd(), 'dist-skills');

// Create output directory if needed
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

async function packageSkill(skillName) {
  const skillPath = join(skillsDir, skillName);
  const outputPath = join(outputDir, `${skillName}.skill`);
  
  console.log(`Packaging ${skillName}...`);
  
  try {
    await zip.compressDir(skillPath, outputPath);
    const stats = statSync(outputPath);
    console.log(`✓ ${skillName}.skill (${(stats.size / 1024).toFixed(1)}KB)`);
    return true;
  } catch (error) {
    console.error(`✗ ${skillName}: ${error}`);
    return false;
  }
}

async function main() {
  console.log('Packaging skills...\n');
  
  const skills = readdirSync(skillsDir).filter(name => {
    const path = join(skillsDir, name);
    return statSync(path).isDirectory();
  });
  
  let success = 0;
  for (const skill of skills) {
    if (await packageSkill(skill)) {
      success++;
    }
  }
  
  console.log(`\n${success}/${skills.length} skills packaged`);
  console.log(`Output: ${outputDir}`);
}

main().catch(console.error);
