# Frameworks Reference

Detailed documentation for the strategic frameworks used in Plan CEO Review.

## BAT Framework

The BAT framework evaluates product opportunities across three dimensions that predict success.

### Brand (0-5)

**Question:** Does this strengthen our brand?

| Score | Interpretation |
|-------|----------------|
| 5 | Iconic, brand-defining feature that competitors will copy |
| 4 | Strong brand association, memorable feature |
| 3 | Neutral - doesn't hurt or help brand significantly |
| 2 | Slightly off-brand, minor misalignment |
| 1 | Confusing brand message |
| 0 | Damages brand, contradictory to values |

**Examples:**
- **5:** Apple's Face ID, Tesla's Autopilot
- **3:** Generic settings page, standard export feature
- **1:** Off-brand feature that confuses users about what you do

### Attention (0-5)

**Question:** Will users actually use this?

| Score | Interpretation |
|-------|----------------|
| 5 | Solves critical pain point, high-frequency use |
| 4 | Solves real problem, regular use expected |
| 3 | Nice to have, occasional use |
| 2 | Rarely needed, low demand |
| 1 | Hypothetical need, no evidence |
| 0 | Nobody asked for this |

**Examples:**
- **5:** Search functionality, mobile app for daily-use product
- **3:** Annual report export, advanced analytics for power users
- **0:** Feature requested by one user with no broader applicability

### Trust (0-5)

**Question:** Does this build user trust?

| Score | Interpretation |
|-------|----------------|
| 5 | Radical transparency, user control, security-first |
| 4 | Clear privacy controls, honest communication |
| 3 | Standard security, no trust issues |
| 2 | Slightly opaque, minor trust concerns |
| 1 | Concerning data practices |
| 0 | Violates user trust, deceptive |

**Examples:**
- **5:** End-to-end encryption, clear data deletion, open source
- **3:** Standard password authentication, basic privacy settings
- **0:** Hidden data collection, difficult account deletion

### BAT Scoring Guide

| Total Score | Recommendation | Action |
|-------------|----------------|--------|
| 12-15 | **BUILD** | Strong signal, prioritize this feature |
| 10-11 | **BUILD** | Good signal, proceed with confidence |
| 8-9 | **CONSIDER** | Mixed signals, needs more research |
| 0-7 | **DON'T BUILD** | Weak signal, reconsider or pivot |

### Interpreting Edge Cases

**High Brand, Low Attention (5-1-5):** Iconic but rarely used. Consider if brand value justifies investment.

**High Attention, Low Trust (1-5-1):** Users want it but it feels sketchy. Danger zone - risks reputation.

**Balanced Medium (3-3-3):** Safe but uninspiring. Consider how to make it remarkable.

---

## 10-Star Methodology

Inspired by Brian Chesky, Airbnb CEO. The goal: push beyond "good enough" to truly exceptional.

### The Scale

| Stars | Level | Description |
|-------|-------|-------------|
| 10★ | Transformative | Changes how people think about the category |
| 9★ | Exceptional | Best-in-class, worth talking about |
| 8★ | Excellent | Clearly superior to alternatives |
| 7★ | Great | Exceeds expectations consistently |
| 6★ | Good | Above average, solid execution |
| 5★ | Expected | Meets baseline expectations |
| 4★ | Acceptable | Does the job, nothing special |
| 3★ | Below Average | Disappointing, needs work |
| 2★ | Poor | Frustrating experience |
| 1★ | Broken | Doesn't work as advertised |

### The Five Dimensions

#### 1. Problem-Solution Fit (0-10)

How well does this solve a real user problem?

- **10:** Solves a problem users didn't know they had (iPhone)
- **7:** Solves known problem significantly better (Slack vs email)
- **5:** Solves problem as expected (Generic form builder)
- **3:** Partial solution, workarounds needed
- **1:** Wrong problem entirely

#### 2. Usability (0-10)

How easy is it to use?

- **10:** Intuitive, no learning curve (Google Search)
- **7:** Easy after brief onboarding (Notion)
- **5:** Learnable with effort (Photoshop)
- **3:** Confusing, requires training
- **1:** Impossible to use without help

#### 3. Delight (0-10)

Does it create moments of joy?

- **10:** Delightful surprises throughout (Duolingo streaks)
- **7:** Polished details that impress (Apple animations)
- **5:** Professional, no frustration
- **3:** Functional but bland
- **1:** Actively unpleasant to use

#### 4. Feasibility (0-10)

Can we build this well?

- **10:** Well-understood, proven technology
- **7:** Some complexity but manageable
- **5:** Moderate risk, new territory
- **3:** High technical risk
- **1:** Impossible with current technology

#### 5. Viability (0-10)

Is there a sustainable business model?

- **10:** Clear monetization, high margin
- **7:** Monetizable with some effort
- **5:** Standard SaaS model applies
- **3:** Unclear path to revenue
- **1:** Pure cost center

### Calculating Overall Score

```
Overall = (Problem + Usability + Delight + Feasibility + Viability) / 5
```

### 10-Star Strategy

**For each feature, ask:**

1. What would make this a 5-star feature? (Meets expectations)
2. What would make this a 7-star feature? (Exceeds expectations)
3. What would make this a 10-star feature? (Transformative)

**Aim for:** At least one 10-star dimension, nothing below 5-star.

---

## Build vs Buy Decision Tree

### When to BUILD

- Core differentiator that defines your product
- Unique requirements that off-the-shelf can't meet
- Strategic capability you need to own
- Simpler than integrating external solution

### When to BUY

- Commodity functionality (auth, payments, analytics)
- Faster time-to-market is critical
- Specialized expertise you don't have
- Cost of building exceeds lifetime license cost

### When to do HYBRID

- Buy foundation, build customizations
- API-first approach with custom UI
- White-label with your branding

### Cost Analysis Framework

**Build Costs:**
- Initial development (engineer time × duration)
- Maintenance (20-30% of initial per year)
- Opportunity cost (what else could you build?)

**Buy Costs:**
- License/subscription fees (3-year projection)
- Integration effort
- Vendor lock-in risk

**Break-even formula:**
```
Build if: Initial_Build_Cost + (3 × Annual_Maintenance) < (3 × Annual_License_Fee) + Integration_Cost
```

---

## Case Studies

### Case Study: Airbnb Reviews

**BAT Score:** Brand 5, Attention 5, Trust 5 = **15 (BUILD)**
- Brand: Core differentiator, copied by everyone
- Attention: Every booking uses reviews
- Trust: Transparent, builds confidence

**10-Star:** 9/10
- Problem: 10 (fundamental to marketplace trust)
- Usability: 9 (simple 5-star + text)
- Delight: 8 (social proof, community)
- Feasibility: 10 (well-understood)
- Viability: 8 (drives bookings)

### Case Study: Generic Settings Export

**BAT Score:** Brand 2, Attention 2, Trust 4 = **8 (CONSIDER)**
- Brand: Commodity feature
- Attention: Rarely used
- Trust: Users appreciate data portability

**10-Star:** 5/10
- All dimensions around 5 (meets expectations)
- Recommendation: Buy or use open-source library

---

## Integration with OpenClaw

These frameworks are implemented in the `plan-ceo-review` skill. Use them via:

```bash
# Quick review
/plan-ceo-review "Feature Name"

# Detailed analysis with build vs buy
/plan-ceo-review "Feature Name" --build-vs-buy

# Compare two options
/plan-ceo-review "Option A" --compare "Option B"
```

The skill provides:
- Automated scoring based on feature characteristics
- Visual score bars in terminal output
- Clear BUILD/CONSIDER/DON'T BUILD recommendations
- Next steps and resource estimates