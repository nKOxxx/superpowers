import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { FrameworkConfig } from './types';

export class FrameworkDetector {
  async detect(): Promise<FrameworkConfig | null> {
    // Check for config files
    const configs = [
      { name: 'jest', files: ['jest.config.js', 'jest.config.ts', 'jest.config.json', 'jest.config.mjs'] },
      { name: 'vitest', files: ['vitest.config.js', 'vitest.config.ts', 'vitest.config.mjs'] },
      { name: 'mocha', files: ['.mocharc.js', '.mocharc.json', '.mocharc.yaml', 'mocha.opts'] },
      { name: 'pytest', files: ['pytest.ini', 'pyproject.toml', 'setup.cfg', 'tox.ini'] }
    ];

    for (const config of configs) {
      for (const file of config.files) {
        if (fs.existsSync(file)) {
          return this.getFrameworkConfig(config.name);
        }
      }
    }

    // Check package.json
    if (fs.existsSync('package.json')) {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.vitest) return this.getFrameworkConfig('vitest');
      if (deps.jest) return this.getFrameworkConfig('jest');
      if (deps.mocha) return this.getFrameworkConfig('mocha');
    }

    // Check for Python
    if (fs.existsSync('requirements.txt') || fs.existsSync('Pipfile')) {
      return this.getFrameworkConfig('pytest');
    }

    // Default to jest if tests exist
    const jestTests = this.findFiles(['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}']);
    if (jestTests.length > 0) {
      return this.getFrameworkConfig('jest');
    }

    return null;
  }

  private getFrameworkConfig(name: string): FrameworkConfig | null {
    const configs: Record<string, FrameworkConfig> = {
      jest: {
        name: 'jest',
        command: 'npx',
        args: ['jest'],
        detectFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.json'],
        detectPatterns: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}']
      },
      vitest: {
        name: 'vitest',
        command: 'npx',
        args: ['vitest', 'run'],
        detectFiles: ['vitest.config.js', 'vitest.config.ts', 'vitest.config.mjs'],
        detectPatterns: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}']
      },
      mocha: {
        name: 'mocha',
        command: 'npx',
        args: ['mocha'],
        detectFiles: ['.mocharc.js', '.mocharc.json', 'mocha.opts'],
        detectPatterns: ['**/test/**/*.js', '**/*.test.js']
      },
      pytest: {
        name: 'pytest',
        command: 'python',
        args: ['-m', 'pytest'],
        detectFiles: ['pytest.ini', 'pyproject.toml', 'setup.cfg'],
        detectPatterns: ['**/test_*.py', '**/*_test.py', '**/tests/**/*.py']
      }
    };

    return configs[name] || null;
  }

  private findFiles(patterns: string[]): string[] {
    const found: string[] = [];
    for (const pattern of patterns) {
      try {
        const { globSync } = require('glob');
        const matches = globSync(pattern, { ignore: ['**/node_modules/**'] });
        found.push(...matches);
      } catch {
        // Ignore errors
      }
    }
    return found;
  }
}
