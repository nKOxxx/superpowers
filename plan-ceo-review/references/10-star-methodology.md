# 10-Star Product Methodology

## Overview

The 10-star methodology is a simplified framework for making build/don't build decisions on product features.

## The Rule

**Features scoring 10+ stars (out of 15) are approved for building.**

## Scoring Matrix

| Total Score | Action |
|-------------|--------|
| 12-15 ⭐ | Build immediately |
| 10-11 ⭐ | Build with confidence |
| 8-9 ⭐ | Consider carefully |
| 5-7 ⭐ | Probably don't build |
| 0-4 ⭐ | Don't build |

## Why 10 Stars?

- 15 points = 3 dimensions × 5 stars
- 10 stars = 2/3 of maximum
- Requires at least 2 dimensions to be strong

## Beyond the Score

While the BAT score provides a quantitative starting point, also consider:

1. **Technical feasibility** - Can we actually build this?
2. **Resource constraints** - Do we have the bandwidth?
3. **Strategic alignment** - Does this fit our roadmap?
4. **Competitive landscape** - What are others doing?

## Integration with OpenClaw

The `/plan-ceo-review` command automates BAT scoring and provides:
- Automated score calculation
- Market analysis
- Build recommendation
- Next steps generation
