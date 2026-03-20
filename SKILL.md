---
name: superpowers
description: OpenClaw superpowers - opinionated workflow skills for AI agents. Includes browse (browser automation for visual testing and QA with Playwright), qa (systematic testing with smart test selection), ship (release pipeline for version bump and changelog), and plan-ceo-review (product strategy using BAT framework with Brand, Attention, Trust analysis and 10-star methodology for build vs buy decisions). Triggers on /browse, /qa, /ship, /plan-ceo-review, /ceo-review, screenshot requests, visual testing, run tests, test coverage, release, publish, should we build, or feature evaluation commands.
---

# Superpowers

OpenClaw superpowers - opinionated workflow skills for AI agents.

## Quick Reference

| Command | Purpose | Trigger |
|---------|---------|---------|
| `/browse` | Browser automation, screenshots, accessibility audits | screenshot, visual testing |
| `/qa` | Smart test selection, coverage analysis | run tests, test coverage |
| `/ship` | Version bump, changelog, GitHub release | release, publish |
| `/plan-ceo-review` | Strategic analysis with BAT framework | should we build, feature evaluation |

## Installation

```bash
# Install all skills
npm install -g @openclaw/skill-browse @openclaw/skill-qa @openclaw/skill-ship @openclaw/skill-plan-ceo-review
```

## Individual Skills

- **browse**: See [browse/SKILL.md](browse/SKILL.md)
- **qa**: See [qa/SKILL.md](qa/SKILL.md)
- **ship**: See [ship/SKILL.md](ship/SKILL.md)
- **plan-ceo-review**: See [plan-ceo-review/SKILL.md](plan-ceo-review/SKILL.md)

## Usage Examples

```bash
# Browse
browse https://example.com --viewports mobile,desktop
browse https://example.com --audit

# QA
qa --changed --coverage
qa --full
qa --security

# Ship
ship patch --dry-run
ship minor

# Plan CEO Review
plan-ceo-review "AI feature"
plan-ceo-review compare "Feature A" "Feature B"
```
