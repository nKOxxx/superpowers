import axios from 'axios';

const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: Array<{
    id: number;
    name: string;
    browser_download_url: string;
  }>;
}

export interface CreateReleaseOptions {
  owner: string;
  repo: string;
  tag: string;
  name: string;
  body: string;
  draft?: boolean;
  prerelease?: boolean;
  targetCommitish?: string;
}

export function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error(
      'GitHub token not found. Set GITHUB_TOKEN or GH_TOKEN environment variable.'
    );
  }
  return token;
}

export function parseRepoUrl(remoteUrl?: string): { owner: string; repo: string } {
  // Try to get from git remote
  if (!remoteUrl) {
    try {
      const { execSync } = require('child_process');
      remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    } catch {
      throw new Error('Could not determine GitHub repository. Set owner/repo explicitly.');
    }
  }

  // Parse GitHub URL
  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
  if (!match) {
    throw new Error(`Could not parse GitHub URL: ${remoteUrl}`);
  }

  return { owner: match[1], repo: match[2] };
}

export async function createRelease(
  options: CreateReleaseOptions
): Promise<GitHubRelease> {
  const token = getGitHubToken();
  const { owner, repo, tag, name, body, draft = false, prerelease = false, targetCommitish } = options;

  const response = await axios.post(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases`,
    {
      tag_name: tag,
      name,
      body,
      draft,
      prerelease,
      target_commitish: targetCommitish
    },
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

export async function uploadReleaseAsset(
  owner: string,
  repo: string,
  releaseId: number,
  assetName: string,
  assetData: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<void> {
  const token = getGitHubToken();
  
  await axios.post(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(assetName)}`,
    assetData,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': contentType
      }
    }
  );
}

export async function getLatestRelease(
  owner: string,
  repo: string
): Promise<GitHubRelease | null> {
  const token = getGitHubToken();
  
  try {
    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases/latest`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null; // No releases yet
    }
    throw error;
  }
}

export async function getReleases(
  owner: string,
  repo: string,
  perPage: number = 30
): Promise<GitHubRelease[]> {
  const token = getGitHubToken();
  
  const response = await axios.get(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: { per_page: perPage }
    }
  );
  
  return response.data;
}

export async function deleteRelease(
  owner: string,
  repo: string,
  releaseId: number
): Promise<void> {
  const token = getGitHubToken();
  
  await axios.delete(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases/${releaseId}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }
  );
}
