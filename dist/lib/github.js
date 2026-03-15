"use strict";
/**
 * GitHub API utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGitHubRelease = createGitHubRelease;
exports.hasGitHubToken = hasGitHubToken;
exports.getGitHubToken = getGitHubToken;
/**
 * Create a GitHub release
 */
async function createGitHubRelease(repo, version, changelog, token, prerelease = false) {
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
    return response.json();
}
/**
 * Check if GH_TOKEN is available
 */
function hasGitHubToken() {
    return !!process.env.GH_TOKEN;
}
/**
 * Get GH_TOKEN
 */
function getGitHubToken() {
    return process.env.GH_TOKEN;
}
//# sourceMappingURL=github.js.map