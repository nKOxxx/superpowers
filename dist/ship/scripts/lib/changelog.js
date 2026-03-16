/**
 * Changelog generator for ship skill
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
export async function generateChangelog(version, options = {}) {
    const preset = options.preset || 'conventional';
    const commits = getCommitsSinceLastTag();
    const sections = categorizeCommits(commits, preset);
    const changelog = formatChangelog(version, sections, options);
    if (!options.dryRun) {
        updateChangelogFile(changelog);
    }
    return changelog;
}
function getCommitsSinceLastTag() {
    try {
        const logOutput = execSync('git log $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~20)..HEAD --format="%H|%s|%b---END---"', { encoding: 'utf-8' });
        return logOutput
            .split('---END---')
            .map(block => block.trim())
            .filter(block => block.length > 0)
            .map(block => {
            const [hash, subject, ...bodyParts] = block.split('|');
            const body = bodyParts.join('|').trim();
            const parsed = parseCommitMessage(subject || '');
            return {
                hash: (hash || '').slice(0, 7),
                subject: subject || '',
                body: body || undefined,
                ...parsed
            };
        });
    }
    catch {
        return [];
    }
}
function parseCommitMessage(subject) {
    // Parse conventional commit format: type(scope): subject
    const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
    if (match) {
        const [, type, scope, breaking, message] = match;
        return {
            type: type || undefined,
            scope: scope || undefined,
            breaking: !!breaking || (message ? message.includes('BREAKING CHANGE') : false)
        };
    }
    return {};
}
function categorizeCommits(commits, preset) {
    const sections = {
        features: [],
        fixes: [],
        docs: [],
        style: [],
        refactor: [],
        perf: [],
        test: [],
        chore: [],
        breaking: []
    };
    for (const commit of commits) {
        // Check for breaking changes first
        if (commit.breaking) {
            sections.breaking.push(commit);
        }
        switch (commit.type) {
            case 'feat':
            case 'feature':
                sections.features.push(commit);
                break;
            case 'fix':
                sections.fixes.push(commit);
                break;
            case 'docs':
                sections.docs.push(commit);
                break;
            case 'style':
                sections.style.push(commit);
                break;
            case 'refactor':
                sections.refactor.push(commit);
                break;
            case 'perf':
            case 'performance':
                sections.perf.push(commit);
                break;
            case 'test':
            case 'tests':
                sections.test.push(commit);
                break;
            case 'chore':
            case 'build':
            case 'ci':
                sections.chore.push(commit);
                break;
            default:
                // Unknown type - skip or add to misc
                break;
        }
    }
    return sections;
}
function formatChangelog(version, sections, options) {
    const date = new Date().toISOString().split('T')[0];
    let output = `## [${version}] - ${date}\n\n`;
    if (sections.breaking.length > 0) {
        output += '### ⚠ BREAKING CHANGES\n\n';
        for (const commit of sections.breaking) {
            output += `- ${commit.subject}\n`;
        }
        output += '\n';
    }
    if (sections.features.length > 0) {
        output += '### Features\n\n';
        for (const commit of sections.features) {
            output += `- ${commit.subject} (${commit.hash})\n`;
        }
        output += '\n';
    }
    if (sections.fixes.length > 0) {
        output += '### Bug Fixes\n\n';
        for (const commit of sections.fixes) {
            output += `- ${commit.subject} (${commit.hash})\n`;
        }
        output += '\n';
    }
    if (sections.perf.length > 0) {
        output += '### Performance Improvements\n\n';
        for (const commit of sections.perf) {
            output += `- ${commit.subject} (${commit.hash})\n`;
        }
        output += '\n';
    }
    if (sections.docs.length > 0) {
        output += '### Documentation\n\n';
        for (const commit of sections.docs) {
            output += `- ${commit.subject} (${commit.hash})\n`;
        }
        output += '\n';
    }
    return output;
}
function updateChangelogFile(newEntry) {
    const changelogPath = 'CHANGELOG.md';
    const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    let existingContent = '';
    if (fs.existsSync(changelogPath)) {
        existingContent = fs.readFileSync(changelogPath, 'utf-8');
        // Remove header from existing content if present
        existingContent = existingContent.replace(header, '');
    }
    fs.writeFileSync(changelogPath, header + newEntry + existingContent);
}
//# sourceMappingURL=changelog.js.map