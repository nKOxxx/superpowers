import type { GitHubRelease } from '../types/index.js';

const GITHUB_API = 'https://api.github.com';

/**
 * Parse owner/repo string format
 */
export function parseRepoString(repoString: string): { owner: string; repo: string } {
  const parts = repoString.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid repo format. Expected: owner/repo');
  }
  return { owner: parts[0], repo: parts[1] };
}

/**
 * Create GitHub API client
 */
export function createGitHubClient(): { token: string } {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GH_TOKEN environment variable is required');
  }
  return { token };
}

/**
 * Get GitHub token from environment
 */
export function getToken(): string | null {
  return process.env.GH_TOKEN || process.env.GITHUB_TOKEN || null;
}

/**
 * Check if GitHub CLI is available
 */
export function hasGHCLI(): boolean {
  try {
    const { execSync } = require('child_process');
    execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a GitHub release using gh CLI (preferred) or API
 */
export async function createRelease(
  owner: string,
  repo: string,
  release: GitHubRelease
): Promise<{ success: boolean; url?: string; error?: string }> {
  const token = getToken();

  // Try gh CLI first
  if (hasGHCLI()) {
    try {
      const { execSync } = require('child_process');
      const args = [
        'gh', 'release', 'create', release.tag_name,
        '--title', release.name,
        '--notes', release.body,
      ];
      
      if (release.draft) args.push('--draft');
      if (release.prerelease) args.push('--prerelease');

      execSync(args.join(' '), { stdio: 'pipe' });
      
      return {
        success: true,
        url: `https://github.com/${owner}/${repo}/releases/tag/${release.tag_name}`,
      };
    } catch (error) {
      // Fall through to API method
    }
  }

  // Fallback to API
  if (!token) {
    return {
      success: false,
      error: 'No GitHub token available. Set GH_TOKEN environment variable.',
    };
  }

  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(release),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json() as { html_url: string };
    return {
      success: true,
      url: data.html_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get repository info
 */
export async function getRepoInfo(owner: string, repo: string): Promise<{ success: boolean; default_branch?: string; error?: string }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json() as { default_branch: string };
    return {
      success: true,
      default_branch: data.default_branch,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
