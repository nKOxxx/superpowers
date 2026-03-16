# @superpowers/plan-ceo-review

Product strategy review using BAT framework.

## Usage

```bash
superpowers ceo-review <feature> [goal] [options]
```

## Options

- `--audience=<text>` - Target audience
- `--competition=<text>` - Competitors
- `--trust=<text>` - Trust assets
- `--brand=<score>` - Manual brand score (0-5)
- `--attention=<score>` - Manual attention score (0-5)
- `--trust-score=<score>` - Manual trust score (0-5)
- `--json` - Output as JSON
- `--output=<path>` - Save to file

## Examples

```bash
superpowers ceo-review "Dark mode" "User preference"
superpowers ceo-review "AI feature" --audience="Developers"
superpowers ceo-review framework
```
