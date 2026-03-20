---
name: plan-ceo-review
description: Product strategy evaluation using BAT framework (Brand, Attention, Trust) and 10-star methodology for build vs buy decisions. Use when evaluating new features, prioritizing roadmap, comparing product opportunities, or making strategic product decisions.
---

# Plan CEO Review Skill

Product strategy evaluation using the BAT framework and 10-star methodology. Make better product decisions with structured analysis.

## Capabilities

- **BAT Analysis**: Evaluate Brand, Attention, and Trust dimensions
- **10-Star Methodology**: Assess problem, usability, delight, feasibility, viability
- **Build vs Buy Decisions**: Structured decision framework
- **Feature Prioritization**: Compare multiple features
- **Strategic Recommendations**: Clear build/don't build guidance

## Usage

```bash
# Review a feature idea
plan-ceo-review "AI-powered search"

# Review with context
plan-ceo-review "Mobile app" --audience="enterprise" --market="saas"

# Compare two features
plan-ceo-review compare "Feature A" "Feature B"

# Build vs Buy analysis
plan-ceo-review "Notifications" --build-vs-buy
```

## BAT Framework

Evaluates three dimensions (0-5 each):

| Dimension | Question | High Score When |
|-----------|----------|-----------------|
| **Brand** | Does this strengthen our brand? | Iconic, brand-defining feature |
| **Attention** | Will users actually use this? | Solves real problem, high demand |
| **Trust** | Does this build user trust? | Transparent, secure, user control |

### Scoring Summary

| Score | Recommendation |
|-------|----------------|
| 12-15 | **BUILD** - Strong signal, prioritize |
| 10-11 | **BUILD** - Good signal, proceed |
| 8-9 | **CONSIDER** - Mixed, needs refinement |
| 0-7 | **DON'T BUILD** - Weak signal, reconsider |

## 10-Star Methodology

Inspired by Brian Chesky (Airbnb CEO) - push beyond "good enough":

| Rating | Description |
|--------|-------------|
| 1★ | Works (barely) |
| 3★ | Meets basic needs |
| 5★ | Meets expectations |
| 7★ | Great - exceeds expectations |
| 10★ | Transforms the category |

### Dimensions

- **Problem**: How well does it solve a real user problem?
- **Usability**: How easy is it to use?
- **Delight**: Does it create moments of joy?
- **Feasibility**: Can we build this well?
- **Viability**: Sustainable business model?

## Build vs Buy Framework

When evaluating whether to build or buy:

1. **Cost Analysis**: Build cost vs Buy cost (TCO over 3 years)
2. **Time to Market**: Build timeline vs Buy timeline
3. **Strategic Value**: Core differentiator vs Commodity
4. **Maintenance Burden**: Ongoing costs
5. **Customization Needs**: How much tailoring required?

## Output

- BAT scores with visual bars
- 10-star overall rating
- BUILD/CONSIDER/DON'T BUILD recommendation
- Next steps and resource estimates
- Timeline projections

## Scoring Guide

### BAT Score Interpretation

| Score | Recommendation |
|-------|----------------|
| 12-15 | **BUILD** - Strong signal, prioritize |
| 10-11 | **BUILD** - Good signal, proceed |
| 8-9 | **CONSIDER** - Mixed, needs refinement |
| 0-7 | **DON'T BUILD** - Weak signal, reconsider |

### 10-Star Scale

| Stars | Level |
|-------|-------|
| 1-3 | Below expectations |
| 4-5 | Meets minimum |
| 6-7 | Good - competitive |
| 8-9 | Excellent - market leader |
| 10 | Transforms category |

## Reference

See [references/frameworks.md](references/frameworks.md) for:
- Detailed BAT framework scoring
- 10-star methodology breakdown
- Build vs buy decision tree
- Industry examples
