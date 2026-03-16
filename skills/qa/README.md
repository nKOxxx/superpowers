# @superpowers/qa

Systematic testing as QA Lead.

## Usage

```bash
superpowers qa [options]
```

## Options

- `--mode=<mode>` - Test mode: targeted, smoke, full
- `--diff=<range>` - Git diff range for targeted mode
- `--coverage` - Enable coverage reporting
- `--framework=<framework>` - Force specific framework

## Examples

```bash
superpowers qa
superpowers qa --mode=smoke
superpowers qa --mode=full --coverage
```
