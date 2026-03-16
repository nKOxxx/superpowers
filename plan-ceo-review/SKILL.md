---
name: plan-ceo-review
description: "Product strategy evaluation using BAT framework (Brand, Attention, Trust) and 10-star methodology. Use when: (1) evaluating new feature ideas, (2) prioritizing product roadmap, (3) comparing product opportunities, (4) making build vs. don't build decisions."
metadata:
  {
    "openclaw":
      {
        "emoji": "🎯",
        "requires": { "bins": ["npx"] },
        "install":
          [
            {
              "id": "npm",
              "kind": "npm",
              "package": "@nko/superpowers",
              "bins": ["plan-ceo-review"],
              "label": "Install CEO Review skill (npm)",
            },
          ],
      },
  }
---

# Plan CEO Review Skill

Product strategy evaluation using the BAT framework and 10-star methodology. Make better product decisions with structured analysis.

## Quick Start

```bash
# Review a feature idea
plan-ceo-review "Should we add Telegram notifications?"

# Review with target audience
plan-ceo-review --feature="Mobile app" --goal="increase engagement 50%"

# Compare two features
plan-ceo-review compare "Feature A" "Feature B"
```

## Commands

### review <feature>

Analyze a feature idea using BAT framework and 10-star methodology.

**Options:**
- `-f, --feature <feature>` - Feature name
- `-g, --goal <goal>` - Business goal this feature serves
- `-m, --market <market>` - Market segment

**Examples:**
```bash
# Basic review
plan-ceo-review "Dark mode"

# Review with context
plan-ceo-review --feature="AI Assistant" --goal="increase engagement" --market="SaaS"
```

Sample output:
```
📊 CEO Review: AI Assistant

🎯 BAT Framework Score
   Brand:     ⭐⭐⭐⭐○ 4/5
   Attention: ⭐⭐⭐⭐⭐ 5/5
   Trust:     ⭐⭐⭐○○ 3/5
   TOTAL:     12/15 🟢

📋 Recommendation: BUILD
```

## BAT Framework

The BAT framework evaluates product opportunities across three dimensions:

### Brand (0-5)
Does this strengthen our brand?
- 5: Iconic feature that defines the brand
- 4: Strongly aligns with brand positioning
- 3: Neutral brand impact
- 2: Slight brand misalignment

### Attention (0-5)
Will users actually use this?
- 5: Must-have, high demand
- 4: Strong user interest
- 3: Moderate appeal
- 2: Niche interest

### Trust (0-5)
Does this build user trust?
- 5: Significantly increases trust
- 4: Builds confidence
- 3: Neutral impact
- 2: Minor trust concerns

### BAT Scoring Summary

| Total Score | Recommendation |
|-------------|----------------|
| 12-15 ⭐ | **BUILD** | Strong signal - prioritize |
| 10-11 ⭐ | **BUILD** | Good signal - proceed |
| 8-9 ⭐ | **CONSIDER** | Mixed signal - needs refinement |
| 0-7 ⭐ | **DON'T BUILD** | Weak signal - reconsider |

## 10-Star Methodology

Inspired by Brian Chesky's approach to product excellence:

| Stars | Description |
|-------|-------------|
| 5★ | Meets expectations |
| 6★ | Good |
| 7★ | Great - exceeds expectations |
| 8★ | Excellent - delightful |
| 9★ | World-class |
| 10★ | Transforms the category |

## Configuration

Configure via `superpowers.config.json`:

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

## Example Output

```
CEO Review: Telegram Notifications
===================================

Feature: Telegram Notifications
Goal: Increase user engagement
Market: SaaS productivity tools

BAT Evaluation:
---------------
Brand:    ⭐⭐⭐⭐ (4/5) - Modern, tech-forward feature
Attention: ⭐⭐⭐⭐⭐ (5/5) - Daily use for power users
Trust:    ⭐⭐⭐⭐ (4/5) - Reliable delivery builds confidence

Total: 13/15 ⭐

Recommendation: BUILD ✅

Next Steps:
1. Design notification preferences UI
2. Implement Telegram Bot API integration
3. Add opt-in flow during onboarding
4. Measure engagement lift within 30 days
```

## Resources

- **scripts/plan-ceo-review.ts** - Main evaluation script
- **scripts/lib/bat-scoring.ts** - BAT framework implementation
- **scripts/lib/market-analysis.ts** - Competitive analysis
- **scripts/lib/recommendation.ts** - Recommendation engine
