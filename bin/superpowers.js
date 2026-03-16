#!/usr/bin/env node

/**
 * Superpowers CLI - Main entry point
 * Dispatches commands to individual skill modules
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SKILL_MAP = {
  'browse': '@superpowers/browse',
  'screenshot': '@superpowers/browse',
  'qa': '@superpowers/qa',
  'test': '@superpowers/qa',
  'ship': '@superpowers/ship',
  'release': '@superpowers/ship',
  'ceo-review': '@superpowers/plan-ceo-review',
  'review': '@superpowers/plan-ceo-review'
};

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  console.log('1.0.0');
  process.exit(0);
}

const skillPackage = SKILL_MAP[command];

if (!skillPackage) {
  console.error(`Unknown command: ${command}`);
  console.error('Run "superpowers --help" for usage information');
  process.exit(1);
}

// Find the skill's dist/cli.js
const skillPaths = [
  join(__dirname, '..', skillPackage.replace('@superpowers/', ''), 'dist', 'cli.js'),
  join(process.cwd(), 'node_modules', skillPackage, 'dist', 'cli.js'),
];

let skillPath = null;
for (const path of skillPaths) {
  if (existsSync(path)) {
    skillPath = path;
    break;
  }
}

if (!skillPath) {
  console.error(`Skill not found: ${skillPackage}`);
  process.exit(1);
}

// Run the skill with remaining arguments
const skillArgs = args.slice(1);
const child = spawn('node', [skillPath, ...skillArgs], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    SUPERPOWERS CLI v1.0.0                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  USAGE: superpowers <command> [options]                      ║
║                                                              ║
║  COMMANDS:                                                   ║
║                                                              ║
║  browse <url>        Browser automation & screenshots        ║
║    --viewport=mobile|tablet|desktop|wide                     ║
║    --full-page       Capture full page                       ║
║    --actions="click:.btn,wait:500"                           ║
║                                                              ║
║  qa                  Run tests (targeted/smoke/full)         ║
║    --mode=targeted|smoke|full                                ║
║    --coverage        Enable coverage                         ║
║                                                              ║
║  ship <version>      Release pipeline                        ║
║    patch|minor|major|x.y.z                                   ║
║    --dry-run         Preview without executing               ║
║                                                              ║
║  ceo-review <feature>  Product strategy (BAT framework)      ║
║    --audience=<text> --competition=<text>                    ║
║                                                              ║
║  EXAMPLES:                                                   ║
║                                                              ║
║  superpowers browse https://example.com --viewport=mobile    ║
║  superpowers qa --mode=smoke                                 ║
║  superpowers ship patch                                      ║
║  superpowers ceo-review "Dark mode" --audience="Developers"  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}
