#!/usr/bin/env node
import { qaCommand } from './index.js';

const args = process.argv.slice(2);
const options = {
  mode: 'targeted',
  files: []
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--mode':
    case '-m':
      options.mode = args[++i];
      break;
    case '--framework':
    case '-f':
      options.framework = args[++i];
      break;
    case '--coverage':
    case '-c':
      options.coverage = true;
      break;
    case '--watch':
    case '-w':
      options.watch = true;
      break;
    case '--changed':
      options.changed = true;
      break;
    case '--fail-fast':
      options.failFast = true;
      break;
    default:
      if (!arg.startsWith('-')) {
        options.files = options.files || [];
        options.files.push(arg);
      }
  }
}

qaCommand(options)
  .then(result => {
    console.log(result.output);
    if (result.summary) {
      console.log('\n📊 Summary:');
      console.log(`  Framework: ${result.framework}`);
      console.log(`  Mode: ${result.mode}`);
      console.log(`  Passed: ${result.summary.passed}`);
      console.log(`  Failed: ${result.summary.failed}`);
      console.log(`  Skipped: ${result.summary.skipped}`);
      console.log(`  Duration: ${result.summary.duration}ms`);
    }
    process.exit(result.exitCode);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
