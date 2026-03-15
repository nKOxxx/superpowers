#!/usr/bin/env node
/**
 * Superpowers - Unified CLI for OpenClaw Skills
 * 
 * Usage:
 *   superpowers browse <url> [options]
 *   superpowers qa [options]
 *   superpowers ship --repo=<r> --version=<v>
 *   superpowers plan-ceo-review <feature>
 *   superpowers --help
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SKILLS: Record<string, string> = {
  'browse': '../browse/scripts/browse.js',
  'qa': '../qa/scripts/qa.js',
  'ship': '../ship/scripts/ship.js',
  'plan-ceo-review': '../plan-ceo-review/scripts/plan-ceo-review.js',
  'ceo-review': '../plan-ceo-review/scripts/plan-ceo-review.js',
  'plan': '../plan-ceo-review/scripts/plan-ceo-review.js'
};

const HELP_TEXT = `
🦞 Superpowers for OpenClaw

AI-powered workflows for development, testing, and product decisions.

Usage:
  superpowers <skill> [args...]

Skills:
  browse <url>          Browser automation & screenshot capture
  qa [options]          Systematic testing & QA
  ship [options]        Release pipeline & versioning
  plan-ceo-review <f>   Product strategy with BAT framework

Options:
  --help, -h            Show this help
  --version, -v         Show version

Examples:
  superpowers browse https://example.com --viewport=mobile
  superpowers qa --mode=full
  superpowers ship --repo=nKOxxx/app --version=patch
  superpowers plan-ceo-review "Should we build X?"

Configuration:
  Edit superpowers.config.json for custom settings.

Documentation:
  https://github.com/nKOxxx/superpowers
`;

function main(): void {
  const args = process.argv.slice(2);
  
  // Show help
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(HELP_TEXT);
    process.exit(0);
  }
  
  // Show version
  if (args[0] === '--version' || args[0] === '-v') {
    const pkgPath = path.join(__dirname, '../package.json');
    try {
      const pkg = JSON.parse(require('fs').readFileSync(pkgPath, 'utf-8'));
      console.log(`superpowers v${pkg.version}`);
    } catch {
      console.log('superpowers v1.0.0');
    }
    process.exit(0);
  }
  
  // Get skill name
  const skillName = args[0] ?? '';
  const skillPath = SKILLS[skillName];
  
  if (!skillPath) {
    console.error(`❌ Unknown skill: ${skillName}`);
    console.error(`\nAvailable skills: ${Object.keys(SKILLS).filter(k => !k.includes('-')).join(', ')}`);
    console.error(`\nRun "superpowers --help" for usage.`);
    process.exit(1);
  }
  
  // Spawn the skill process
  const scriptPath = path.join(__dirname, skillPath);
  const skillArgs = args.slice(1);
  
  const child = spawn('node', [scriptPath, ...skillArgs], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  child.on('exit', (code: number | null) => {
    process.exit(code ?? 0);
  });
  
  child.on('error', (err) => {
    console.error(`❌ Failed to run ${skillName}:`, err.message);
    process.exit(1);
  });
}

main();
