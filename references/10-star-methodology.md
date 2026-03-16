# 10-Star Product Methodology

## Overview

A product scoring system that helps teams decide what to build. Features scoring 10+ stars (out of 15) are approved for development.

## Scoring System

### Brand (0-5 stars)

How much does this feature strengthen your brand?

```
⭐⭐⭐⭐⭐ = Iconic, defines category
⭐⭐⭐⭐   = Differentiated, memorable
⭐⭐⭐     = Good quality, expected
⭐⭐       = Mediocre, forgettable
⭐         = Weakens brand
```

### Attention (0-5 stars)

How much will users actually use this feature?

```
⭐⭐⭐⭐⭐ = Daily use, core workflow
⭐⭐⭐⭐   = Weekly use, high value
⭐⭐⭐     = Monthly use, nice to have
⭐⭐       = Rarely used, low value
⭐         = Never used, wasted effort
```

### Trust (0-5 stars)

How much does this build user trust?

```
⭐⭐⭐⭐⭐ = Critical safety/security feature
⭐⭐⭐⭐   = Significant reliability improvement
⭐⭐⭐     = Expected standard
⭐⭐       = Minor trust impact
⭐         = Erodes trust
```

## Decision Matrix

| Total Score | Recommendation | Action |
|-------------|----------------|--------|
| 12-15 | **BUILD** | Prioritize immediately |
| 10-11 | **BUILD** | Include in roadmap |
| 8-9 | **CONSIDER** | Needs strong justification |
| 5-7 | **DON'T BUILD** | Opportunity cost too high |
| 0-4 | **DON'T BUILD** | Wasted effort |

## Why 10 Stars?

10 out of 15 = 67% threshold

- Ensures **balanced** features (not just one dimension)
- Forces **trade-offs** - can't just optimize for attention
- Filters **nice-to-haves** from **must-haves**
- Simple enough for **quick decisions**

## Comparison to Other Frameworks

### RICE (Reach, Impact, Confidence, Effort)
- Requires effort estimation upfront
- More complex calculation
- Better for roadmap prioritization

### MoSCoW (Must, Should, Could, Won't)
- Binary categories
- No nuance within categories
- Hard to compare features

### 10-Star
- **Quick** - Score in seconds
- **Balanced** - Three dimensions prevent gaming
- **Clear threshold** - 10+ is an easy rule
- **Discussable** - Scores spark productive debate

## Scoring Tips

1. **Score independently** - Don't let one dimension influence others
2. **Be honest** - Don't inflate scores to justify a pet feature
3. **Use examples** - Calibrate with past features
4. **Revisit scores** - Update as market/context changes

## Calibration Examples

### High Scorers (12-15)

| Feature | Brand | Attention | Trust | Total |
|---------|-------|-----------|-------|-------|
| Slack threads | 5 | 5 | 4 | 14 |
| Figma multiplayer | 5 | 5 | 3 | 13 |
| Linear keyboard shortcuts | 4 | 5 | 3 | 12 |

### Medium Scorers (8-11)

| Feature | Brand | Attention | Trust | Total |
|---------|-------|-----------|-------|-------|
| Dark mode | 3 | 4 | 3 | 10 |
| Custom emojis | 4 | 3 | 2 | 9 |
| Export to PDF | 2 | 4 | 2 | 8 |

### Low Scorers (5-7)

| Feature | Brand | Attention | Trust | Total |
|---------|-------|-----------|-------|-------|
| Animated backgrounds | 2 | 2 | 1 | 5 |
| Leaderboards | 3 | 2 | 1 | 6 |
| Voice commands | 2 | 3 | 1 | 6 |

## FAQ

**Q: What if a feature scores 11 but has a 0 in Trust?**

Don't build it. Trust is foundational. A 0 in any dimension is a red flag.

**Q: Can we adjust the threshold?**

Yes. Early-stage startups might use 8+. Enterprise might require 12+.

**Q: How do we score features we haven't built?**

Estimate based on user research, competitor analysis, and team expertise.

**Q: Should we rescore after launch?**

Yes. Use actual usage data to update Attention scores. Learn for next time.
