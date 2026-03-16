#!/usr/bin/env node
import { browseCommand } from './dist/index.js';

const args = process.argv.slice(2);

if (args.length === 0 || args[0].startsWith('-')) {
  console.error('Usage: browse <url> [options]');
  console.error('');
  console.error('Options:');
  console.error('  -v, --viewport <preset>  Viewport preset (desktop, mobile, tablet) or WxH (default: desktop)');
  console.error('  -s, --screenshot <path>  Save screenshot to path');
  console.error('  -f, --full-page          Capture full page screenshot');
  console.error('  -w, --wait-for <sel>     CSS selector or time (ms) to wait');
  console.error('  -a, --actions <file>     JSON file with action flow');
  console.error('  --headless/--no-headless Run in headless mode (default: true)');
  console.error('  -b, --browser <type>     Browser: chromium, firefox, webkit (default: chromium)');
  console.error('  -o, --output <format>    Output: json, html, text (default: json)');
  process.exit(1);
}

const url = args[0];
const options = {};

for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--viewport':
    case '-v':
      options.viewport = args[++i];
      break;
    case '--screenshot':
    case '-s':
      options.screenshot = args[++i];
      break;
    case '--full-page':
    case '-f':
      options.fullPage = true;
      break;
    case '--wait-for':
    case '-w':
      options.waitFor = args[++i];
      break;
    case '--actions':
    case '-a':
      options.actions = args[++i];
      break;
    case '--headless':
      options.headless = true;
      break;
    case '--no-headless':
      options.headless = false;
      break;
    case '--browser':
    case '-b':
      options.browser = args[++i];
      break;
    case '--output':
    case '-o':
      options.output = args[++i];
      break;
  }
}

browseCommand(url, options)
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
