# Plan CEO Review Skill

BAT framework for product decisions with Brand, Attention, Trust scoring and 10-star methodology.

## Usage

```
/plan-ceo-review "<product question>"
```

### Product Question Examples

- "Should we build a mobile app for our SaaS product?"
- "Is it worth adding AI features to our CRM?"
- "Should we expand into the European market?"

## BAT Framework

### Brand (0-5)
Does this align with and strengthen our brand?

| Score | Description |
|-------|-------------|
| 0 | Damages brand |
| 1 | Neutral/irrelevant |
| 2 | Slightly on-brand |
| 3 | Reinforces brand |
| 4 | Extends brand meaningfully |
| 5 | Defining brand moment |

### Attention (0-5)
Will this capture and hold user attention?

| Score | Description |
|-------|-------------|
| 0 | Ignored completely |
| 1 | Brief glance |
| 2 | Mild interest |
| 3 | Engages users |
| 4 | Creates buzz/sharing |
| 5 | Cultural moment |

### Trust (0-5)
Does this build or leverage trust?

| Score | Description |
|-------|-------------|
| 0 | Breaks trust |
| 1 | Suspicious |
| 2 | Neutral |
| 3 | Builds some trust |
| 4 | Significant trust gain |
| 5 | Trust breakthrough |

## 10-Star Methodology

Total BAT score determines recommendation:

| Total | Stars | Recommendation |
|-------|-------|----------------|
| 13-15 | ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ | **BUILD** - Exceptional opportunity |
| 10-12 | ⭐⭐⭐⭐⭐⭐⭐⭐ | **BUILD** - Strong case |
| 8-9 | ⭐⭐⭐⭐⭐⭐⭐ | **CONSIDER** - With modifications |
| 5-7 | ⭐⭐⭐⭐⭐ | **DON'T BUILD** - Unless significant changes |
| 0-4 | ⭐⭐⭐ | **DON'T BUILD** - Fundamentally flawed |

## Interactive Questionnaire

When used via Telegram, the skill provides an interactive questionnaire:

1. **Brand Questions:**
   - Does this align with our core values?
   - Will customers understand this as "us"?
   - Could this become a signature feature?

2. **Attention Questions:**
   - Will users actively seek this out?
   - Is there word-of-mouth potential?
   - Does it solve a painful problem?

3. **Trust Questions:**
   - Does this deliver on promises?
   - Is it technically feasible?
   - Will it work as expected?

## Output Format

```json
{
  "question": "Should we build X?",
  "bat": {
    "brand": { "score": 4, "rationale": "Aligns perfectly with..." },
    "attention": { "score": 3, "rationale": "Moderate interest..." },
    "trust": { "score": 5, "rationale": "Leverages existing..." }
  },
  "totalScore": 12,
  "stars": "⭐⭐⭐⭐⭐⭐⭐⭐",
  "recommendation": "BUILD",
  "confidence": "high",
  "risks": ["Competition may...", "Technical complexity..."],
  "nextSteps": ["Validate with 10 customers", "Build MVP"]
}
```

## Examples

### Basic Review
```
/plan-ceo-review "Should we add video calls to our chat app?"
```

### Interactive Mode (Telegram)
```
/plan-ceo-review "Should we build an AI assistant?"
```
Bot responds with inline buttons for scoring each dimension.

## Scoring Guidelines

### When to Score High (4-5)
- **Brand:** Creates new category, becomes synonymous with company
- **Attention:** Users can't stop talking about it, media coverage
- **Trust:** Solves critical problem reliably, exceeds expectations

### When to Score Low (0-2)
- **Brand:** Confuses positioning, follows competitors me-too
- **Attention:** Me-too feature, incremental improvement
- **Trust:** Unproven technology, overpromises, risky

## Configuration

Environment variables:
- `BAT_DEFAULT_INTERACTIVE` - Default to interactive mode (default: true)
- `BAT_MIN_CONFIDENCE` - Minimum confidence threshold (default: medium)

## Handler

**Entry:** `handler.ts`
**Runtime:** Node.js
