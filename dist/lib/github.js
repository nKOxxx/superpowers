"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGitHubClient = createGitHubClient;
exports.createRelease = createRelease;
exports.getLatestRelease = getLatestRelease;
exports.parseRepoString = parseRepoString;
const rest_1 = require("@octokit/rest");
function createGitHubClient() {
    const token = process.env.GH_TOKEN;
    if (!token) {
        throw new Error('GH_TOKEN environment variable is required for GitHub operations');
    }
    return new rest_1.Octokit({ auth: token });
}
async function createRelease(options) {
    const octokit = createGitHubClient();
    const response = await octokit.repos.createRelease({
        owner: options.owner,
        repo: options.repo,
        tag_name: options.tag,
        name: options.name,
        body: options.body,
        draft: options.draft ?? false,
        prerelease: options.prerelease ?? false
    });
    return response.data.html_url;
}
async function getLatestRelease(owner, repo) {
    try {
        const octokit = createGitHubClient();
        const response = await octokit.repos.getLatestRelease({ owner, repo });
        return {
            tag: response.data.tag_name,
            url: response.data.html_url
        };
    }
    catch (error) {
        return undefined;
    }
}
function parseRepoString(repo) {
    const parts = repo.split('/');
    if (parts.length !== 2) {
        throw new Error(`Invalid repo format: ${repo}. Expected "owner/repo"`);
    }
    return { owner: parts[0], repo: parts[1] };
}
//# sourceMappingURL=github.js.map