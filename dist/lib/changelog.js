/**
 * Changelog generator
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
const TYPE_EMOJIS = {
    feat: '✨',
    fix: '🐛',
    docs: '📚',
    style: '💎',
    refactor: '♻️',
    perf: '⚡',
    test: '✅',
    chore: '🔧'
};
const TYPE_TITLES = {
    feat: 'Features',
    fix: 'Bug Fixes',
    docs: 'Documentation',
    style: 'Styles',
    refactor: 'Code Refactoring',
    perf: 'Performance Improvements',
    test: 'Tests',
    chore: 'Chores'
};
/**
 * Parse a conventional commit message
 */
export function parseCommitMessage(message) {
    // Match conventional commit pattern: type(scope): description
    const match = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?\s*:\s*(.+)$/m);
    if (!match) {
        return null;
    }
    return {
        type: match[1],
        scope: match[2],
        description: match[4].trim(),
        breaking: match[3] === '!' || message.includes('BREAKING CHANGE:')
    };
}
/**
 * Get commits between two tags
 */
export function getCommits(fromTag, toTag = 'HEAD') {
    try {
        const range = fromTag ? `${fromTag}..${toTag}` : toTag;
        // Get commits with format: hash|subject|author|date
        const output = execSync(`git log ${range} --pretty=format:"%h|%s|%an|%ad" --date=short --no-merges`, { encoding: 'utf-8', cwd: process.cwd() });
        return output
            .trim()
            .split('\n')
            .filter(Boolean)
            .map(line => {
            const [sha, message, author, date] = line.split('|');
            return { sha, message, author, date };
        });
    }
    catch (error) {
        console.warn('Failed to get commits:', error);
        return [];
    }
}
/**
 * Generate changelog entry from commits
 */
export function generateChangelogEntry(version, commits, options = {}) {
    // includeContributors can be used for future enhancement
    const { includeContributors: _includeContributors = true } = options;
    const changes = [];
    const date = new Date().toISOString().split('T')[0];
    for (const commit of commits) {
        const parsed = parseCommitMessage(commit.message);
        if (parsed) {
            changes.push({
                type: parsed.type,
                scope: parsed.scope,
                description: parsed.description,
                sha: commit.sha
            });
        }
    }
    // Sort by type
    const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'chore', 'style'];
    changes.sort((a, b) => {
        const aIndex = typeOrder.indexOf(a.type);
        const bIndex = typeOrder.indexOf(b.type);
        return aIndex - bIndex;
    });
    return {
        version,
        date,
        changes
    };
}
/**
 * Format changelog entry as markdown
 */
export function formatChangelogEntry(entry) {
    const lines = [
        `## [${entry.version}] - ${entry.date}`,
        ''
    ];
    // Group changes by type
    const grouped = entry.changes.reduce((acc, change) => {
        if (!acc[change.type]) {
            acc[change.type] = [];
        }
        acc[change.type].push(change);
        return acc;
    }, {});
    for (const [type, changes] of Object.entries(grouped)) {
        const emoji = TYPE_EMOJIS[type] || '📝';
        const title = TYPE_TITLES[type] || type;
        lines.push(`### ${emoji} ${title}`);
        lines.push('');
        for (const change of changes) {
            const scope = change.scope ? `**${change.scope}:** ` : '';
            lines.push(`- ${scope}${change.description} (${change.sha})`);
        }
        lines.push('');
    }
    return lines.join('\n');
}
/**
 * Read existing changelog
 */
export function readChangelog(cwd = process.cwd()) {
    const changelogPath = resolve(cwd, 'CHANGELOG.md');
    if (!existsSync(changelogPath)) {
        return '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    }
    return readFileSync(changelogPath, 'utf-8');
}
/**
 * Update changelog with new entry
 */
export function updateChangelog(entry, cwd = process.cwd()) {
    const changelogPath = resolve(cwd, 'CHANGELOG.md');
    const existing = readChangelog(cwd);
    const formatted = formatChangelogEntry(entry);
    // Insert after the header
    const headerEnd = existing.indexOf('\n## [');
    let newChangelog;
    if (headerEnd === -1) {
        // No existing entries
        newChangelog = existing.trim() + '\n\n' + formatted;
    }
    else {
        // Insert before first entry
        newChangelog = existing.slice(0, headerEnd) + '\n' + formatted + existing.slice(headerEnd);
    }
    writeFileSync(changelogPath, newChangelog, 'utf-8');
}
/**
 * Generate full changelog
 */
export function generateChangelog(options = {}) {
    const { fromTag, toTag = 'HEAD' } = options;
    const commits = getCommits(fromTag, toTag);
    if (commits.length === 0) {
        return '# Changelog\n\nNo changes found.\n';
    }
    // Get version from package.json
    let version = '0.0.0';
    try {
        const pkgPath = resolve(process.cwd(), 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        version = pkg.version;
    }
    catch {
        // Ignore
    }
    const entry = generateChangelogEntry(version, commits, options);
    return formatChangelogEntry(entry);
}
/**
 * Get the last tag
 */
export function getLastTag() {
    try {
        const output = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8', cwd: process.cwd() });
        return output.trim();
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=changelog.js.map