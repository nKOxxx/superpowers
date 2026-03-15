---
name: plan-ceo-review
description: Product strategy review using BAT framework (Brand, Attention, Trust) and 10-star methodology. Use when evaluating whether to build a feature, product decisions, prioritization, or build vs buy decisions. Triggers on requests like /plan-ceo-review, should we build X, feature evaluation, product strategy, or build vs buy decisions.
metadata:
  openclaw:
    requires:
      bins: ["node", "npx"]
      npm: ["@nko/superpowers"]
    primaryEnv: null
---

# Plan CEO Review - Product Strategy Skill

Product strategy evaluation using the BAT framework (Brand, Attention, Trust) with 10-star methodology for build decisions.

## The BAT Framework

Three dimensions scored 0-5 stars:

**Brand** - Does this strengthen our brand?
High score: Differentiating, innovative, aligns with identity

**Attention** - Will users actually use this?
High score: High frequency, core workflow, solves real pain

**Trust** - Does this build user trust?
High score: Security, reliability, transparency, safety

## 10-Star Methodology

- **12-15 ⭐ BUILD** - Strong signal, proceed with confidence
- **10-11 ⭐ BUILD** - Good signal, validate assumptions
- **8-9 ⭐ CONSIDER** - Mixed signal, need more data
- **0-7 ⭐ DON'T BUILD** - Weak signal, focus elsewhere

**Minimum threshold: 10/15 stars to build**

## Usage

### Basic evaluation

```bash
superpowers ceo-review --feature="mobile app"
```

### Full context

```bash
superpowers ceo-review \
  --feature="AI code review" \
  --goal="Reduce review time 50%" \
  --audience="Dev teams"
```

## Options

- `--feature=<name>` - Feature name (required)
- `--goal=<text>` - Business goal
- `--audience=<text>` - Target audience
- `--competition=<text>` - Competitors
- `--trust=<text>` - Trust assets you have

## Output Example

```
══════════════════════════════════════════════════
AI Code Review
══════════════════════════════════════════════════

Brand:     ⭐⭐⭐⭐⭐ (5/5)
Attention: ⭐⭐⭐⭐○ (4/5)
Trust:     ⭐⭐⭐○○ (3/5)

Total: 12/15 ⭐

Recommendation: BUILD ✅

Rationale:
  • Strong brand differentiation potential
  • High user engagement potential
  • Direct revenue impact should be modeled

Next Steps:
  1. Define success metrics (DAU, engagement time)
  2. Coordinate with marketing for launch narrative
  3. Set 30-day post-launch review date

══════════════════════════════════════════════════
```

## Scoring Guidelines

### Brand (0-5)
- **5**: Revolutionary, defines category, press-worthy
- **4**: Strong differentiation, innovative
- **3**: Good fit, incremental improvement
- **2**: Table stakes, me-too feature
- **1**: Off-brand, confusing

### Attention (0-5)
- **5**: Daily use, core workflow
- **4**: Weekly use, important workflow
- **3**: Monthly use, nice-to-have
- **2**: Rare use, edge case
- **1**: Nobody asked for this

### Trust (0-5)
- **5**: Security-critical, data protection
- **4**: Reliability-critical, uptime essential
- **3**: Transparency, user control
- **2**: Error handling, feedback
- **1**: No trust impact
