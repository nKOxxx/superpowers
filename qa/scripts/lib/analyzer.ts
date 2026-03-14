/**
 * Code change analyzer for QA skill
 * Maps file changes to relevant tests
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

export interface ChangeAnalysis {
  filesChanged: string[];
  relatedTests: string[];
  testCoverage: Map<string, string[]>;
}

// File pattern to test pattern mapping
const TEST_PATTERNS: Array<{ pattern: RegExp; testPatterns: string[] }> = [
  {
    pattern: /src\/(.*)\.ts$/,
    testPatterns: ['**/*.test.ts', '**/*.spec.ts']
  },
  {
    pattern: /src\/(.*)\.tsx$/,
    testPatterns: ['**/*.test.tsx', '**/*.spec.tsx', '**/*.test.ts']
  },
  {
    pattern: /src\/components\/(.*)\.tsx$/,
    testPatterns: ['**/components/**/*.test.tsx', '**/*.integration.test.tsx']
  },
  {
    pattern: /src\/api\/(.*)\.ts$/,
    testPatterns: ['**/api/**/*.test.ts', '**/*.integration.test.ts']
  },
  {
    pattern: /src\/utils\/(.*)\.ts$/,
    testPatterns: ['**/utils/**/*.test.ts']
  },
  {
    pattern: /.*\.test\.ts$/,
    testPatterns: ['$0'] // Run the test file itself
  }
];

export async function analyzeChanges(diffRef: string = 'HEAD~1'): Promise<ChangeAnalysis> {
  // Get changed files
  const diffOutput = execSync(`git diff --name-only ${diffRef}`, { encoding: 'utf-8' });
  const filesChanged = diffOutput
    .split('\n')
    .map(f => f.trim())
    .filter(f => f.length > 0);
  
  console.log(`  Analyzing ${filesChanged.length} changed files...`);
  
  // Map to tests
  const relatedTests: string[] = [];
  const testCoverage = new Map<string, string[]>();
  
  for (const file of filesChanged) {
    const tests = findRelatedTests(file);
    testCoverage.set(file, tests);
    relatedTests.push(...tests);
  }
  
  // Deduplicate
  const uniqueTests = [...new Set(relatedTests)];
  
  return {
    filesChanged,
    relatedTests: uniqueTests,
    testCoverage
  };
}

function findRelatedTests(filePath: string): string[] {
  // If it's already a test file, return it
  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return [filePath];
  }
  
  const tests: string[] = [];
  
  for (const { pattern, testPatterns } of TEST_PATTERNS) {
    const match = filePath.match(pattern);
    if (match) {
      for (const testPattern of testPatterns) {
        // Replace $0 with the original file path
        const resolvedPattern = testPattern === '$0' ? filePath : testPattern;
        
        // Try to find matching test files
        const matchingFiles = glob.sync(resolvedPattern, { cwd: process.cwd() });
        
        // Filter to likely related tests based on file name
        const fileName = path.basename(filePath, path.extname(filePath));
        const relatedMatchingFiles = matchingFiles.filter((f: string) => 
          f.includes(fileName) || 
          f.includes(path.dirname(filePath).replace('src/', ''))
        );
        
        tests.push(...relatedMatchingFiles);
      }
    }
  }
  
  // If no specific tests found, suggest running tests in the same directory
  if (tests.length === 0) {
    const dir = path.dirname(filePath);
    const testFiles = glob.sync(`${dir}/**/*.test.ts`, { cwd: process.cwd() });
    tests.push(...testFiles);
  }
  
  return [...new Set(tests)];
}
