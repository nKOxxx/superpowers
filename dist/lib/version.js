/**
 * Version bump utilities
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
/**
 * Parse a semantic version string
 */
export function parseVersion(version) {
    // Remove 'v' prefix if present
    const cleanVersion = version.replace(/^v/, '');
    // Match semver pattern
    const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
    if (!match) {
        throw new Error(`Invalid version format: ${version}`);
    }
    return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
        prerelease: match[4]
    };
}
/**
 * Bump version based on type
 */
export function bumpVersion(currentVersion, bump) {
    // If bump is a specific version, use it directly
    if (/^\d+\.\d+\.\d+/.test(bump)) {
        return bump.replace(/^v/, '');
    }
    const parsed = parseVersion(currentVersion);
    switch (bump) {
        case 'major':
            return `${parsed.major + 1}.0.0`;
        case 'minor':
            return `${parsed.major}.${parsed.minor + 1}.0`;
        case 'patch':
        default:
            return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    }
}
/**
 * Read version from package.json
 */
export function readPackageVersion(cwd = process.cwd()) {
    const packagePath = resolve(cwd, 'package.json');
    if (!existsSync(packagePath)) {
        throw new Error(`package.json not found at ${packagePath}`);
    }
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    if (!pkg.version) {
        throw new Error('No version field in package.json');
    }
    return pkg.version;
}
/**
 * Update version in package.json
 */
export function updatePackageVersion(newVersion, cwd = process.cwd()) {
    const packagePath = resolve(cwd, 'package.json');
    if (!existsSync(packagePath)) {
        throw new Error(`package.json not found at ${packagePath}`);
    }
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    pkg.version = newVersion;
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}
/**
 * Update version in other files if they exist
 */
export function updateVersionInFiles(newVersion, files, cwd = process.cwd()) {
    const updated = [];
    for (const file of files) {
        const filePath = resolve(cwd, file);
        if (!existsSync(filePath)) {
            continue;
        }
        let content = readFileSync(filePath, 'utf-8');
        const originalContent = content;
        // Try to update version in various formats
        // package.json style
        content = content.replace(/"version"\s*:\s*"[^"]+"/, `"version": "${newVersion}"`);
        // VERSION file
        if (/^\d+\.\d+\.\d+/.test(content.trim())) {
            content = newVersion + '\n';
        }
        // Cargo.toml style
        content = content.replace(/^version\s*=\s*"[^"]+"/m, `version = "${newVersion}"`);
        // setup.py style
        content = content.replace(/version\s*=\s*['"][^'"]+['"]/, `version='${newVersion}'`);
        if (content !== originalContent) {
            writeFileSync(filePath, content, 'utf-8');
            updated.push(file);
        }
    }
    return updated;
}
/**
 * Bump version and update all relevant files
 */
export function bump(bump, options = {}) {
    const { cwd = process.cwd(), additionalFiles = [] } = options;
    const oldVersion = readPackageVersion(cwd);
    const newVersion = bumpVersion(oldVersion, bump);
    // Update package.json
    updatePackageVersion(newVersion, cwd);
    const filesUpdated = ['package.json'];
    // Update additional files
    const otherFiles = updateVersionInFiles(newVersion, additionalFiles, cwd);
    filesUpdated.push(...otherFiles);
    return {
        oldVersion,
        newVersion,
        filesUpdated
    };
}
/**
 * Validate that a version bump is valid
 */
export function validateBump(currentVersion, newVersion) {
    try {
        const current = parseVersion(currentVersion);
        const next = parseVersion(newVersion);
        // Check if new version is greater than current
        if (next.major < current.major) {
            return { valid: false, reason: 'Major version cannot decrease' };
        }
        if (next.major === current.major && next.minor < current.minor) {
            return { valid: false, reason: 'Minor version cannot decrease' };
        }
        if (next.major === current.major && next.minor === current.minor && next.patch < current.patch) {
            return { valid: false, reason: 'Patch version cannot decrease' };
        }
        if (next.major === current.major && next.minor === current.minor && next.patch === current.patch) {
            return { valid: false, reason: 'Version must be different from current' };
        }
        return { valid: true };
    }
    catch (error) {
        return {
            valid: false,
            reason: error instanceof Error ? error.message : 'Invalid version format'
        };
    }
}
//# sourceMappingURL=version.js.map