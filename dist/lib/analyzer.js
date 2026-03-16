/**
 * Code change analyzer for smart test selection
 */
import { execSync } from 'child_process';
import { minimatch } from 'minimatch';
/**
 * Get changed files from git diff
 */
export function getChangedFiles(diffTarget = 'HEAD~1') {
    try {
        // Get diff stats
        const diffOutput = execSync(`git diff --numstat ${diffTarget}`, { encoding: 'utf-8', cwd: process.cwd() });
        const files = [];
        const lines = diffOutput.trim().split('\n');
        for (const line of lines) {
            const match = line.match(/^(\d+)\s+(\d+)\s+(.+)$/);
            if (match) {
                const [, additions, deletions, path] = match;
                // Get file status
                let status = 'modified';
                try {
                    const statusOutput = execSync(`git diff --diff-filter=ADRM --name-status ${diffTarget} -- "${path}"`, { encoding: 'utf-8' });
                    const statusChar = statusOutput.trim().charAt(0);
                    switch (statusChar) {
                        case 'A':
                            status = 'added';
                            break;
                        case 'D':
                            status = 'deleted';
                            break;
                        case 'R':
                            status = 'renamed';
                            break;
                        default: status = 'modified';
                    }
                }
                catch {
                    // Default to modified if status check fails
                }
                files.push({
                    path,
                    status,
                    additions: parseInt(additions, 10),
                    deletions: parseInt(deletions, 10)
                });
            }
        }
        return files;
    }
    catch (error) {
        throw new Error(`Failed to get changed files: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Map a changed file to test types based on patterns
 */
function mapFileToTests(filePath, mapping) {
    const types = [];
    for (const [pattern, testType] of Object.entries(mapping)) {
        if (minimatch(filePath, pattern)) {
            if (Array.isArray(testType)) {
                types.push(...testType);
            }
            else {
                types.push(testType);
            }
        }
    }
    // Default mappings for common patterns
    if (types.length === 0) {
        if (filePath.endsWith('.test.ts') || filePath.endsWith('.spec.ts')) {
            types.push('specific');
        }
        else if (filePath.includes('test/') || filePath.includes('__tests__/')) {
            types.push('unit');
        }
        else if (filePath.includes('e2e/') || filePath.includes('integration/')) {
            types.push('e2e');
        }
        else if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
            types.push('unit');
        }
    }
    return [...new Set(types)]; // Remove duplicates
}
/**
 * Find test files related to a source file
 */
function findRelatedTests(filePath, config) {
    const tests = [];
    const basename = filePath.replace(/\.(ts|tsx|js|jsx)$/, '');
    const filename = basename.split('/').pop() || '';
    // Check for co-located test files
    for (const pattern of config.testPatterns.unit) {
        const testPattern = pattern.replace('**/*', basename);
        if (testPattern !== pattern) {
            try {
                const glob = require('glob');
                const matches = glob.sync(testPattern);
                tests.push(...matches);
            }
            catch {
                // Glob not available, use simple matching
                const possibleTest = `${basename}.test.ts`;
                const { existsSync } = require('fs');
                if (existsSync(possibleTest)) {
                    tests.push(possibleTest);
                }
            }
        }
    }
    // Look for tests with matching name
    for (const _pattern of config.testPatterns.unit) {
        try {
            const { execSync } = require('child_process');
            const result = execSync(`find . -name "*${filename}*.test.ts" -o -name "*${filename}*.spec.ts" | head -10`, { encoding: 'utf-8' });
            const found = result.trim().split('\n').filter(Boolean);
            tests.push(...found);
        }
        catch {
            // Ignore find errors
        }
    }
    return [...new Set(tests)];
}
/**
 * Analyze changed files and determine which tests to run
 */
export function analyzeChanges(changedFiles, config) {
    const testSelections = new Map();
    let totalChanges = 0;
    for (const file of changedFiles) {
        totalChanges += file.additions + file.deletions;
        // Skip non-code files
        if (!/\.(ts|tsx|js|jsx|json)$/.test(file.path)) {
            continue;
        }
        const testTypes = mapFileToTests(file.path, config.fileToTestMapping);
        for (const type of testTypes) {
            if (!testSelections.has(type)) {
                testSelections.set(type, new Set());
            }
            if (type === 'specific') {
                // For test files themselves, run just that file
                testSelections.get(type).add(file.path);
            }
            else {
                // Find related test files
                const relatedTests = findRelatedTests(file.path, config);
                for (const test of relatedTests) {
                    testSelections.get(type).add(test);
                }
            }
        }
    }
    // Convert to array format
    const selections = [];
    for (const [type, files] of testSelections) {
        if (files.size > 0) {
            selections.push({
                type,
                files: Array.from(files),
                reason: `${files.size} test file(s) related to changed code`
            });
        }
    }
    // Estimate coverage (rough heuristic)
    const estimatedCoverage = Math.min(100, Math.max(30, 70 + (selections.length * 10)));
    return {
        changedFiles,
        testSelections: selections,
        coverage: {
            estimated: estimatedCoverage,
            filesAffected: changedFiles.length
        }
    };
}
/**
 * Generate test command based on selections
 */
export function generateTestCommand(selections, config, mode) {
    if (mode === 'full') {
        return config.testCommand;
    }
    if (mode === 'smoke') {
        // Run only smoke tests
        return `${config.testCommand} --grep "smoke|critical"`;
    }
    // Targeted mode - run specific test files
    const allTestFiles = selections.flatMap(s => s.files);
    if (allTestFiles.length === 0) {
        return config.testCommand;
    }
    // Join test files and pass to test command
    const testFilesArg = allTestFiles.join(' ');
    return `${config.testCommand} ${testFilesArg}`;
}
/**
 * Format analysis result for display
 */
export function formatAnalysis(result) {
    const lines = [
        'Change Analysis',
        '===============',
        '',
        `Files Changed: ${result.changedFiles.length}`,
        ''
    ];
    if (result.changedFiles.length > 0) {
        lines.push('Changed Files:');
        for (const file of result.changedFiles.slice(0, 10)) {
            const indicator = file.status === 'added' ? '+' : file.status === 'deleted' ? '-' : '~';
            lines.push(`  ${indicator} ${file.path} (+${file.additions}/-${file.deletions})`);
        }
        if (result.changedFiles.length > 10) {
            lines.push(`  ... and ${result.changedFiles.length - 10} more`);
        }
        lines.push('');
    }
    if (result.testSelections.length > 0) {
        lines.push('Tests Selected:');
        for (const selection of result.testSelections) {
            lines.push(`  ${selection.type}: ${selection.files.length} file(s)`);
            lines.push(`    Reason: ${selection.reason}`);
        }
        lines.push('');
    }
    lines.push(`Estimated Coverage: ${result.coverage.estimated}%`);
    lines.push(`Files Affected: ${result.coverage.filesAffected}`);
    return lines.join('\n');
}
//# sourceMappingURL=analyzer.js.map