---
name: plan-ceo-review
description: Product strategy review using BAT framework (Brand, Attention, Trust) and 10-star methodology. Use for feature evaluation, build vs buy decisions, and product prioritization. Triggers on /plan-ceo-review, should we build, feature evaluation, or product strategy discussions.
triggers:
  - /plan-ceo-review
  - should we build
  - feature evaluation
  - product strategy
  - build vs buy
  - prioritization
model: kimi-k2.5
---

# 📊 /plan-ceo-review - Product Strategy Superpower

BAT framework (Brand, Attention, Trust) + 10-star methodology for build decisions.

## Installation

```bash
npm install -g @openclaw/superpowers-plan-ceo-review
```

## Quick Start

```bash
# Basic evaluation
plan-ceo-review "AI Chat Feature" --brand=4 --attention=5 --trust=4

# With business context
plan-ceo-review "Mobile App" \
  --goal="Increase engagement 50%" \
  --market="SaaS productivity" \
  --brand=5 --attention=5 --trust=3

# Quick decision framework
plan-ceo-review "Feature X" -b 4 -a 5 -t 3

# See examples
plan-ceo-review --examples
```

## BAT Framework

Every feature is scored on 3 dimensions (0-5 stars each):

### 🎨 Brand (0-5 stars)
Does this feature strengthen our brand?

| Score | Description | Example |
|-------|-------------|---------|
| ⭐⭐⭐⭐⭐ | Iconic, defines category | Apple's Face ID |
| ⭐⭐⭐⭐ | Differentiated, memorable | Notion's block editor |
| ⭐⭐⭐ | Good quality, expected | Standard OAuth login |
| ⭐⭐ | Mediocre, forgettable | Basic settings page |
| ⭐ | Weakens brand | Broken, frustrating UX |

### 👁 Attention (0-5 stars)
Will users actually use this?

| Score | Description | Frequency |
|-------|-------------|-----------|
| ⭐⭐⭐⭐⭐ | Daily use, core workflow | Home feed, inbox |
| ⭐⭐⭐⭐ | Weekly use, high value | Analytics dashboard |
| ⭐⭐⭐ | Monthly use, nice to have | Export reports |
| ⭐⭐ | Rarely used, low value | Advanced settings |
| ⭐ | Never used, wasted effort | Forgotten feature |

### 🔐 Trust (0-5 stars)
Does this build user trust?

| Score | Description | Example |
|-------|-------------|---------|
| ⭐⭐⭐⭐⭐ | Critical safety/security | 2FA, encryption |
| ⭐⭐⭐⭐ | Significant reliability improvement | Uptime SLA |
| ⭐⭐⭐ | Expected standard | Privacy policy |
| ⭐⭐ | Minor trust impact | Minor UX polish |
| ⭐ | Erodes trust | Data leaks, dark patterns |

## 10-Star Product Methodology

Features scoring **10+ stars total** (out of 15 maximum) are approved for building.

| Total Score | Recommendation | Action |
|-------------|----------------|--------|
| 12-15 ⭐ | **BUILD** | High priority, allocate resources |
| 10-11 ⭐ | **BUILD** | Proceed with confidence |
| 8-9 ⭐ | **CONSIDER** | Gather more data, MVP test |
| 5-7 ⭐ | **DON'T BUILD** | Probably not worth it |
| 0-4 ⭐ | **DON'T BUILD** | Focus elsewhere |

## Usage

### Basic Commands

```bash
# Evaluate feature with BAT scores
plan-ceo-review "Feature Name" --brand=4 --attention=5 --trust=4

# Short options
plan-ceo-review "Feature Name" -b 4 -a 5 -t 4

# With business context
plan-ceo-review "Feature Name" \
  --goal="Increase retention 20%" \
  --market="B2B SaaS" \
  --brand=4 --attention=5 --trust=4
```

## Configuration

Create `superpowers.config.json`:

```json
{
  "ceoReview": {
    "minimumScore": 10,
    "requireAllBAT": false,
    "autoGenerateNextSteps": true,
    "marketAnalysis": true
  },
  "telegram": {
    "enabled": true,
    "botToken": "${TELEGRAM_BOT_TOKEN}",
    "chatId": "${TELEGRAM_CHAT_ID}"
  }
}
```

## CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--goal` | `-g` | Business goal | - |
| `--market` | `-m` | Target market segment | - |
| `--brand` | `-b` | Brand score (1-5) | `3` |
| `--attention` | `-a` | Attention score (1-5) | `3` |
| `--trust` | `-t` | Trust score (1-5) | `3` |
| `--telegram` | - | Send Telegram notification | `false` |
| `--config` | `-c` | Config file path | - |

## Build vs Buy Analysis

### Build When:
- Score 10+ on BAT framework
- Core differentiator for your product
- Unique to your business model
- Long-term strategic value

### Buy When:
- Score < 8 on BAT framework
- Commodity functionality
- Faster time-to-market critical
- Better to focus engineering elsewhere

### Examples

| Feature | Brand | Attention | Trust | Total | Decision |
|---------|-------|-----------|-------|-------|----------|
| AI Chat | 5 | 5 | 3 | 13 | Build |
| Auth System | 2 | 5 | 5 | 12 | Buy (Auth0) |
| Analytics | 3 | 4 | 4 | 11 | Buy (Mixpanel) |
| Mobile App | 4 | 5 | 4 | 13 | Build |
| PDF Export | 2 | 2 | 3 | 7 | Don't build |

## Best Practices

1. **Score honestly**: Optimism bias kills products
2. **Get multiple opinions**: Different stakeholders see different value
3. **Revisit scores**: Markets change, reassess quarterly
4. **Document rationale**: Why you decided matters for learning
5. **Set metrics**: Define success before building

---

**Part of OpenClaw Superpowers** | [GitHub](https://github.com/nKOxxx/superpowers)
