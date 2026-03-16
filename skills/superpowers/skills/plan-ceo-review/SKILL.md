# Plan CEO Review Skill

Product strategy evaluation using the BAT framework and 10-star methodology.

## Usage

```
/plan-ceo-review "<question or proposal>"
```

## BAT Framework

Evaluates proposals across three dimensions:

### Brand (B)
Does this align with and strengthen our brand?
- Core values alignment
- Market positioning impact
- Long-term brand equity

### Attention (A)
Will this capture and retain user attention?
- User value proposition
- Differentiation from competitors
- Engagement potential

### Trust (T)
Will this build or erode trust?
- User expectations
- Deliverability
- Transparency and honesty

## 10-Star Methodology

Rate each dimension 1-10, then average:

| Rating | Meaning |
|--------|---------|
| 9-10 | Exceptional, must do |
| 7-8 | Strong, should do |
| 5-6 | Neutral, could do |
| 3-4 | Weak, probably not |
| 1-2 | Poor, avoid |

## Output

- Individual BAT scores with reasoning
- Overall score and recommendation
- Risk assessment
- Alternative considerations
- Decision: PROCEED / PAUSE / REJECT

## Examples

```bash
# Evaluate a feature idea
/plan-ceo-review "Should we add a free tier with ads?"

# Review pricing change
/plan-ceo-review "Increase prices by 20% for new customers"

# Assess partnership
/plan-ceo-review "Partner with BigTech Corp for distribution"

# Evaluate tech decision
/plan-ceo-review "Rewrite the frontend in new framework"
```

## Decision Matrix

| Overall Score | Recommendation |
|---------------|----------------|
| 8.5+ | PROCEED - High confidence |
| 7.0-8.4 | PROCEED - With cautions |
| 5.0-6.9 | PAUSE - Needs refinement |
| <5.0 | REJECT - Doesn't meet bar |

## Notes

- The skill uses AI analysis for subjective dimensions
- Provides structured thinking, not absolute answers
- Encourages discussion of edge cases
- Considers second-order effects
