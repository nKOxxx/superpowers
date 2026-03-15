#!/usr/bin/env node
/**
 * Package skills for OpenClaw distribution
 * Creates .skill files (tar.gz of skill directory)
 */

const { execSync } = require('child_process');
const { existsSync, mkdirSync, writeFileSync, cpSync, rmSync } = require('fs');
const { join, resolve } = require('path');

const SKILLS = ['browse', 'qa', 'ship', 'plan-ceo-review'];
const ROOT = resolve(process.cwd());
const DIST = join(ROOT, 'dist');
const OUTPUT = join(ROOT, 'dist-skills');

function main() {
  console.log('📦 Packaging Superpowers skills...\n');

  // Ensure dist exists
  if (!existsSync(DIST)) {
    console.error('❌ dist/ directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  // Create output directory
  if (existsSync(OUTPUT)) {
    rmSync(OUTPUT, { recursive: true });
  }
  mkdirSync(OUTPUT, { recursive: true });

  for (const skill of SKILLS) {
    packageSkill(skill);
  }

  console.log('\n✅ All skills packaged successfully!');
  console.log(`📁 Output: ${OUTPUT}`);
}

function packageSkill(name) {
  console.log(`🔨 Packaging ${name}...`);

  const skillDir = join(OUTPUT, name);
  const skillDist = join(skillDir, 'dist');

  // Create skill directory structure
  mkdirSync(skillDist, { recursive: true });

  // Copy compiled files
  const srcDir = join(DIST, name);
  if (existsSync(srcDir)) {
    cpSync(srcDir, skillDist, { recursive: true });
  }

  // Copy shared files
  const sharedFiles = ['types.js', 'utils.js', 'types.d.ts', 'utils.d.ts'];
  for (const file of sharedFiles) {
    const src = join(DIST, file);
    if (existsSync(src)) {
      cpSync(src, join(skillDist, file));
    }
  }

  // Create package.json for the skill
  const pkg = {
    name: `@nko/superpowers-${name}`,
    version: '1.0.0',
    description: `Superpowers skill: ${name}`,
    main: 'dist/index.js',
    type: 'module',
    dependencies: name === 'browse' ? { playwright: '^1.40.0' } : {}
  };
  writeFileSync(join(skillDir, 'package.json'), JSON.stringify(pkg, null, 2));

  // Copy and customize SKILL.md
  const skillMd = generateSkillMd(name);
  writeFileSync(join(skillDir, 'SKILL.md'), skillMd);

  // Create tar.gz
  const tarName = `${name}.skill`;
  execSync(`tar -czf ${tarName} -C ${skillDir} .`, { cwd: OUTPUT });

  // Clean up temp directory
  rmSync(skillDir, { recursive: true });

  const stats = execSync(`ls -lh ${join(OUTPUT, tarName)}`, { encoding: 'utf-8' });
  console.log(`   ✓ ${tarName} ${stats.trim().split(/\s+/)[4]}`);
}

function generateSkillMd(name) {
  const docs = {
    browse: `# Browse Skill

Browser automation with Playwright for OpenClaw.

## Usage

\`\`\`
/browse <url> [--viewport=mobile|tablet|desktop] [--full-page] [--wait-for=<selector>]
\`\`\`

## Actions

- click, type, wait, scroll, hover, screenshot

## Examples

\`\`\`
/browse https://example.com --viewport=mobile --full-page
/browse https://example.com --actions='[{\"kind\":\"click\",\"selector\":\"#btn\"}]'
\`\`\``,

    qa: `# QA Skill

Systematic testing as QA Lead.

## Usage

\`\`\`
/qa [--mode=targeted|smoke|full] [--coverage]
\`\`\`

## Modes

- targeted: Run tests for changed files (default)
- smoke: Quick validation
- full: Complete regression suite

## Examples

\`\`\`
/qa --mode=targeted
/qa --mode=full --coverage
\`\`\``,

    ship: `# Ship Skill

One-command release pipeline.

## Usage

\`\`\`
/ship [--version=patch|minor|major] [--dry-run]
\`\`\`

## Features

- Semantic versioning
- Conventional commit changelog
- Git tag + push
- GitHub release creation

## Examples

\`\`\`
/ship --version=minor
/ship --dry-run
\`\`\``,

    'plan-ceo-review': `# CEO Review Skill

BAT Framework for product strategy decisions.

## Usage

\`\`\`
/plan-ceo-review "Product: Description" [--brand=N] [--attention=N] [--trust=N]
\`\`\`

## BAT Framework

- Brand: Alignment with identity (0-5)
- Attention: Market demand (0-5)
- Trust: Delivery capability (0-5)

10+ stars = Build, 7-9 = Consider, <7 = Don't build

## Examples

\`\`\`
/plan-ceo-review "MoltStamp: API key escrow for AI agents"
/plan-ceo-review "Product X" --brand=4 --attention=5 --trust=3
\`\`\``
  };

  return docs[name] || `# ${name} Skill\\n\\nSuperpowers skill for OpenClaw.`;
}

main();
