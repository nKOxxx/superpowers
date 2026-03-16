import { execSync, spawn } from 'child_process';

export interface GitStatus {
  isClean: boolean;
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export function getGitStatus(): GitStatus {
  try {
    // Check if we're in a git repo
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });

    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    
    // Check for staged changes
    const staged = execSync('git diff --name-only --cached', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    // Check for unstaged changes
    const unstaged = execSync('git diff --name-only', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    
    // Check for untracked files
    const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    // Check ahead/behind
    let ahead = 0;
    let behind = 0;
    try {
      const revList = execSync(`git rev-list --left-right --count origin/${branch}...HEAD`, { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();
      const [b, a] = revList.split('\t').map(Number);
      behind = b || 0;
      ahead = a || 0;
    } catch {
      // Remote might not exist
    }

    return {
      isClean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0,
      branch,
      ahead,
      behind,
      staged,
      unstaged,
      untracked
    };
  } catch (error) {
    throw new Error('Not a git repository');
  }
}

export function getChangedFiles(since: string = 'HEAD~1'): string[] {
  try {
    const output = execSync(`git diff --name-only ${since}..HEAD`, { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

export function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --name-only --cached', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

export function getUnstagedFiles(): string[] {
  try {
    const output = execSync('git diff --name-only', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

export function getLastTag(): string | null {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

export function getCommitsSince(ref?: string): Array<{ hash: string; message: string }> {
  try {
    const sinceRef = ref || getLastTag() || 'HEAD~10';
    const output = execSync(`git log ${sinceRef}..HEAD --format="%H|%s"`, { encoding: 'utf-8' });
    
    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, ...messageParts] = line.split('|');
        return { hash, message: messageParts.join('|') };
      });
  } catch {
    return [];
  }
}

export function createCommit(message: string, files: string[] = []): void {
  if (files.length > 0) {
    execSync(`git add ${files.join(' ')}`);
  }
  execSync(`git commit -m "${message}"`);
}

export function createTag(name: string, message?: string, sign: boolean = false): void {
  const signFlag = sign ? '-s' : '';
  const messageFlag = message ? `-m "${message}"` : '';
  execSync(`git tag ${signFlag} ${messageFlag} ${name}`.trim());
}

export function pushToRemote(remote: string = 'origin', branch?: string, tags: boolean = false): void {
  const branchArg = branch || '';
  const tagsFlag = tags ? '--tags' : '';
  execSync(`git push ${remote} ${branchArg} ${tagsFlag}`.trim());
}

export async function runGitCommand(command: string[], cwd?: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', command, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Git command failed with code ${code}: ${stderr}`));
      }
    });
  });
}
