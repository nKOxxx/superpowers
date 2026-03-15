# @superpowers/plan-ceo-review

Product strategy review using BAT framework (Brand, Attention, Trust) and 10-star methodology.

## Installation

```bash
npm install @superpowers/plan-ceo-review
```

## Usage

### CLI

```bash
# Review a feature with auto-calculated scores
plan-ceo-review "New Dashboard: A real-time analytics dashboard for users"

# Review with explicit scores
plan-ceo-review "Feature Name: Description" --brand 4 --attention 3 --trust 5

# Output as JSON
plan-ceo-review "Feature Name: Description" --json

# Force auto-calculation (silences warning)
plan-ceo-review "Feature Name: Description" --auto
```

### Programmatic

```typescript
import { reviewCommand, autoCalculateScores } from '@superpowers/plan-ceo-review';

// Run review
await reviewCommand('New Dashboard: Real-time analytics', {
  auto: true,
  json: false,
});

// Just calculate scores
const scores = autoCalculateScores('New Dashboard', 'Real-time analytics for users');
console.log(scores); // { brand: 3.5, attention: 4, trust: 3 }
```

## BAT Framework

The BAT framework scores features across three dimensions (0-5 each):

### Brand
- Does this strengthen brand positioning?
- Is it differentiated from competitors?
- Does it communicate brand values?

### Attention
- Will this capture user attention?
- Does it have growth/viral potential?
- Is it discoverable and engaging?

### Trust
- Does this build user confidence?
- Is it secure and reliable?
- Does it demonstrate transparency?

## 10-Star Methodology

- **10 stars** (15/15) = Exceptional - Must build
- **7-9 stars** (10-14/15) = Strong - Build
- **5-6 stars** (7.5-9.9/15) = Promising - Consider
- **0-4 stars** (0-7.4/15) = Weak - Don't build

## Scoring

| Score | Rating | Action |
|-------|--------|--------|
| 10+ / 15 | 🟢 | BUILD |
| 7.5-9.9 / 15 | 🟡 | CONSIDER |
| < 7.5 / 15 | 🔴 | DON'T BUILD |

## Auto-Calculation

The tool automatically scores based on keywords in the description:

**Brand keywords:** brand, identity, recognition, reputation, authority, unique...

**Attention keywords:** engagement, viral, growth, traffic, acquisition, retention...

**Trust keywords:** security, privacy, reliable, transparent, verified, compliance...

## CLI Options

```
Usage: plan-ceo-review [options] <description>

Arguments:
  description            Feature/product description (e.g., "Feature Name: Description")

Options:
  -b, --brand <score>    Brand score (0-5)
  -a, --attention <score>  Attention score (0-5)
  -t, --trust <score>    Trust score (0-5)
  --auto                 Auto-calculate scores based on description (default: false)
  --json                 Output as JSON (default: false)
  -h, --help            display help for command
```

## License

MIT
