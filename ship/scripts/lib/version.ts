/**
 * Version bump utilities for ship skill
 */

import * as fs from 'fs';

export type VersionType = 'patch' | 'minor' | 'major';

export interface VersionOptions {
  dryRun?: boolean;
}

export async function bumpVersion(
  versionInput: string,
  options: VersionOptions = {}
): Promise<string> {
  const currentVersion = getCurrentVersion();
  let newVersion: string;
  
  if (isSemver(versionInput)) {
    // Explicit version number
    newVersion = versionInput.replace(/^v/, '');
  } else {
    // Version bump type
    newVersion = incrementVersion(currentVersion, versionInput as VersionType);
  }
  
  if (!options.dryRun) {
    updateVersionInFiles(currentVersion, newVersion);
  }
  
  return newVersion;
}

function getCurrentVersion(): string {
  // Try package.json first
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    if (pkg.version) return pkg.version;
  }
  
  // Try git tags
  try {
    const { execSync } = require('child_process');
    const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
    return latestTag.replace(/^v/, '');
  } catch {
    return '0.0.0';
  }
}

function isSemver(version: string): boolean {
  return /^v?\d+\.\d+\.\d+/.test(version);
}

function incrementVersion(current: string, type: VersionType): string {
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

function updateVersionInFiles(oldVersion: string, newVersion: string): void {
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
    if (lock.version) lock.version = newVersion;
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
