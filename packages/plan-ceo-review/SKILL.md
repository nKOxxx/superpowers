---
name: plan-ceo-review
description: Product strategy review using BAT framework (Brand, Attention, Trust) and 10-star methodology. Use when evaluating whether to build a feature, product decisions, prioritization, or build vs buy decisions. Triggers on requests like /plan-ceo-review, should we build X, feature evaluation, product strategy, or build vs buy decisions.
---

# Plan CEO Review - BAT Framework Skill

Strategic product evaluation using Brand, Attention, Trust scoring.

## Capabilities

- BAT scoring (Brand, Attention, Trust 0-5 each)
- 10-star methodology thresholds
- Auto-calculation or manual scoring
- Build/consider/don't build recommendations
- Next steps generation

## Usage

```bash
# Interactive mode - answers questions for scoring
/plan-ceo-review "Feature Name"

# With explicit scores
/plan-ceo-review "Feature Name" --brand=4 --attention=5 --trust=3

# With description
/plan-ceo-review "Feature Name: Description of the feature"
```

## BAT Framework

### Brand (0-5)
Does this strengthen our brand identity?
- 5 = Iconic, defines the brand
- 4 = Strongly aligns with brand
- 3 = Neutral/slightly positive
- 2 = Weak brand connection
- 1 = Off-brand
- 0 = Damages brand

### Attention (0-5)
Will this capture and retain user attention?
- 5 = Viral potential, high engagement
- 4 = Strong user interest
- 3 = Moderate attention
- 2 = Low interest
- 1 = Ignored
- 0 = Negative attention

### Trust (0-5)
Does this build or leverage trust?
- 5 = Deep trust, essential utility
- 4 = Significant trust builder
- 3 = Neutral trust
- 2 = Slight trust erosion risk
- 1 = High trust risk
- 0 = Trust destroyer

## 10-Star Methodology

Total score = Brand + Attention + Trust (max 15)

- **12-15 stars** = BUILD - Strong strategic fit
- **8-11 stars** = CONSIDER - Evaluate carefully
- **0-7 stars** = DON'T BUILD - Poor strategic fit

## CLI Arguments

- `feature` - Feature name (and optional description)
- `--brand` - Brand score (0-5)
- `--attention` - Attention score (0-5)
- `--trust` - Trust score (0-5)
- `--interactive` - Force interactive questioning

## Output

- BAT scores with justification
- Total score / 15
- Recommendation (BUILD/CONSIDER/DON'T BUILD)
- Strategic reasoning
- Suggested next steps

## Implementation

Use the bundled CLI in `cli.js`.