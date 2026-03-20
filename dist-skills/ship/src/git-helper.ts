import { execSync } from 'child_process';

export class GitHelper {
  isGitRepository(): boolean {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  isWorkingDirectoryClean(): boolean {
    try {
      const output = execSync('git status --porcelain', { encoding: 'utf-8' });
      return output.trim().length === 0;
    } catch {
      return false;
    }
  }

  getCurrentBranch(): string {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  }

  getLastCommitHash(): string {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim().slice(0, 7);
  }

  getCommitsSinceLastTag(): string[] {
    try {
      // Get the latest tag
      const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
      const output = execSync(`git log ${lastTag}..HEAD --pretty=format:"%H|%s|%b"`, { encoding: 'utf-8' });
      return output.split('\n').filter(line => line.length > 0);
    } catch {
      // No tags yet, get all commits
      const output = execSync('git log --pretty=format:"%H|%s|%b"', { encoding: 'utf-8' });
      return output.split('\n').filter(line => line.length > 0);
    }
  }

  commitChanges(message: string): void {
    execSync('git add -A', { stdio: 'ignore' });
    execSync(`git commit -m "${message}"`, { stdio: 'ignore' });
  }

  createTag(name: string): void {
    execSync(`git tag ${name}`, { stdio: 'ignore' });
  }

  push(branch: string): void {
    execSync(`git push origin ${branch}`, { stdio: 'ignore' });
  }

  pushTags(): void {
    execSync('git push --tags', { stdio: 'ignore' });
  }
}
