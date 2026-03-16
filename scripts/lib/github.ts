/**
 * GitHub API integration
 */
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

export interface ReleaseOptions {
  owner: string;
  repo: string;
  tag: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  targetCommitish?: string;
}

export interface ReleaseResult {
  url: string;
  id: number;
  tag: string;
  name: string;
  published: boolean;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
}

/**
 * Parse repo string (owner/repo format)
 */
export function parseRepo(repoString: string): { owner: string; repo: string } {
  const parts = repoString.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid repo format: ${repoString}. Expected: owner/repo`);
  }
  return { owner: parts[0], repo: parts[1] };
}

/**
 * Get repo info from git remote
 */
export function getRepoFromGit(cwd: string = process.cwd()): RepoInfo {
  try {
    const remoteUrl = execSync('git remote get-url origin', { 
      encoding: 'utf-8', 
      cwd 
    }).trim();

    // Parse GitHub URL
    // Support formats:
    // - https://github.com/owner/repo.git
    // - git@github.com:owner/repo.git
    // - https://github.com/owner/repo
    
    const httpsMatch = remoteUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
    const sshMatch = remoteUrl.match(/github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
    
    const match = httpsMatch || sshMatch;
    if (!match) {
      throw new Error(`Could not parse GitHub URL: ${remoteUrl}`);
    }

    const defaultBranch = execSync('git branch --show-current', {
      encoding: 'utf-8',
      cwd
    }).trim();

    return {
      owner: match[1],
      repo: match[2],
      defaultBranch
    };
  } catch (error) {
    throw new Error(`Failed to get repo info from git: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create GitHub API client
 */
export function createGitHubClient(token?: string): Octokit {
  const auth = token || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  
  if (!auth) {
    throw new Error(
      'GitHub token not found. Set GH_TOKEN or GITHUB_TOKEN environment variable.'
    );
  }

  return new Octokit({ auth });
}

/**
 * Create a GitHub release
 */
export async function createRelease(
  options: ReleaseOptions,
  token?: string
): Promise<ReleaseResult> {
  const octokit = createGitHubClient(token);
  
  const { owner, repo, tag, name, body, draft = false, prerelease = false, targetCommitish } = options;

  const response = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    name: name || tag,
    body: body || '',
    draft,
    prerelease,
    target_commitish: targetCommitish
  });

  return {
    url: response.data.html_url,
    id: response.data.id,
    tag: response.data.tag_name,
    name: response.data.name || tag,
    published: !draft
  };
}

/**
 * Get the latest release
 */
export async function getLatestRelease(
  owner: string,
  repo: string,
  token?: string
): Promise<{ tag: string; name: string; published: string } | null> {
  const octokit = createGitHubClient(token);

  try {
    const response = await octokit.rest.repos.getLatestRelease({
      owner,
      repo
    });

    return {
      tag: response.data.tag_name,
      name: response.data.name || '',
      published: response.data.published_at || ''
    };
  } catch {
    return null;
  }
}

/**
 * Check if a release exists
 */
export async function releaseExists(
  owner: string,
  repo: string,
  tag: string,
  token?: string
): Promise<boolean> {
  const octokit = createGitHubClient(token);

  try {
    await octokit.rest.repos.getReleaseByTag({
      owner,
      repo,
      tag
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a git tag and push to remote
 */
export function createGitTag(tag: string, message?: string, cwd: string = process.cwd()): void {
  try {
    // Create annotated tag
    execSync(
      `git tag -a ${tag} -m "${message || `Release ${tag}`}"`,
      { cwd, stdio: 'inherit' }
    );
  } catch (error) {
    throw new Error(`Failed to create git tag: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Push tag to remote
 */
export function pushTag(tag: string, cwd: string = process.cwd()): void {
  try {
    execSync(`git push origin ${tag}`, { cwd, stdio: 'inherit' });
  } catch (error) {
    throw new Error(`Failed to push tag: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Push commits to remote
 */
export function pushCommits(branch?: string, cwd: string = process.cwd()): void {
  try {
    const targetBranch = branch || execSync('git branch --show-current', { encoding: 'utf-8', cwd }).trim();
    execSync(`git push origin ${targetBranch}`, { cwd, stdio: 'inherit' });
  } catch (error) {
    throw new Error(`Failed to push commits: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if working directory is clean
 */
export function isWorkingDirectoryClean(cwd: string = process.cwd()): boolean {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd }).trim();
    return status === '';
  } catch {
    return false;
  }
}

/**
 * Get current branch name
 */
export function getCurrentBranch(cwd: string = process.cwd()): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8', cwd }).trim();
  } catch (error) {
    throw new Error(`Failed to get current branch: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a release commit
 */
export function createReleaseCommit(
  version: string,
  files: string[] = ['package.json', 'CHANGELOG.md'],
  cwd: string = process.cwd()
): void {
  try {
    // Stage files
    for (const file of files) {
      execSync(`git add ${file}`, { cwd });
    }

    // Create commit
    execSync(
      `git commit -m "chore(release): ${version}"`,
      { cwd }
    );
  } catch (error) {
    throw new Error(`Failed to create release commit: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Send Telegram notification
 */
export async function sendTelegramNotification(
  message: string,
  options: {
    botToken?: string;
    chatId?: string;
  } = {}
): Promise<boolean> {
  const botToken = options.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = options.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}
