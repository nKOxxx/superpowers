import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];
const distDir = path.join(__dirname, '..', 'dist-skills');

// Ensure dist-skills exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

for (const skill of skills) {
  console.log(`Packaging ${skill}...`);

  const skillDir = path.join(__dirname, '..', skill);
  const skillJson = {
    name: skill === 'plan-ceo-review' ? 'plan-ceo-review' : skill,
    description: getSkillDescription(skill),
    version: '1.0.0',
    bin: skill,
    entry: 'dist/index.js',
    type: 'module'
  };

  // Create tarball with all necessary files
  const tarballName = `${skill}.skill.tar.gz`;
  const tarballPath = path.join(__dirname, '..', 'dist-skills', tarballName);

  // Package the skill directory
  execSync(`tar -czf ${tarballPath} -C ${path.dirname(skillDir)} ${path.basename(skillDir)}`);

  // Get file size
  const stats = fs.statSync(tarballPath);
  console.log(`  ✓ ${tarballName} (${(stats.size / 1024).toFixed(1)}KB)`);
}

console.log('\nAll skills packaged successfully!');

function getSkillDescription(skill) {
  const descriptions = {
    'browse': 'Browser automation for visual testing and QA with Playwright',
    'qa': 'Systematic testing as QA Lead - analyzes code changes and runs appropriate tests',
    'ship': 'One-command release pipeline - version bump, changelog, git tag, GitHub release',
    'plan-ceo-review': 'Product strategy review using BAT framework (Brand, Attention, Trust) and 10-star methodology'
  };
  return descriptions[skill];
}
