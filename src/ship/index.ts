import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

function exec(cmd: string, cwd = process.cwd()): string {
  try { return execSync(cmd, { encoding: 'utf-8', cwd, stdio: 'pipe' }).trim(); }
  catch (e: any) { throw new Error(`Command failed: ${cmd}\n${e.stderr || e.message}`); }
}

function getVersion(): string {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
  return pkg.version || '0.0.0';
}

function bump(v: string, type: string): string {
  const [major, minor, patch] = v.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function getCommits(): string[] {
  try {
    const lastTag = exec('git describe --tags --abbrev=0 2>/dev/null || echo ""');
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    return exec(`git log ${range} --pretty=format:"%s"`).split('\n').filter(Boolean);
  } catch { return []; }
}

function changelogEntry(version: string, commits: string[]): string {
  const date = new Date().toISOString().split('T')[0];
  const features = commits.filter(c => c.startsWith('feat')).map(c => c.replace(/^feat(?:\(.+\))?: /, ''));
  const fixes = commits.filter(c => c.startsWith('fix')).map(c => c.replace(/^fix(?:\(.+\))?: /, ''));
  let entry = `## [${version}] - ${date}\n\n`;
  if (features.length) { entry += '### Features\n'; features.forEach(f => entry += `- ${f}\n`); entry += '\n'; }
  if (fixes.length) { entry += '### Fixes\n'; fixes.forEach(f => entry += `- ${f}\n`); entry += '\n'; }
  return entry;
}

function updateChangelog(entry: string): void {
  const path = join(process.cwd(), 'CHANGELOG.md');
  const header = '# Changelog\n\n';
  const existing = existsSync(path) ? readFileSync(path, 'utf-8').replace(header, '') : '';
  writeFileSync(path, header + entry + existing);
}

async function ship(versionType: string, dryRun: boolean, skipChangelog: boolean, skipGit: boolean, skipGithub: boolean): Promise<void> {
  const spinner = ora('Preparing release...').start();
  try {
    const status = exec('git status --porcelain');
    if (status && !dryRun) { spinner.fail('Working directory not clean'); process.exit(1); }
    const current = getVersion();
    const newVersion = ['patch', 'minor', 'major'].includes(versionType) ? bump(current, versionType) : versionType;
    spinner.text = `${current} → ${newVersion}`;
    const commits = getCommits();
    if (!skipChangelog) {
      const entry = changelogEntry(newVersion, commits);
      if (dryRun) console.log('\nChangelog:\n' + entry);
      else updateChangelog(entry);
    }
    if (!dryRun) {
      const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
      pkg.version = newVersion;
      writeFileSync(join(process.cwd(), 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
    }
    if (!skipGit && !dryRun) {
      exec('git add -A');
      exec(`git commit -m "chore(release): ${newVersion}"`);
      exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
      exec('git push && git push --tags');
    }
    if (!skipGithub && !dryRun) {
      try { exec(`gh release create v${newVersion} --title "v${newVersion}" --notes "Release ${newVersion}"`); }
      catch { spinner.warn('GitHub release failed'); }
    }
    spinner.succeed(dryRun ? chalk.yellow('Dry run complete') : chalk.green(`Released v${newVersion}!`));
  } catch (e) { spinner.fail(String(e)); process.exit(1); }
}

const program = new Command();
program.name('ship').description('Release pipeline').version('1.0.0');
program.argument('[version]', 'Version type or explicit version', 'patch')
  .option('-d, --dry-run', 'Preview only').option('--skip-changelog', 'Skip changelog')
  .option('--skip-git', 'Skip git').option('--skip-github', 'Skip GitHub')
  .action((v, opts) => ship(v, opts.dryRun, opts.skipChangelog, opts.skipGit, opts.skipGithub));
program.command('preview').action(() => {
  const commits = getCommits();
  console.log(chalk.cyan(`Commits since last tag: ${commits.length}`));
  commits.forEach(c => console.log(`  - ${c}`));
});
program.command('version').action(() => console.log(getVersion()));
program.parse();