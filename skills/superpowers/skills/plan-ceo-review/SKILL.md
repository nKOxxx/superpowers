---
name: plan-ceo-review
description: Product strategy evaluation using BAT framework (Brand, Attention, Trust) and 10-star methodology for build vs buy decisions. Use when evaluating features, assessing product decisions, determining whether to build or buy, or prioritizing product roadmap items. Provides structured scoring and actionable recommendations.
user-invocable: true
metadata:
  { "openclaw": { "requires": { "bins": ["node"], "npm": ["@openclaw/superpowers-plan-ceo-review"] }, "emoji": "📊" } }
---

# Plan CEO Review - Product Strategy (BAT Framework)

Structured product decision-making using the BAT (Brand, Attention, Trust) framework and 10-star methodology.

## Quick Start

### Evaluate a Feature
```bash
/plan-ceo-review "Feature Name" --brand=4 --attention=5 --trust=3
```

### See Example Evaluations
```bash
/plan-ceo-review --examples
```

## BAT Framework

Evaluate across three dimensions (0-5 stars each):

### 🎨 Brand (B)
Does this align with and strengthen our brand?

| Score | Meaning |
|-------|---------|
| 5 | Iconic, defines category |
| 4 | Differentiated, memorable |
| 3 | Good quality, expected |
| 2 | Mediocre, forgettable |
| 1 | Weakens brand |
| 0 | Damages brand |

### 👁 Attention (A)
Will this capture and retain user attention?

| Score | Meaning |
|-------|---------|
| 5 | Daily use, core workflow |
| 4 | Weekly use, high value |
| 3 | Monthly use, nice to have |
| 2 | Occasionally used |
| 1 | Rarely used, low value |
| 0 | Never used, wasted effort |

### 🔐 Trust (T)
Will this build or erode trust?

| Score | Meaning |
|-------|---------|
| 5 | Critical safety/security |
| 4 | Significant reliability improvement |
| 3 | Expected standard |
| 2 | Minor trust impact |
| 1 | Minor trust concerns |
| 0 | Erodes trust (dark patterns) |

## 10-Star Methodology

Total score = Brand + Attention + Trust (max 15)

| Total | Recommendation |
|-------|----------------|
| 10-15 | ✅ BUILD - Core differentiator |
| 8-9 | 🤔 CONSIDER - Needs validation |
| 0-7 | ❌ DON'T BUILD - Buy or skip |

## Commands

### `/plan-ceo-review "<feature>" [options]`

Evaluate a feature or proposal.

**Options:**
- `-b, --brand <n>` - Brand score 0-5 (default: 3)
- `-a, --attention <n>` - Attention score 0-5 (default: 3)
- `-t, --trust <n>` - Trust score 0-5 (default: 3)
- `-g, --goal <text>` - Business goal context
- `-m, --market <text>` - Target market segment
- `--examples` - Show example evaluations

## Example Evaluations

```
Feature          Brand  Attention  Trust  Total  Decision
─────────────────────────────────────────────────────────
AI Chat             5          5      3     13   BUILD
Auth System         2          5      5     12   BUY (Auth0)
Analytics           3          4      4     11   BUY (Mixpanel)
Mobile App          4          5      4     13   BUILD
PDF Export          2          2      3      7   DON'T BUILD
```

## Output

The skill provides:
- Individual BAT scores with descriptions
- Total score (out of 15)
- Recommendation (BUILD/CONSIDER/DON'T BUILD)
- Rationale with strengths and concerns
- Specific next steps
- Build vs Buy analysis

## When to Use

**Use for:**
- Feature prioritization decisions
- Build vs Buy analysis
- Product roadmap planning
- Resource allocation discussions
- Evaluating partnerships or integrations

**Don't use for:**
- Technical architecture decisions (use system-architect skill)
- Code implementation (use coding directly)
- Marketing campaigns

## Configuration

Create `superpowers.config.json`:

```json
{
  "ceoReview": {
    "minimumScore": 10,
    "requireAllBAT": false,
    "autoGenerateNextSteps": true,
    "marketAnalysis": true
  }
}
```

## Key Principles

1. **Be honest about scores** - Don't inflate to get the answer you want
2. **Consider second-order effects** - How does this impact other features?
3. **Re-evaluate over time** - Market conditions change
4. **10+ means build** - High confidence investment
5. **Below 8 means don't build** - Focus on higher-impact work
