---
name: plan-ceo-review
description: Product strategy review using BAT framework (Brand, Attention, Trust) and 10-star methodology. Use when evaluating whether to build a feature, product decisions, prioritization, or strategic planning. Triggers on requests like /plan-ceo-review, should we build X, feature evaluation, product strategy, or build vs buy decisions.
---

# /plan-ceo-review - Product Strategy

BAT framework + 10-star product methodology for build decisions.

## Quick Start

```bash
/plan-ceo-review "Should we add Telegram notifications?"
/plan-ceo-review --feature="mobile app" --goal="increase engagement 50%"
/plan-ceo-review --feature="AI chat" --market="SaaS tools"
```

## BAT Framework

Evaluate every feature on 3 dimensions (minimum 2/3 to build):

### Brand (0-5 stars)
Does this feature strengthen our brand?
- ⭐⭐⭐⭐⭐ - Iconic, defines category
- ⭐⭐⭐⭐ - Differentiated, memorable
- ⭐⭐⭐ - Good quality, expected
- ⭐⭐ - Mediocre, forgettable
- ⭐ - Weakens brand

### Attention (0-5 stars)
Will users actually use this?
- ⭐⭐⭐⭐⭐ - Daily use, core workflow
- ⭐⭐⭐⭐ - Weekly use, high value
- ⭐⭐⭐ - Monthly use, nice to have
- ⭐⭐ - Rarely used, low value
- ⭐ - Never used, wasted effort

### Trust (0-5 stars)
Does this build user trust?
- ⭐⭐⭐⭐⭐ - Critical safety/security feature
- ⭐⭐⭐⭐ - Significant reliability improvement
- ⭐⭐⭐ - Expected standard
- ⭐⭐ - Minor trust impact
- ⭐ - Erodes trust

## 10-Star Product Methodology

Features scoring **10+ stars total** (out of 15) are approved for building.

| Total Score | Recommendation |
|-------------|----------------|
| 12-15 | Build immediately |
| 10-11 | Build with confidence |
| 8-9 | Consider carefully |
| 5-7 | Probably don't build |
| 0-4 | Don't build |

## Output Format

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

Rationale:
- High engagement potential (daily use)
- Differentiates from competitors
- Relatively low implementation cost
- Strong user demand signal

Next Steps:
1. Design notification preferences UI
2. Implement Telegram Bot API integration
3. Add opt-in flow during onboarding
4. Measure engagement lift within 30 days
```

## Deep Analysis

The CEO review includes:

1. **Market Context** - Competitor analysis, market trends
2. **User Research** - Jobs-to-be-done, pain points
3. **Technical Feasibility** - Implementation complexity
4. **Business Impact** - Revenue, retention, growth
5. **Risk Assessment** - What could go wrong

## Configuration

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

## Resources

- **scripts/plan-ceo-review.ts** - Main evaluation script
- **scripts/lib/bat-scoring.ts** - BAT framework implementation
- **scripts/lib/market-analysis.ts** - Competitive analysis
- **references/bat-framework.md** - Detailed BAT methodology
- **references/10-star-methodology.md** - Product scoring guide

## Example Reviews

See `references/example-reviews.md` for completed evaluations of:
- Mobile app feature
- AI chat integration
- Payment system
- User onboarding redesign
