import { execSync } from 'child_process';
import * as path from 'path';
import { FrameworkConfig } from './types';

export class SmartTestSelector {
  async getChangedTests(framework: FrameworkConfig): Promise<string[]> {
    // Get changed files from git
    const changedFiles = this.getChangedFiles();
    
    // Map changed source files to their test files
    const testFiles: string[] = [];
    
    for (const file of changedFiles) {
      // Skip non-source files
      if (!this.isSourceFile(file)) continue;
      
      // Find corresponding test file
      const testFile = this.findTestFile(file, framework);
      if (testFile) {
        testFiles.push(testFile);
      }
    }

    // Also include directly changed test files
    for (const file of changedFiles) {
      if (this.isTestFile(file, framework)) {
        testFiles.push(file);
      }
    }

    return [...new Set(testFiles)];
  }

  private getChangedFiles(): string[] {
    try {
      // Get files changed since main/master branch
      const baseBranch = this.getBaseBranch();
      const output = execSync(`git diff --name-only ${baseBranch}...HEAD`, { encoding: 'utf-8' });
      return output.trim().split('\n').filter(f => f.length > 0);
    } catch {
      // Fallback to uncommitted changes
      try {
        const output = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
        return output.trim().split('\n').filter(f => f.length > 0);
      } catch {
        return [];
      }
    }
  }

  private getBaseBranch(): string {
    const branches = ['main', 'master', 'develop'];
    for (const branch of branches) {
      try {
        execSync(`git rev-parse --verify ${branch}`, { stdio: 'ignore' });
        return branch;
      } catch {
        continue;
      }
    }
    return 'HEAD~1';
  }

  private isSourceFile(file: string): boolean {
    const ext = path.extname(file);
    return ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rb'].includes(ext);
  }

  private isTestFile(file: string, framework: FrameworkConfig): boolean {
    const patterns = framework.detectPatterns;
    const { minimatch } = require('minimatch');
    
    for (const pattern of patterns) {
      if (minimatch(file, pattern)) {
        return true;
      }
    }
    
    // Common test file patterns
    const basename = path.basename(file);
    return (
      basename.includes('.test.') ||
      basename.includes('.spec.') ||
      basename.startsWith('test_') ||
      basename.endsWith('_test.py')
    );
  }

  private findTestFile(sourceFile: string, framework: FrameworkConfig): string | null {
    const dir = path.dirname(sourceFile);
    const basename = path.basename(sourceFile, path.extname(sourceFile));
    const ext = path.extname(sourceFile);

    // Common test file patterns
    const possibleTests = [
      path.join(dir, `${basename}.test${ext}`),
      path.join(dir, `${basename}.spec${ext}`),
      path.join(dir, '__tests__', `${basename}${ext}`),
      path.join(dir, 'tests', `${basename}${ext}`),
      path.join('tests', sourceFile),
      path.join('test', sourceFile)
    ];

    // For Python
    if (ext === '.py') {
      possibleTests.push(
        path.join(dir, `test_${basename}.py`),
        path.join('tests', `test_${basename}.py`)
      );
    }

    const fs = require('fs');
    for (const testPath of possibleTests) {
      if (fs.existsSync(testPath)) {
        return testPath;
      }
    }

    return null;
  }
}
