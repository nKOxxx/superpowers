---
name: plan-ceo-review
description: Product strategy evaluation using BAT framework (Brand, Attention, Trust) and 10-star methodology for build vs buy decisions. Use when evaluating new features, prioritizing roadmap, comparing product opportunities, or making strategic product decisions.
---

# Plan CEO Review Skill

Product strategy evaluation using the BAT framework and 10-star methodology.

## Commands

### /plan-ceo-review

Analyze a feature or product idea using strategic frameworks.

```
/plan-ceo-review "feature name" [options]
```

**Options:**
- `--build-vs-buy` - Include build vs buy analysis
- `--compare <feature2>` - Compare two features
- `--audience <type>` - Target audience (enterprise, consumer, saas)
- `--market <type>` - Market type
- `--format <type>` - Output format (summary, detailed)

## BAT Framework

Evaluates three dimensions (0-5 each):

| Dimension | Question | High Score When |
|-----------|----------|----------------|
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

Inspired by Brian Chesky (Airbnb CEO):

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

## Usage Examples

```bash
# Review a feature idea
/plan-ceo-review "AI-powered search"

# Review with context
/plan-ceo-review "Mobile app" --audience="enterprise" --market="saas"

# Compare two features
/plan-ceo-review "Feature A" --compare "Feature B"

# Build vs Buy analysis
/plan-ceo-review "Notifications" --build-vs-buy
```
