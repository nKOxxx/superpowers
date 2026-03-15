import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ShipOptions {
  version: string;
  dryRun: boolean;
  skipTests: boolean;
  skipChangelog: boolean;
}

interface ReleaseInfo {
  oldVersion: string;
  newVersion: string;
  changelog: string;
  tag: string;
}

function parseArgs(): ShipOptions {
  const args = process.argv.slice(2);
  const options: ShipOptions = { 
    version: 'patch', 
    dryRun: false, 
    skipTests: false,
    skipChangelog: false 
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--version' && args[i + 1]) {
      options.version = args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--skip-tests') {
      options.skipTests = true;
    } else if (arg === '--skip-changelog') {
      options.skipChangelog = true;
    }
  }
  
  return options;
}

function getCurrentVersion(): string {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error('No package.json found');
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  return pkg.version || '0.0.0';
}

function bumpVersion(current: string, bump: string): string {
  const [major, minor, patch] = current.split('.').map(Number);
  
  if (bump === 'major') {
    return `${major + 1}.0.0`;
  } else if (bump === 'minor') {
    return `${major}.${minor + 1}.0`;
  } else if (bump === 'patch') {
    return `${major}.${minor}.${patch + 1}`;
  } else if (/^\d+\.\d+\.\d+$/.test(bump)) {
    return bump; // Explicit version
  }
  
  throw new Error(`Invalid version bump: ${bump}`);
}

function generateChangelog(oldVersion: string, newVersion: string): string {
  try {
    // Get commits since last tag
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD~20';
    
    const commits = execSync(`git log ${range} --pretty=format:"%s (%h)" --no-merges`, { encoding: 'utf-8' });
    
    const lines = commits.split('\n').filter(c => c.trim());
    const categories: Record<string, string[]> = {
      feat: [],
      fix: [],
      docs: [],
      refactor: [],
      test: [],
      chore: []
    };
    
    for (const line of lines) {
      const match = line.match(/^(\w+)[\(:]/);
      if (match) {
        const type = match[1];
        if (categories[type]) {
          categories[type].push(line);
        }
      }
    }
    
    let changelog = `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n`;
    
    if (categories.feat.length) {
      changelog += '### ✨ Features\n';
      categories.feat.forEach(c => changelog += `- ${c}\n`);
      changelog += '\n';
    }
    
    if (categories.fix.length) {
      changelog += '### 🐛 Bug Fixes\n';
      categories.fix.forEach(c => changelog += `- ${c}\n`);
      changelog += '\n';
    }
    
    if (categories.docs.length) {
      changelog += '### 📚 Documentation\n';
      categories.docs.forEach(c => changelog += `- ${c}\n`);
      changelog += '\n';
    }
    
    if (categories.refactor.length) {
      changelog += '### ♻️ Refactoring\n';
      categories.refactor.forEach(c => changelog += `- ${c}\n`);
      changelog += '\n';
    }
    
    return changelog;
  } catch {
    return `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n- See git log for changes\n`;
  }
}

function updatePackageVersion(version: string): void {
  const packagePath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  pkg.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
}

function updateChangelog(newEntry: string): void {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  
  if (fs.existsSync(changelogPath)) {
    const existing = fs.readFileSync(changelogPath, 'utf-8');
    fs.writeFileSync(changelogPath, existing.replace('# Changelog\n\n', header) + '\n' + newEntry);
  } else {
    fs.writeFileSync(changelogPath, header + newEntry);
  }
}

async function ship(options: ShipOptions): Promise<void> {
  console.log('🚀 SHIP - Release Pipeline\n');
  
  if (options.dryRun) {
    console.log('📝 DRY RUN MODE - No changes will be made\n');
  }
  
  // Check git status
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim() && !options.dryRun) {
      console.error('❌ Working tree is not clean. Commit or stash changes first.');
      process.exit(1);
    }
  } catch {
    console.error('❌ Not a git repository');
    process.exit(1);
  }
  
  const oldVersion = getCurrentVersion();
  const newVersion = bumpVersion(oldVersion, options.version);
  
  console.log(`Version: ${oldVersion} → ${newVersion}\n`);
  
  // Run tests
  if (!options.skipTests && !options.dryRun) {
    console.log('Running tests...');
    try {
      execSync('npm test', { stdio: 'inherit' });
    } catch {
      console.error('❌ Tests failed. Aborting release.');
      process.exit(1);
    }
  }
  
  // Generate changelog
  const changelog = generateChangelog(oldVersion, newVersion);
  
  if (!options.skipChangelog) {
    console.log('\n📋 Changelog Preview:');
    console.log('-'.repeat(50));
    console.log(changelog);
    console.log('-'.repeat(50));
  }
  
  if (options.dryRun) {
    console.log('\n✅ Dry run complete. No changes made.');
    return;
  }
  
  // Update version
  updatePackageVersion(newVersion);
  console.log('✅ Updated package.json');
  
  // Update changelog
  if (!options.skipChangelog) {
    updateChangelog(changelog);
    console.log('✅ Updated CHANGELOG.md');
  }
  
  // Git commit
  execSync('git add package.json CHANGELOG.md 2>/dev/null || git add package.json');
  execSync(`git commit -m "chore(release): ${newVersion}"`);
  console.log('✅ Created release commit');
  
  // Create tag
  const tag = `v${newVersion}`;
  execSync(`git tag -a ${tag} -m "Release ${newVersion}"`);
  console.log(`✅ Created tag: ${tag}`);
  
  // Push
  try {
    execSync('git push origin HEAD');
    execSync(`git push origin ${tag}`);
    console.log('✅ Pushed to origin');
  } catch {
    console.warn('⚠️  Failed to push. Push manually with:');
    console.warn(`   git push origin HEAD && git push origin ${tag}`);
  }
  
  // Create GitHub release
  if (process.env.GH_TOKEN) {
    try {
      execSync(`gh release create ${tag} --title "Release ${newVersion}" --notes "${changelog.substring(0, 500)}"`);
      console.log('✅ Created GitHub release');
    } catch {
      console.warn('⚠️  Failed to create GitHub release. Create manually or ensure gh CLI is authenticated.');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 RELEASE COMPLETE!');
  console.log('='.repeat(50));
  console.log(`Version: ${newVersion}`);
  console.log(`Tag: ${tag}`);
  console.log('\n📦 Next steps:');
  console.log('  - npm publish (if package)');
  console.log('  - Deploy to production');
}

ship(parseArgs()).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
