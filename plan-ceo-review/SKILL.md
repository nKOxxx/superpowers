---
name: plan-ceo-review
description: Product strategy review using BAT framework (Brand, Attention, Trust) and 10-star methodology. Use when evaluating whether to build a feature, product decisions, prioritization, or build vs buy decisions. Triggers on requests like /plan-ceo-review, should we build X, feature evaluation, product strategy, or build vs buy decisions.
metadata:
  openclaw:
    requires:
      bins: ["node", "npx"]
      npm: ["@nko/superpowers"]
    primaryEnv: null
    modelCompatibility: ["kimi-k2.5", "claude-opus-4", "gpt-4"]
    skillType: "typescript"
    entryPoint: "dist/index.js"
---

# Plan CEO Review - Product Strategy Skill

Product strategy evaluation using the BAT framework (Brand, Attention, Trust) with 10-star methodology for build decisions.

## The BAT Framework

Three dimensions scored 0-5 stars:

**Brand** - Does this strengthen our brand?
- High score: Differentiating, innovative, aligns with identity

**Attention** - Will users actually use this?
- High score: High frequency, core workflow, solves real pain

**Trust** - Does this build user trust?
- High score: Security, reliability, transparency, safety

## 10-Star Methodology

- **12-15 ⭐ BUILD** - Strong signal, proceed with confidence
- **10-11 ⭐ BUILD** - Good signal, validate assumptions
- **8-9 ⭐ CONSIDER** - Mixed signal, need more data
- **0-7 ⭐ DON'T BUILD** - Weak signal, focus elsewhere

**Minimum threshold: 10/15 stars to build**

## Usage

### Basic evaluation

```bash
superpowers ceo-review "mobile app" "Increase user engagement"
```

### Full context

```bash
superpowers ceo-review \
  "AI code review" \
  "Reduce review time 50%" \
  --audience="Dev teams" \
  --competition="GitHub Copilot" \
  --trust="SOC2 certified"
```

### JSON output

```bash
superpowers ceo-review "Dark mode" "User preference" --json
```

## Options

- `--brand=<score>` - Manual brand score (0-5)
- `--attention=<score>` - Manual attention score (0-5)
- `--trust=<score>` - Manual trust score (0-5)
- `--auto` - Auto-calculate scores based on description. Default: true
- `--json` - Output as JSON

## Output Example

```
══════════════════════════════════════════════════
  CEO REVIEW: AI Code Review
══════════════════════════════════════════════════

  BAT Framework Scores:
    Brand:     [████░] 4/5
    Attention: [████░] 4/5
    Trust:     [███░░] 3/5

    BAT Total: 11/15 stars

  10-Star Evaluation:
    Average Score: 6.0/10

  Recommendation: BUILD ✅

  Rationale:
    • Strong brand differentiation potential
    • High user engagement potential

  Next Steps:
    1. Define success metrics and KPIs
    2. Create detailed product spec
    3. Estimate engineering effort

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

## Understanding the Framework

```bash
superpowers ceo-review --help
```

Displays detailed explanation of BAT methodology and 10-star scoring.
