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

## Philosophy (gstack-inspired)

Following Garry Tan's gstack philosophy:
- **Fast**: Quick scoring, immediate recommendation
- **Simple**: 3 dimensions, clear criteria
- **Reliable**: Data-driven decisions
- **Actionable**: Clear next steps

> "Building the wrong thing is the most expensive mistake you can make."
> — Garry Tan

## Quick Start

```bash
# Basic evaluation
/plan-ceo-review "AI Chat Feature" --brand=4 --attention=5 --trust=4

# With business context
/plan-ceo-review "Mobile App" \
  --goal="Increase engagement 50%" \
  --market="SaaS productivity" \
  --brand=5 --attention=5 --trust=3

# Quick decision framework
/plan-ceo-review "Feature X" -b 4 -a 5 -t 3
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

### Decision Matrix

```
        Brand
        1  2  3  4  5
      ┌──┬──┬──┬──┬──┐
  5   │  │  │  │ ✅│ ✅│
A  4   │  │  │ ✅│ ✅│ ✅│
t  3   │  │  │ ⚠️│ ✅│ ✅│
t  2   │  │ ⚠️│ ⚠️│ ⚠️│  │
n  1   │ ⚠️│ ⚠️│  │  │  │
      └──┴──┴──┴──┴──┘
        
✅ = Build (10+ stars with Trust ≥ 3)
⚠️ = Consider (8-9 stars)
(empty) = Don't build
```

## Usage

### Basic Commands

```bash
# Evaluate feature with BAT scores
/plan-ceo-review "Feature Name" --brand=4 --attention=5 --trust=4

# Short options
/plan-ceo-review "Feature Name" -b 4 -a 5 -t 4

# With business context
/plan-ceo-review "Feature Name" \
  --goal="Increase retention 20%" \
  --market="B2B SaaS" \
  --brand=4 --attention=5 --trust=4

# Send Telegram notification
/plan-ceo-review "Feature Name" --brand=4 --attention=5 --trust=4 --telegram
```

### Interactive Scoring

If no scores provided, the skill can guide you:

```bash
/plan-ceo-review "AI Chat Integration"
# Prompts for each BAT dimension
```

## Configuration

Create `superpowers.config.json`:

```json
{
  "ceoReview": {
    "minimumScore": 10,
    "requireAllBAT": false,
    "autoGenerateNextSteps": true,
    "marketAnalysis": true,
    "decisionMatrix": {
      "build": { "min": 10, "color": "green" },
      "consider": { "min": 8, "color": "yellow" },
      "dontBuild": { "min": 0, "color": "red" }
    }
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
| `--feature` | - | Feature name/description | **required** |
| `--goal` | `-g` | Business goal | - |
| `--market` | `-m` | Target market segment | - |
| `--brand` | `-b` | Brand score (1-5) | `3` |
| `--attention` | `-a` | Attention score (1-5) | `3` |
| `--trust` | `-t` | Trust score (1-5) | `3` |
| `--telegram` | - | Send Telegram notification | `false` |
| `--config` | `-c` | Config file path | - |

## Output Format

```
🎯 CEO Review - BAT Framework
Feature: Telegram Notifications

Feature Details:
  Goal: Increase user engagement
  Market: SaaS productivity tools

BAT Evaluation:
────────────────────────────────────────
Brand:     ⭐⭐⭐⭐ (4/5)
  ⭐⭐⭐⭐ - Differentiated, memorable
  
Attention: ⭐⭐⭐⭐⭐ (5/5)
  ⭐⭐⭐⭐⭐ - Daily use, core workflow
  
Trust:     ⭐⭐⭐⭐ (4/5)
  ⭐⭐⭐⭐ - Significant reliability improvement
────────────────────────────────────────

Total: 13/15 ⭐

Recommendation: BUILD ✅

Rationale:
  • Strong brand differentiator - positions us as category leader
  • High user engagement potential - will drive regular usage
  • Builds significant user trust and confidence
  • Powerful combination: high usage + strong brand impact

Next Steps:
  1. Add to roadmap with high priority
  2. Define success metrics and measurement plan
  3. Plan brand/marketing messaging around this feature
  4. Design for daily active usage patterns
  5. Set launch date and allocate resources

============================================================
```

## Build vs Buy Analysis

The CEO review helps answer: **Should we build this or buy it?**

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

## Strategic Insights

### High Brand, Low Attention
- Vanity features that look good but don't get used
- Marketing-driven builds
- Risk: Resource drain

### High Attention, Low Brand
- Commodity features users expect
- Table stakes, not differentiators
- Risk: Undifferentiated product

### High Trust, Low Attention
- Infrastructure, compliance features
- Important but invisible
- Risk: Underinvestment

### Balanced High Scores (4-5-4 or 5-5-5)
- Sweet spot for product-led growth
- Features users love and remember
- Focus engineering here

## Telegram Integration

When enabled, sends:
- Feature name
- BAT scores
- Total score
- Recommendation

## Best Practices

1. **Score honestly**: Optimism bias kills products
2. **Get multiple opinions**: Different stakeholders see different value
3. **Revisit scores**: Markets change, reassess quarterly
4. **Document rationale**: Why you decided matters for learning
5. **Set metrics**: Define success before building

## Example Reviews

### Review 1: AI-Powered Search
```bash
/plan-ceo-review "AI Search" \
  --goal="Reduce time to find information" \
  --brand=5 --attention=4 --trust=3
```
**Result**: 12/15 ⭐ - **BUILD**

### Review 2: Dark Mode
```bash
/plan-ceo-review "Dark Mode" \
  --brand=3 --attention=3 --trust=2
```
**Result**: 8/15 ⭐ - **CONSIDER** (quick win, low effort)

### Review 3: Custom Analytics Dashboard
```bash
/plan-ceo-review "Custom Analytics" \
  --brand=2 --attention=2 --trust=3
```
**Result**: 7/15 ⭐ - **DON'T BUILD** (buy Mixpanel instead)

## References

- [BAT Framework Deep Dive](references/bat-framework.md)
- [10-Star Methodology](references/10-star-methodology.md)
- [Build vs Buy Guide](references/build-vs-buy.md)
- [Product Strategy](references/product-strategy.md)

---

**Part of OpenClaw Superpowers** | [GitHub](https://github.com/nKOxxx/superpowers)
