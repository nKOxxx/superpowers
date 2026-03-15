const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const DIST_DIR = path.join(__dirname, '..', 'dist-skills');
const DIST_SOURCE = path.join(__dirname, '..', 'dist');

// Ensure dist-skills exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Get all skill directories
const skills = fs.readdirSync(SKILLS_DIR).filter(dir => {
  return fs.statSync(path.join(SKILLS_DIR, dir)).isDirectory();
});

console.log('Packaging skills...\n');

for (const skill of skills) {
  const skillDir = path.join(SKILLS_DIR, skill);
  const skillJsonPath = path.join(skillDir, 'skill.json');
  
  if (!fs.existsSync(skillJsonPath)) {
    console.warn(`⚠ Skipping ${skill} - no skill.json found`);
    continue;
  }

  const skillConfig = JSON.parse(fs.readFileSync(skillJsonPath, 'utf8'));
  const packageName = `${skill}.skill`;
  const packageDir = path.join(DIST_DIR, packageName);

  // Create package directory
  if (fs.existsSync(packageDir)) {
    fs.rmSync(packageDir, { recursive: true });
  }
  fs.mkdirSync(packageDir, { recursive: true });

  // Copy skill.json
  fs.copyFileSync(skillJsonPath, path.join(packageDir, 'skill.json'));

  // Copy cli.js
  const cliSource = path.join(__dirname, '..', 'cli.js');
  const cliDest = path.join(packageDir, 'cli.js');
  fs.copyFileSync(cliSource, cliDest);

  // Copy dist folder
  const distDest = path.join(packageDir, 'dist');
  if (fs.existsSync(DIST_SOURCE)) {
    copyDir(DIST_SOURCE, distDest);
  }

  // Copy package.json for dependencies
  const pkgSource = path.join(__dirname, '..', 'package.json');
  const pkgDest = path.join(packageDir, 'package.json');
  fs.copyFileSync(pkgSource, pkgDest);

  // Create tarball
  const tarballName = `${packageName}.tar.gz`;
  const tarballPath = path.join(DIST_DIR, tarballName);
  
  execSync(`tar -czf ${tarballPath} -C ${DIST_DIR} ${packageName}`);
  
  // Get file size
  const stats = fs.statSync(tarballPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(`✓ ${skill} → ${tarballName} (${sizeKB} KB)`);
}

console.log('\n✅ All skills packaged!');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}