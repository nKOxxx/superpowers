import * as fs from 'fs';
import { Commit, ChangelogEntry } from './types';

export class ChangelogGenerator {
  private typeSections: Record<string, string> = {
    feat: '### Features',
    fix: '### Bug Fixes',
    docs: '### Documentation',
    style: '### Styles',
    refactor: '### Code Refactoring',
    perf: '### Performance Improvements',
    test: '### Tests',
    chore: '### Chores',
    build: '### Build',
    ci: '### CI/CD',
    revert: '### Reverts'
  };

  parseCommits(commitLines: string[]): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];

    for (const line of commitLines) {
      const [hash, subject, body] = line.split('|');
      if (!hash || !subject) continue;

      const parsed = this.parseConventionalCommit(subject);
      
      entries.push({
        type: parsed.type,
        scope: parsed.scope,
        message: parsed.message,
        hash: hash.slice(0, 7),
        breaking: parsed.breaking || body?.includes('BREAKING CHANGE:') || false
      });
    }

    return entries;
  }

  private parseConventionalCommit(subject: string): { type: string; scope?: string; message: string; breaking: boolean } {
    // Pattern: type(scope)!: message or type!: message or type(scope): message or type: message
    const pattern = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
    const match = subject.match(pattern);

    if (match) {
      return {
        type: match[1],
        scope: match[2],
        breaking: match[3] === '!',
        message: match[4]
      };
    }

    // Non-conventional commit
    return {
      type: 'chore',
      message: subject,
      breaking: false
    };
  }

  updateChangelogFile(version: string, entries: ChangelogEntry[]): void {
    const changelogPath = 'CHANGELOG.md';
    const date = new Date().toISOString().split('T')[0];
    
    const newEntry = this.formatChangelogEntry(version, date, entries);

    let existingContent = '';
    if (fs.existsSync(changelogPath)) {
      existingContent = fs.readFileSync(changelogPath, 'utf-8');
      // Remove old header if present
      existingContent = existingContent.replace(/^# Changelog\n+/i, '');
    }

    const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    const content = header + newEntry + existingContent;

    fs.writeFileSync(changelogPath, content);
  }

  private formatChangelogEntry(version: string, date: string, entries: ChangelogEntry[]): string {
    let result = `## [${version}] - ${date}\n\n`;

    // Group by type
    const grouped = this.groupByType(entries);

    for (const [type, typeEntries] of Object.entries(grouped)) {
      if (typeEntries.length === 0) continue;
      
      const section = this.typeSections[type] || `### ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      result += `${section}\n\n`;
      
      for (const entry of typeEntries) {
        const scope = entry.scope ? `**${entry.scope}:** ` : '';
        const breaking = entry.breaking ? ' ⚠️ **BREAKING**' : '';
        result += `- ${scope}${entry.message}${breaking} (${entry.hash})\n`;
      }
      
      result += '\n';
    }

    return result;
  }

  private groupByType(entries: ChangelogEntry[]): Record<string, ChangelogEntry[]> {
    const grouped: Record<string, ChangelogEntry[]> = {};

    for (const entry of entries) {
      const type = entry.type || 'chore';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(entry);
    }

    return grouped;
  }

  getReleaseNotes(version: string): string {
    if (!fs.existsSync('CHANGELOG.md')) {
      return `Release ${version}`;
    }

    const content = fs.readFileSync('CHANGELOG.md', 'utf-8');
    const pattern = new RegExp(`## \\[${version}\\][^#]*`);
    const match = content.match(pattern);

    if (match) {
      return match[0].replace(/## \[.*\] - .*\n+/, '').trim();
    }

    return `Release ${version}`;
  }
}
