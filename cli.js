#!/usr/bin/env node
/**
 * Superpowers CLI - AI-powered workflows for development
 * 
 * Commands:
 *   superpowers browse <url>     - Browser automation with Playwright
 *   superpowers qa               - Systematic testing as QA Lead
 *   superpowers ship <version>   - One-command release pipeline
 *   superpowers ceo-review       - Product strategy with BAT framework
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const command = process.argv[2];
const args = process.argv.slice(3);

const commands = {
  'browse': 'browse/dist/index.js',
  'qa': 'qa/dist/index.js',
  'ship': 'ship/dist/index.js',
  'ceo-review': 'plan-ceo-review/dist/index.js',
  'help': null,
  '--help': null,
  '-h': null
};

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           SUPERPOWERS - AI Development Tools             ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  browse <url>       Browser automation & screenshots     ║
║  qa                 Systematic testing as QA Lead        ║
║  ship <version>     One-command release pipeline         ║
║  ceo-review         Product strategy (BAT framework)     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

Usage: superpowers <command> [options]

Run 'superpowers <command> --help' for command-specific help.
`);
}

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

const scriptPath = commands[command];

if (!scriptPath) {
  console.error(`Error: Unknown command '${command}'`);
  console.error(`Run 'superpowers help' for available commands.`);
  process.exit(1);
}

const fullPath = join(__dirname, scriptPath);

const child = spawn('node', [fullPath, ...args], {
  stdio: 'inherit',
  shell: false
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
