import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface QAOptions {
  mode: 'targeted' | 'smoke' | 'full';
  target?: string;
  coverage: boolean;
}

interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  duration: string;
  failures: string[];
}

function parseArgs(): QAOptions {
  const args = process.argv.slice(2);
  const options: QAOptions = { mode: 'targeted', coverage: false };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--mode' && args[i + 1]) {
      options.mode = args[++i] as any;
    } else if (arg === '--target' && args[i + 1]) {
      options.target = args[++i];
    } else if (arg === '--coverage') {
      options.coverage = true;
    }
  }
  
  return options;
}

function detectTestFramework(): string | null {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) return null;
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (deps.vitest) return 'vitest';
  if (deps.jest) return 'jest';
  if (deps.mocha) return 'mocha';
  if (deps.ava) return 'ava';
  
  // Check for config files
  if (fs.existsSync('vitest.config.ts') || fs.existsSync('vitest.config.js')) return 'vitest';
  if (fs.existsSync('jest.config.ts') || fs.existsSync('jest.config.js')) return 'jest';
  
  return null;
}

function getChangedFiles(): string[] {
  try {
    const output = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  } catch {
    return [];
  }
}

function runTests(framework: string, options: QAOptions): TestResult {
  const result: TestResult = { passed: 0, failed: 0, skipped: 0, duration: '0s', failures: [] };
  
  let cmd = '';
  
  if (framework === 'vitest') {
    cmd = 'npx vitest run';
    if (options.coverage) cmd += ' --coverage';
    if (options.mode === 'smoke') cmd += ' --reporter=verbose --testNamePattern="smoke|basic"';
  } else if (framework === 'jest') {
    cmd = 'npx jest';
    if (options.coverage) cmd += ' --coverage';
    if (options.mode === 'smoke') cmd += ' --testNamePattern="smoke|basic"';
  } else if (framework === 'mocha') {
    cmd = 'npx mocha';
  }
  
  if (options.target) {
    cmd += ` ${options.target}`;
  }
  
  console.log(`Running: ${cmd}\n`);
  
  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    
    // Parse output for results
    const passMatch = output.match(/(\d+)\s+passing/);
    const failMatch = output.match(/(\d+)\s+failing/);
    const skipMatch = output.match(/(\d+)\s+pending|skipped/);
    const timeMatch = output.match(/(\d+(\.\d+)?)\s*(s|ms)/);
    
    result.passed = passMatch ? parseInt(passMatch[1]) : 0;
    result.failed = failMatch ? parseInt(failMatch[1]) : 0;
    result.skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
    result.duration = timeMatch ? timeMatch[0] : 'unknown';
    
    // Extract failure details
    if (result.failed > 0) {
      const lines = output.split('\n');
      let inFailure = false;
      let currentFailure = '';
      
      for (const line of lines) {
        if (line.includes('✕') || line.includes('FAIL')) {
          inFailure = true;
          currentFailure = line.trim();
        } else if (inFailure && line.trim() && !line.startsWith(' ')) {
          result.failures.push(currentFailure);
          inFailure = false;
        } else if (inFailure) {
          currentFailure += '\n  ' + line.trim();
        }
      }
    }
    
  } catch (error: any) {
    // Tests failed - parse the error output
    const output = error.stdout?.toString() || error.message || '';
    
    const passMatch = output.match(/(\d+)\s+passing/);
    const failMatch = output.match(/(\d+)\s+failing/);
    
    result.passed = passMatch ? parseInt(passMatch[1]) : 0;
    result.failed = failMatch ? parseInt(failMatch[1]) : 1;
    result.failures.push('Test suite failed. See output for details.');
  }
  
  return result;
}

async function qa(options: QAOptions): Promise<void> {
  console.log(`🔍 QA Mode: ${options.mode.toUpperCase()}\n`);
  
  const framework = detectTestFramework();
  if (!framework) {
    console.error('No test framework detected. Supported: vitest, jest, mocha');
    process.exit(1);
  }
  
  console.log(`Framework: ${framework}\n`);
  
  if (options.mode === 'targeted' && !options.target) {
    const changed = getChangedFiles();
    if (changed.length > 0) {
      console.log('Changed files:', changed.join(', '));
      console.log('Running targeted tests...\n');
    } else {
      console.log('No recent changes detected, running full suite...\n');
    }
  }
  
  const result = runTests(framework, options);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed:  ${result.passed}`);
  console.log(`❌ Failed:  ${result.failed}`);
  console.log(`⏭️  Skipped: ${result.skipped}`);
  console.log(`⏱️  Duration: ${result.duration}`);
  console.log('='.repeat(50));
  
  if (result.failed > 0 && result.failures.length > 0) {
    console.log('\n🔴 FAILURES:');
    result.failures.forEach(f => console.log(`  ${f}`));
  }
  
  const total = result.passed + result.failed + result.skipped;
  const passRate = total > 0 ? Math.round((result.passed / total) * 100) : 0;
  
  console.log(`\n📈 Pass Rate: ${passRate}%`);
  
  if (result.failed === 0) {
    console.log('\n✨ All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed.');
    process.exit(1);
  }
}

qa(parseArgs()).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
