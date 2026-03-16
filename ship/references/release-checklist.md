# Release Best Practices

## Overview

The ship skill automates the release pipeline with safety checks.

## Release Checklist

Before shipping:

- [ ] Working directory is clean
- [ ] Tests are passing
- [ ] Version is properly incremented
- [ ] Changelog is updated
- [ ] GitHub token has release permissions

## Semantic Versioning

| Version Type | When to Use | Example |
|--------------|-------------|---------|
| patch | Bug fixes | 1.0.0 → 1.0.1 |
| minor | New features | 1.0.0 → 1.1.0 |
| major | Breaking changes | 1.0.0 → 2.0.0 |

## Conventional Commits

For automatic changelog generation, use conventional commit format:

```
feat: add user authentication
fix: resolve login timeout issue
docs: update API documentation
refactor: simplify payment processing
```

## Release Commands

```bash
# Dry run (preview only)
ship --repo=nKOxxx/app --version=patch --dry-run

# Skip tests (use with caution)
ship --repo=nKOxxx/app --version=minor --skip-tests

# Force release
ship --repo=nKOxxx/app --version=major --force
```

## Environment Setup

```bash
# Required
export GH_TOKEN=ghp_your_github_token

# Optional - for notifications
export TELEGRAM_BOT_TOKEN=your_bot_token
export TELEGRAM_CHAT_ID=your_chat_id
```

## Post-Release

1. Verify GitHub release was created
2. Check that tag was pushed
3. Monitor for issues
4. Announce in relevant channels
