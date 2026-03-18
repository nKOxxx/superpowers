# plan-ceo-review

Product strategy evaluation using BAT framework (Brand, Attention, Trust) and 10-star methodology for build vs buy decisions.

## Usage

```
/plan-ceo-review "<question>" [options]
```

## Arguments

- `question` - The strategic question to evaluate

## Options

- `--framework <type>` - Analysis framework: bat, 10star, both (default: both)
- `--build` - Estimate for build option
- `--buy` - Estimate for buy option
- `--timeline <weeks>` - Project timeline
- `--budget <amount>` - Budget constraint
- `--team-size <n>` - Available team size
- `--output <file>` - Save report to file
- `--format <fmt>` - Output format: markdown, json (default: markdown)
- `--telegram` - Send summary to Telegram

## BAT Framework

**Brand** - How does this impact brand perception?
- Differentiation potential
- Category positioning
- Brand alignment

**Attention** - Will this capture and retain user attention?
- User value proposition
- Engagement potential
- Virality/shareability

**Trust** - Does this build or erode trust?
- Data/security implications
- Quality assurance
- Long-term reliability

## 10-Star Methodology

Rate each aspect 1-10:
1. User Impact
2. Strategic Alignment
3. Technical Feasibility
4. Time to Market
5. Resource Requirements
6. Competitive Advantage
7. Risk Level (inverted)
8. Scalability
9. Maintainability
10. ROI Potential

## Examples

```bash
# Evaluate a feature decision
/plan-ceo-review "Should we build our own auth system?"

# With build/buy estimates
/plan-ceo-review "Build vs buy CRM" --build "6mo, 2eng" --buy "$50k/yr"

# Output to file
/plan-ceo-review "Launch mobile app" --output strategy.md

# Send to team
/plan-ceo-review "API redesign" --telegram
```

## Output

- BAT analysis with scores
- 10-star rating breakdown
- Build vs buy recommendation
- Risk assessment
- Final verdict with confidence
