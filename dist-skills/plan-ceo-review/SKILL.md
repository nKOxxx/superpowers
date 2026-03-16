---
name: plan-ceo-review
description: "Product strategy evaluation using BAT framework (Brand, Attention, Trust) and 10-star methodology. Use when: (1) evaluating new feature ideas, (2) prioritizing product roadmap, (3) comparing product opportunities, (4) making build vs. don't build decisions."
metadata:
  {
    "openclaw":
      {
        "emoji": "🎯",
        "requires": { "bins": ["npx"] },
        "install":
          [
            {
              "id": "npm",
              "kind": "npm",
              "package": "@superpowers/plan-ceo-review",
              "bins": ["plan-ceo-review"],
              "label": "Install CEO Review skill (npm)",
            },
          ],
      },
  }
---

# Plan CEO Review Skill

Product strategy evaluation using the BAT framework and 10-star methodology. Make better product decisions with structured analysis.

## Quick Start

```bash
# Review a feature idea
plan-ceo-review review "AI-powered code review"

# Review with target audience
plan-ceo-review review "Mobile app" --audience="developers"

# Compare two features
plan-ceo-review compare "Feature A" "Feature B"

# Learn the frameworks
plan-ceo-review framework
```

## Commands

### review <feature>

Analyze a feature idea using BAT framework and 10-star methodology.

**Options:**
- `-a, --audience <audience>` - Target audience description
- `-m, --market <market>` - Market segment
- `-f, --format <format>` - Output format: `text` (default), `json`, `markdown`
- `-d, --detailed` - Include detailed analysis
- `-o, --output <file>` - Save report to file

**Examples:**
```bash
# Basic review
plan-ceo-review review "Dark mode"

# Review with context
plan-ceo-review review "AI Assistant" --audience="enterprise teams" --market="SaaS"

# Export as markdown
plan-ceo-review review "New dashboard" --format=markdown --output=review.md

# JSON output for automation
plan-ceo-review review "API v2" --format=json
```

Sample output:
```
📊 CEO Review: AI Assistant

🎯 BAT Framework Score
   Brand:     ●●●●○ 4/5
   Attention: ●●●●● 5/5
   Trust:     ●●●○○ 3/5
   TOTAL:     12/15 🟢

📋 Recommendation: BUILD
   Strong signal across all BAT dimensions. Clear product-market fit indicators.

⭐ 10-Star Methodology
   Overall: ⭐⭐⭐⭐⭐⭐⭐○○○ 7/10
   Current State: Great - exceeds expectations

🎯 Final Verdict
   PRIORITY BUILD - Strong BAT score and high star rating indicate product-market fit potential.

📍 Next Steps:
   1. Add transparency, security features, or user control options
   2. Simplify the user experience - reduce friction
   3. Validate with target users through prototypes or interviews

💰 Resources: Medium-High - Accelerate to capitalize on strong signals
📅 Timeline: 2-3 months - Standard development timeline
```

### compare <feature1> <feature2>

Compare two feature ideas side-by-side.

**Example:**
```bash
plan-ceo-review compare "Mobile app" "Desktop app" --audience="remote workers"
```

Output:
```
⚖️  Feature Comparison

Feature 1: Mobile app
  BAT: 11/15 | Stars: 7/10 | BUILD

Feature 2: Desktop app
  BAT: 9/15 | Stars: 6/10 | CONSIDER

🏆 Winner: Mobile app
```

### framework

Display explanation of the BAT and 10-star frameworks.

```bash
plan-ceo-review framework
```

## BAT Framework

The BAT framework evaluates product opportunities across three dimensions:

### Brand (0-5)
Does this strengthen our brand?

**Scoring guide:**
- 5: Iconic feature that defines the brand
- 4: Strongly aligns with brand positioning
- 3: Neutral brand impact
- 2: Slight brand misalignment
- 1: Weakens or dilutes brand
- 0: Actively harms brand

**Consider:**
- Does it match our brand values?
- Will users associate this with us?
- Does it differentiate us from competitors?

### Attention (0-5)
Will users actually use this?

**Scoring guide:**
- 5: Must-have, high demand
- 4: Strong user interest
- 3: Moderate appeal
- 2: Niche interest
- 1: Hard to communicate value
- 0: No user interest

**Consider:**
- Is it solving a real problem?
- How often will users engage?
- Is it easy to discover and try?

### Trust (0-5)
Does this build user trust?

**Scoring guide:**
- 5: Significantly increases trust
- 4: Builds confidence
- 3: Neutral impact
- 2: Minor trust concerns
- 1: Significant trust issues
- 0: Violates user trust

**Consider:**
- Is it transparent?
- Does it protect user data?
- Are users in control?

### BAT Scoring Summary

| Score | Recommendation | Action |
|-------|----------------|--------|
| 12-15 ⭐ | **BUILD** | Strong signal - prioritize |
| 10-11 ⭐ | **BUILD** | Good signal - proceed |
| 8-9 ⭐ | **CONSIDER** | Mixed signal - needs refinement |
| 0-7 ⭐ | **DON'T BUILD** | Weak signal - reconsider |

## 10-Star Methodology

Inspired by Brian Chesky's approach to product excellence:

### Rating Scale

| Stars | Description |
|-------|-------------|
| 1★ | Works (barely) |
| 2★ | Functional but frustrating |
| 3★ | Meets basic needs |
| 4★ | Adequate |
| 5★ | Meets expectations |
| 6★ | Good |
| 7★ | Great - exceeds expectations |
| 8★ | Excellent - delightful |
| 9★ | World-class |
| 10★ | Transforms the category |

### Dimensions

**Problem (1-10)**
- How well does it solve a real user problem?
- Is this a must-have or nice-to-have?

**Usability (1-10)**
- How easy is it to use?
- Time to first value?

**Delight (1-10)**
- Does it create moments of joy?
- Are there unexpected pleasant surprises?

**Feasibility (1-10)**
- Can we build this well?
- Technical complexity?

**Viability (1-10)**
- Sustainable business model?
- Resource requirements reasonable?

### The 10-Star Vision

For any feature, ask: "What would a 10-star version look like?"

A 10-star experience:
- Works perfectly without any setup
- Anticipates user needs
- Provides value in 30 seconds
- Creates genuine delight
- Users actively recommend
- Becomes indispensable
- Sets a new industry standard

## Integration Tips

### Product Planning

Use CEO Review before sprint planning:

```bash
# In your planning script
for feature in $(cat features.txt); do
  plan-ceo-review review "$feature" --format=json --output="reviews/$feature.json"
done
```

### Decision Documentation

Save reviews for future reference:

```bash
plan-ceo-review review "Feature X" \
  --audience="enterprise" \
  --format=markdown \
  --output="decisions/2024-01-15-feature-x.md"
```

### Team Discussions

Use comparison for prioritization:

```bash
plan-ceo-review compare "API First" "UI First" --audience="developers"
```

## Best Practices

1. **Define the audience clearly** - The same feature scores differently for different users
2. **Be honest** - Don't inflate scores to justify a decision already made
3. **Use comparisons** - Relative scoring helps when everything seems important
4. **Review periodically** - Market conditions change; re-score quarterly
5. **Document the why** - Save markdown outputs for decision history

## Output Formats

### Text (Default)
Human-readable format with emojis and colors.

### JSON
Machine-readable for automation:
```json
{
  "feature": "AI Assistant",
  "bat": {
    "total": 12,
    "recommendation": "BUILD"
  },
  "stars": {
    "overall": 7
  }
}
```

### Markdown
Documentation-ready for PRs or wikis.

## Framework Origins

**BAT Framework**: Adapted from product strategy frameworks focusing on the three pillars of product success.

**10-Star Methodology**: Popularized by Brian Chesky (Airbnb CEO) as a way to push teams beyond "good enough" to truly exceptional products.
