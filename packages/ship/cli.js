#!/usr/bin/env node
import { shipCommand } from './dist/index.js';

const args = process.argv.slice(2);
const options = {
  bump: 'patch',
  dryRun: false,
  skipChangelog: false,
  skipGit: false,
  skipGithub: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--bump':
    case '-b':
      options.bump = args[++i];
      break;
    case '--dry-run':
    case '-d':
      options.dryRun = true;
      break;
    case '--skip-changelog':
      options.skipChangelog = true;
      break;
    case '--skip-git':
      options.skipGit = true;
      break;
    case '--skip-github':
      options.skipGithub = true;
      break;
    case '--message':
    case '-m':
      options.message = args[++i];
      break;
    case '--prerelease':
    case '-p':
      options.prerelease = args[++i];
      break;
  }
}

shipCommand(options)
  .then(result => {
    console.log('\n🚀 Ship Results:\n');
    console.log(`Version: ${result.version.current} → ${result.version.next}`);
    console.log(`\nSteps:`);
    for (const step of result.steps) {
      const status = step.success ? '✅' : '❌';
      console.log(`  ${status} ${step.name}`);
      if (step.output) console.log(`     ${step.output}`);
      if (step.error) console.log(`     Error: ${step.error}`);
    }
    
    if (result.success) {
      console.log(`\n✨ Successfully shipped v${result.version.next}!`);
      process.exit(0);
    } else {
      console.log(`\n❌ Ship failed: ${result.error}`);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
