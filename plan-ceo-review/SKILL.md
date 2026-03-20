---
name: plan-ceo-review
description: Product strategy evaluation using BAT framework (Brand, Attention, Trust) and 10-star methodology for build vs buy decisions. Triggers on strategic product questions, feature evaluation, build vs buy decisions, roadmap prioritization, or CEO-level product reviews.
---

# Plan CEO Review - Product Strategy

Strategic product analysis using the BAT framework and 10-star methodology for build vs buy decisions.

## Quick Start

```bash
# Evaluate a feature/strategy
/plan-ceo-review "Should we build our own auth system?"

# With context
/plan-ceo-review "Should we acquire Company X?" --market-size 10B

# Full analysis
/plan-ceo-review "Build vs buy CRM" --depth full
```

## BAT Framework

Analyze through three lenses:

### Brand
How does this affect our brand perception?

- **Differentiation** - Does it set us apart?
- **Reputation** - Does it enhance or risk our reputation?
- **Positioning** - Where does it place us in the market?
- **Story** - What's the narrative we can tell?

### Attention
How does this capture and retain user attention?

- **Acquisition** - Does it attract new users?
- **Engagement** - Does it increase usage?
- **Retention** - Does it keep users coming back?
- **Virality** - Does it drive word-of-mouth?

### Trust
How does this build or erode trust?

- **Security** - Is it secure and private?
- **Reliability** - Will it work consistently?
- **Transparency** - Are we clear about what it does?
- **Support** - Can we stand behind it?

## 10-Star Methodology

Rate each option across 10 dimensions (1-5 stars each):

| Dimension | Question |
|-----------|----------|
| 1. User Value | Does it solve a real problem? |
| 2. Market Fit | Is the timing right? |
| 3. Strategic Alignment | Does it fit our mission? |
| 4. Technical Feasibility | Can we build it well? |
| 5. Resource Efficiency | Is it worth the investment? |
| 6. Speed to Market | How fast can we ship? |
| 7. Competitive Moat | Does it create defensibility? |
| 8. Scalability | Can it grow with us? |
| 9. Risk Level | What could go wrong? |
| 10. Opportunity Cost | What are we NOT doing? |

**Scoring:**
- 40-50 stars: Must do
- 30-39 stars: Strong candidate
- 20-29 stars: Consider carefully
- <20 stars: Probably skip

## Analysis Types

### Build vs Buy

```bash
/plan-ceo-review "Build vs buy authentication"
```

Compares:
- Build: Full control, differentiation, higher cost
- Buy: Faster, proven, less control

### Feature Evaluation

```bash
/plan-ceo-review "Should we add real-time collaboration?"
```

Evaluates:
- User impact
- Engineering cost
- Strategic value
- Competitive necessity

### Acquisition Analysis

```bash
/plan-ceo-review "Acquire startup X" --type acquisition
```

Assesses:
- Strategic fit
- Cultural alignment
- Technology value
- Team quality
- Price reasonableness

### Market Entry

```bash
/plan-ceo-review "Enter European market" --type market
```

Analyzes:
- Market size and growth
- Regulatory requirements
- Competition
- Localization needs

## Output Formats

### Summary (default)
Key recommendation with BAT scores

### Detailed
Full analysis with 10-star breakdown

### Executive
One-page brief for leadership

```bash
/plan-ceo-review "Question" --format detailed
/plan-ceo-review "Question" --format executive
```

## Integration

Use with other superpowers:
- `/qa` - Validate technical feasibility
- `/browse` - Research competitors
- `/ship` - Plan the rollout
