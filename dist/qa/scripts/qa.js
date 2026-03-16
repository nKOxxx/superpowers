#!/usr/bin/env node
/**
 * /qa - Systematic Testing Skill
 * Acts as QA Lead to analyze changes and run appropriate tests
 */
import { loadConfig } from './lib/config.js';
import { analyzeChanges } from './lib/analyzer.js';
import { runTests } from './lib/test-runner.js';
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        printHelp();
        process.exit(0);
    }
    const options = parseQAArgs(args);
    const config = await loadConfig();
    console.log(`🧪 QA Mode: ${options.mode}`);
    console.log('='.repeat(40));
    const startTime = Date.now();
    try {
        const report = await runQA(options, config);
        const duration = (Date.now() - startTime) / 1000;
        printReport(report, duration);
        process.exit(report.results.failed > 0 ? 1 : 0);
    }
    catch (error) {
        console.error('❌ QA failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
function parseQAArgs(args) {
    const options = { mode: 'targeted' };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--mode' || arg === '-m') {
            options.mode = args[++i];
        }
        else if (arg === '--diff' || arg === '-d') {
            options.diff = args[++i];
        }
        else if (arg === '--coverage' || arg === '-c') {
            options.coverage = true;
        }
        else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        }
    }
    return options;
}
async function runQA(options, config) {
    let filesChanged = [];
    let testsSelected = [];
    let results = { passed: 0, failed: 0, skipped: 0, total: 0, details: [] };
    switch (options.mode) {
        case 'targeted':
            const analysis = await analyzeChanges(options.diff || 'HEAD~1');
            filesChanged = analysis.filesChanged;
            testsSelected = analysis.relatedTests;
            results = await runTests(testsSelected, { coverage: options.coverage, verbose: options.verbose });
            break;
        case 'smoke':
            testsSelected = ['smoke'];
            results = await runTests(['--grep=smoke'], { coverage: false, verbose: options.verbose });
            break;
        case 'full':
            testsSelected = ['full-suite'];
            results = await runTests([], { coverage: options.coverage, verbose: options.verbose });
            break;
    }
    return {
        mode: options.mode,
        filesChanged,
        testsSelected,
        results,
        duration: 0,
        timestamp: new Date().toISOString()
    };
}
function printReport(report, duration) {
    console.log('\n📊 QA Report');
    console.log('='.repeat(40));
    console.log(`Mode: ${report.mode}`);
    console.log(`Duration: ${duration.toFixed(1)}s`);
    console.log();
    if (report.filesChanged.length > 0) {
        console.log(`Files Changed: ${report.filesChanged.length}`);
        report.filesChanged.forEach(f => console.log(`  - ${f}`));
        console.log();
    }
    console.log(`Tests Selected: ${report.testsSelected.length}`);
    report.testsSelected.forEach(t => console.log(`  - ${t}`));
    console.log();
    console.log('Results:');
    console.log(`  ✅ Passed: ${report.results.passed}`);
    console.log(`  ❌ Failed: ${report.results.failed}`);
    console.log(`  ⏭️  Skipped: ${report.results.skipped}`);
    console.log(`  📊 Total: ${report.results.total}`);
    if (report.results.details.length > 0 && report.results.failed > 0) {
        console.log('\nFailed Tests:');
        report.results.details
            .filter(d => d.status === 'failed')
            .forEach(d => console.log(`  ❌ ${d.name}: ${d.error || 'Unknown error'}`));
    }
    const status = report.results.failed === 0 ? '✅ PASSED' : '❌ FAILED';
    console.log(`\nStatus: ${status}`);
}
function printHelp() {
    console.log(`
/qa - Systematic Testing

Usage:
  qa [options]

Options:
  --mode, -m       Test mode: targeted (default), smoke, full
  --diff, -d       Git diff reference for targeted mode (default: HEAD~1)
  --coverage, -c   Generate coverage report
  --verbose, -v    Verbose output
  --help           Show this help

Examples:
  qa                           # Run targeted tests on recent changes
  qa --mode=smoke              # Quick smoke tests
  qa --mode=full               # Full regression suite
  qa --diff=HEAD~5             # Test changes from last 5 commits
`);
}
main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
//# sourceMappingURL=qa.js.map