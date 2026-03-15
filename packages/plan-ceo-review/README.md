# /plan-ceo-review - BAT Framework Skill

Product strategy review using the BAT (Brand, Attention, Trust) framework.

## Overview

The BAT framework provides a structured approach to evaluating product opportunities:

- **Brand (0-5)**: Alignment with brand identity and values
- **Attention (0-5)**: Potential to capture user interest and drive engagement
- **Trust (0-5)**: Ability to build or maintain user confidence

**Total Score**: 0-15 stars (10-star methodology)

## Scoring Guidelines

### Brand Scores
| Score | Description |
|-------|-------------|
| 0 | Actively damages brand reputation |
| 1 | Neutral or irrelevant to brand |
| 2 | Slightly on-brand, not distinctive |
| 3 | Reinforces existing brand positioning |
| 4 | Meaningfully extends brand |
| 5 | Defining brand moment |

### Attention Scores
| Score | Description |
|-------|-------------|
| 0 | Completely ignored by users |
| 1 | Brief glance, no engagement |
| 2 | Mild interest, quickly forgotten |
| 3 | Engages users, drives usage |
| 4 | Creates buzz, organic sharing |
| 5 | Cultural moment, viral phenomenon |

### Trust Scores
| Score | Description |
|-------|-------------|
| 0 | Breaks user trust significantly |
| 1 | Suspicious or questionable |
| 2 | Neutral, no trust impact |
| 3 | Builds some user trust |
| 4 | Significant trust gain |
| 5 | Trust breakthrough, establishes credibility |

## Usage

```bash
# Quick evaluation with explicit scores
plan-ceo-review "AI Chatbot" --brand=4 --attention=5 --trust=3

# With description
plan-ceo-review "Mobile App: Native iOS and Android apps" --brand=5 --attention=4 --trust=4

# Interactive mode (prompts for scores)
plan-ceo-review "New Feature" --interactive

# Auto-score based on feature description
plan-ceo-review "AI-powered recommendation engine"
```

## 10-Star Methodology

| Total Score | Recommendation |
|-------------|----------------|
| 10-15 | **BUILD** - Exceptional opportunity, prioritize immediately |
| 8-9 | **CONSIDER** - Strong potential, validate assumptions |
| 6-7 | **VALIDATE** - Some concerns, needs more research |
| <6 | **DON'T BUILD** - Poor fit, focus resources elsewhere |

**Rule of thumb**: Need 2/3 dimensions scoring 3+ to proceed.

## Output Example

```
📊 BAT Framework Review
Feature: AI Chatbot

📈 BAT Scores:
────────────────────────────────────────
Brand:      4/5 ★★★★☆
Attention:  5/5 ★★★★★
Trust:      3/5 ★★★☆☆
────────────────────────────────────────
Total:      12/15 stars
────────────────────────────────────────

🎯 Recommendation: BUILD

💭 Reasoning:
Strong brand alignment - this reinforces our identity.
High attention potential - users will engage actively.
Neutral trust impact - maintains current levels.
Overall: Strong strategic fit. Worth prioritizing.

📋 Next Steps:
• Prioritize AI Chatbot in next sprint
• Assign design resources for UX mockups
• Define MVP scope and success metrics
• Prepare technical architecture document
```

## Interactive Questions

When using interactive mode, the skill asks:

### Brand Questions
- Does this align with our core brand values?
- Will customers immediately associate this with us?
- Could this become a defining characteristic of our brand?

### Attention Questions
- Will users actively seek out this feature/product?
- Is there significant word-of-mouth potential?
- Does this solve a painful or frequently encountered problem?

### Trust Questions
- Can we reliably deliver on the promises made?
- Will this work as users expect, every time?
- Does this leverage or build upon existing trust?

## Requirements

- Node.js 18+

## Installation

```bash
openclaw skill install plan-ceo-review.skill.tar.gz
```

## References

Based on the BAT framework for product strategy decisions, combining:
- Brand affinity and alignment
- Attention economics and user engagement
- Trust building and credibility
