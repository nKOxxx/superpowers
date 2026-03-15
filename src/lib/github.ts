/**
 * GitHub API utilities
 */

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
}

/**
 * Create a GitHub release
 */
export async function createGitHubRelease(
  repo: string,
  version: string,
  changelog: string,
  token: string,
  prerelease: boolean = false
): Promise<GitHubRelease> {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tag_name: `v${version}`,
      name: `v${version}`,
      body: changelog,
      prerelease,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }
  
  return response.json() as Promise<GitHubRelease>;
}

/**
 * Check if GH_TOKEN is available
 */
export function hasGitHubToken(): boolean {
  return !!process.env.GH_TOKEN;
}

/**
 * Get GH_TOKEN
 */
export function getGitHubToken(): string | undefined {
  return process.env.GH_TOKEN;
}
