const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const skills = ['browse', 'qa', 'ship', 'plan-ceo-review'];
const distDir = path.join(__dirname, '..', 'dist-skills');

// Ensure dist-skills exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

for (const skill of skills) {
  console.log(`Packaging ${skill}...`);

  const skillDir = path.join(__dirname, '..', 'dist', skill);
  const skillJson = {
    name: skill === 'plan-ceo-review' ? 'plan-ceo-review' : skill,
    description: getSkillDescription(skill),
    version: '1.0.0',
    bin: {
      [skill === 'plan-ceo-review' ? 'ceo-review' : skill]: 'cli.js'
    },
    entry: 'index.js'
  };

  // Create temporary directory for packaging
  const tempDir = path.join(__dirname, '..', 'temp', skill);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Copy files
  const files = fs.readdirSync(skillDir);
  for (const file of files) {
    fs.copyFileSync(
      path.join(skillDir, file),
      path.join(tempDir, file)
    );
  }

  // Write skill.json
  fs.writeFileSync(
    path.join(tempDir, 'skill.json'),
    JSON.stringify(skillJson, null, 2)
  );

  // Create CLI wrapper
  const cliWrapper = `#!/usr/bin/env node
import('./index.js').then(m => m.default?.() || m);
`;
  fs.writeFileSync(path.join(tempDir, 'cli.js'), cliWrapper);

  // Create tarball
  const tarballName = `${skill}.skill.tar.gz`;
  const tarballPath = path.join(__dirname, '..', 'dist-skills', tarballName);

  execSync(`tar -czf ${tarballPath} -C ${path.dirname(tempDir)} ${skill}`);

  // Get file size
  const stats = fs.statSync(tarballPath);
  console.log(`  ✓ ${tarballName} (${(stats.size / 1024).toFixed(1)}KB)`);
}

// Cleanup temp
execSync(`rm -rf ${path.join(__dirname, '..', 'temp')}`);

console.log('\nAll skills packaged successfully!');

function getSkillDescription(skill) {
  const descriptions = {
    'browse': 'Browser automation for visual testing and QA with Playwright',
    'qa': 'Systematic testing as QA Lead',
    'ship': 'One-command release pipeline',
    'plan-ceo-review': 'Product strategy review using BAT framework'
  };
  return descriptions[skill];
}
