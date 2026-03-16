# BAT Framework

## Overview

The BAT (Brand, Attention, Trust) framework evaluates product features on three dimensions. Features scoring 10+ stars (out of 15) are approved for building.

## Dimensions

### Brand (0-5 ⭐)

Does this feature strengthen our brand?

| Score | Label | Description |
|-------|-------|-------------|
| 5 | Iconic | Defines the category, becomes synonymous with brand |
| 4 | Differentiated | Strongly memorable, clearly different from competitors |
| 3 | Quality | Good quality, meets user expectations |
| 2 | Mediocre | Forgettable, doesn't stand out |
| 1 | Weak | Weakens brand perception |
| 0 | Damaging | Actively harms brand reputation |

**Questions to ask:**
- Will users remember this feature?
- Does it differentiate us from competitors?
- Does it align with our brand values?

### Attention (0-5 ⭐)

Will users actually use this?

| Score | Label | Description |
|-------|-------|-------------|
| 5 | Daily Use | Core workflow, used every day by power users |
| 4 | Weekly Use | High value feature, used weekly |
| 3 | Monthly Use | Nice to have, used occasionally |
| 2 | Rare Use | Rarely used, low value |
| 1 | Never Used | Wasted effort, nobody uses it |
| 0 | Abandoned | Users actively avoid it |

**Questions to ask:**
- How frequently will users interact with this?
- Is this in their critical path?
- What's the cost of not having it?

### Trust (0-5 ⭐)

Does this build user trust?

| Score | Label | Description |
|-------|-------|-------------|
| 5 | Critical Safety | Critical safety or security feature |
| 4 | Reliability | Significant reliability improvement |
| 3 | Standard | Expected standard, table stakes |
| 2 | Minor Impact | Minor trust impact |
| 1 | Questionable | May erode trust if done poorly |
| 0 | Eroding | Actively erodes user trust |

**Questions to ask:**
- Does this improve security or privacy?
- Will it make the product more reliable?
- Could it backfire and hurt trust?

## Scoring Guide

### 12-15 ⭐: Build Immediately

Strong across all dimensions. Clear win.

Example: End-to-end encryption for messaging app
- Brand: 4 (privacy-focused positioning)
- Attention: 5 (affects every message)
- Trust: 5 (critical security feature)
- **Total: 14 ⭐**

### 10-11 ⭐: Build with Confidence

Good balance, worth building.

Example: Dark mode
- Brand: 3 (modern, expected feature)
- Attention: 4 (daily use for many users)
- Trust: 3 (shows attention to user preference)
- **Total: 10 ⭐**

### 8-9 ⭐: Consider Carefully

Marginal decision. Need strong justification.

Example: Custom themes
- Brand: 3 (allows personalization)
- Attention: 3 (occasional configuration)
- Trust: 2 (minor impact on trust)
- **Total: 8 ⭐**

### 5-7 ⭐: Probably Don't Build

Weak value proposition.

Example: Animated backgrounds
- Brand: 2 (novelty factor)
- Attention: 2 (rarely noticed)
- Trust: 1 (potential performance concern)
- **Total: 5 ⭐**

### 0-4 ⭐: Don't Build

Wasted effort or harmful.

## Decision Rules

1. **Minimum 10 stars** to build
2. **At least 2 of 3 dimensions** should score 3+
3. **No dimension** should score 0 (unless critical security fix)
4. **Brand score 4+** can justify building with lower attention

## Anti-Patterns

❌ **Feature factory** - Building everything that scores 10+
✅ **Strategic focus** - Only building what moves the needle

❌ **Ignoring trust** - High attention but erodes trust
✅ **Trust first** - Security and reliability over features

❌ **Brand theater** - Looks good but nobody uses
✅ **Brand + Attention** - Memorable AND useful
