# BAT Framework Guide

The BAT framework evaluates product features on three dimensions: **Brand**, **Attention**, and **Trust**.

## Origins

Adapted from the 10-star product methodology and Garry Tan's gstack approach for AI-powered development workflows.

## The Three Dimensions

### Brand (0-5 stars)

Does this feature strengthen our brand identity?

| Score | Description |
|-------|-------------|
| ⭐⭐⭐⭐⭐ | Iconic feature that defines the category |
| ⭐⭐⭐⭐ | Differentiated and memorable |
| ⭐⭐⭐ | Good quality, meets expectations |
| ⭐⭐ | Mediocre, forgettable |
| ⭐ | Weakens brand perception |

### Attention (0-5 stars)

Will users actually use this feature?

| Score | Description |
|-------|-------------|
| ⭐⭐⭐⭐⭐ | Daily use, core workflow |
| ⭐⭐⭐⭐ | Weekly use, high value |
| ⭐⭐⭐ | Monthly use, nice to have |
| ⭐⭐ | Rarely used, low value |
| ⭐ | Never used, wasted effort |

### Trust (0-5 stars)

Does this feature build user trust?

| Score | Description |
|-------|-------------|
| ⭐⭐⭐⭐⭐ | Critical safety/security feature |
| ⭐⭐⭐⭐ | Significant reliability improvement |
| ⭐⭐⭐ | Expected standard |
| ⭐⭐ | Minor trust impact |
| ⭐ | Erodes trust |

## Scoring

- **12-15 stars**: Build immediately
- **10-11 stars**: Build with confidence
- **8-9 stars**: Consider carefully
- **5-7 stars**: Probably don't build
- **0-4 stars**: Don't build

## Minimum Threshold

**2 out of 3 dimensions must be positive** (3+ stars) to proceed with building.

## Examples

### Example 1: Mobile App
- Brand: 4 (strong brand alignment)
- Attention: 5 (daily use expected)
- Trust: 3 (meets expectations)
- **Total: 12 → BUILD**

### Example 2: Analytics Dashboard
- Brand: 3 (neutral)
- Attention: 3 (monthly use)
- Trust: 4 (data transparency)
- **Total: 10 → BUILD**

### Example 3: Experimental Feature
- Brand: 2 (risky)
- Attention: 2 (niche audience)
- Trust: 2 (untested)
- **Total: 6 → DON'T BUILD**

## Usage with OpenClaw

```bash
/plan-ceo-review "Should we add feature X?"
/plan-ceo-review --feature="mobile app" --goal="increase engagement 50%"
```
