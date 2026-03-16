/**
 * Version bump utilities for ship skill
 */
import * as fs from 'fs';
export async function bumpVersion(versionInput, options = {}) {
    const currentVersion = getCurrentVersion();
    let newVersion;
    if (isSemver(versionInput)) {
        // Explicit version number
        newVersion = versionInput.replace(/^v/, '');
    }
    else {
        // Version bump type
        newVersion = incrementVersion(currentVersion, versionInput);
    }
    if (!options.dryRun) {
        updateVersionInFiles(currentVersion, newVersion);
    }
    return newVersion;
}
function getCurrentVersion() {
    // Try package.json first
    if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        if (pkg.version)
            return pkg.version;
    }
    // Try git tags
    try {
        const { execSync } = require('child_process');
        const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
        return latestTag.replace(/^v/, '');
    }
    catch {
        return '0.0.0';
    }
}
function isSemver(version) {
    return /^v?\d+\.\d+\.\d+/.test(version);
}
function incrementVersion(current, type) {
    const parts = current.split('.').map(Number);
    const [major = 0, minor = 0, patch = 0] = parts;
    switch (type) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
        default:
            return `${major}.${minor}.${patch + 1}`;
    }
}
function updateVersionInFiles(oldVersion, newVersion) {
    // Update package.json
    if (fs.existsSync('package.json')) {
        const pkgPath = 'package.json';
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        pkg.version = newVersion;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    }
    // Update package-lock.json if exists
    if (fs.existsSync('package-lock.json')) {
        const lockPath = 'package-lock.json';
        const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
        if (lock.version)
            lock.version = newVersion;
        if (lock.packages?.['']) {
            lock.packages[''].version = newVersion;
        }
        fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
    }
    // Update version files if they exist
    const versionFiles = ['VERSION', 'version.txt', 'VERSION.txt'];
    for (const file of versionFiles) {
        if (fs.existsSync(file)) {
            fs.writeFileSync(file, newVersion + '\n');
        }
    }
}
//# sourceMappingURL=version.js.map