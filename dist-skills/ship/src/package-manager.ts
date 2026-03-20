import * as fs from 'fs';
import * as path from 'path';

export class PackageManager {
  private packagePath: string;

  constructor() {
    this.packagePath = path.join(process.cwd(), 'package.json');
  }

  hasPackageJson(): boolean {
    return fs.existsSync(this.packagePath);
  }

  getPackageJson(): any {
    return JSON.parse(fs.readFileSync(this.packagePath, 'utf-8'));
  }

  getCurrentVersion(): string {
    const pkg = this.getPackageJson();
    return pkg.version || '0.0.0';
  }

  getPackageName(): string {
    const pkg = this.getPackageJson();
    return pkg.name || 'unknown';
  }

  isPublicPackage(): boolean {
    const pkg = this.getPackageJson();
    return pkg.private !== true;
  }

  updateVersion(version: string): void {
    const pkg = this.getPackageJson();
    pkg.version = version;
    fs.writeFileSync(this.packagePath, JSON.stringify(pkg, null, 2) + '\n');
  }
}
