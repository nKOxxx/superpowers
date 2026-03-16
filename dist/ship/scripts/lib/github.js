/**
 * GitHub API integration for ship skill
 */
export async function createGitHubRelease(repo, options) {
    const token = options.token || process.env.GH_TOKEN;
    if (!token) {
        throw new Error('GitHub token required. Set GH_TOKEN or configure in superpowers.config.json');
    }
    const [owner, repoName] = repo.includes('/') ? repo.split('/') : ['', repo];
    if (!owner || !repoName) {
        throw new Error('Invalid repo format. Use "owner/repo"');
    }
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/releases`;
    const body = {
        tag_name: options.tag,
        name: `Release ${options.version}`,
        body: options.notes,
        draft: false,
        prerelease: false
    };
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GitHub API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return data.html_url;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('fetch')) {
            throw new Error('Network error. Check internet connection.');
        }
        throw error;
    }
}
export async function getLatestRelease(repo, token) {
    const authToken = token || process.env.GH_TOKEN;
    const [owner, repoName] = repo.split('/');
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/releases/latest`;
    const headers = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(apiUrl, { headers });
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
}
//# sourceMappingURL=github.js.map