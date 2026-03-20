# Framework Reference

Detailed reference for the BAT framework and 10-star methodology.

## BAT Framework

### Brand Dimension (0-5)

Evaluates whether the feature strengthens brand identity.

| Score | Criteria |
|-------|----------|
| 5 | Iconic, brand-defining feature that competitors will copy |
| 4 | Strongly reinforces brand values and positioning |
| 3 | Neutral - neither helps nor hurts brand |
| 2 | Slightly generic but not harmful |
| 1 | Commodity feature, doesn't differentiate |
| 0 | Actively conflicts with brand values |

**Keywords that boost score:**
- brand, identity, unique, signature, premium, exclusive, iconic, distinctive

**Keywords that reduce score:**
- commodity, generic, standard, basic, off-the-shelf

### Attention Dimension (0-5)

Evaluates whether users will actually engage with this feature.

| Score | Criteria |
|-------|----------|
| 5 | Core workflow, high daily active usage |
| 4 | Regular usage, solves clear pain point |
| 3 | Occasional usage, nice-to-have |
| 2 | Rare usage, edge case |
| 1 | Setup/config only, low engagement |
| 0 | Hidden feature, users won't discover |

**High-attention feature types:**
- Search, notifications, messaging, AI assistants, analytics dashboards, automation

**Low-attention feature types:**
- Admin panels, settings, configuration, maintenance tools

### Trust Dimension (0-5)

Evaluates whether the feature builds user trust.

| Score | Criteria |
|-------|----------|
| 5 | Radical transparency, user has full control |
| 4 | Secure, privacy-first design |
| 3 | Standard security practices |
| 2 | Some concerns, needs clarification |
| 1 | Significant trust issues |
| 0 | Violates user trust expectations |

**Trust-building keywords:**
- security, privacy, verification, backup, encryption, compliance, transparency

**Trust-reducing keywords:**
- tracking, ads, third-party, data-sharing, opaque

## 10-Star Methodology

Inspired by Brian Chesky's approach at Airbnb - don't stop at "good enough."

### The Scale

```
1★  - Barely works, frustrating experience
3★  - Meets basic needs, lots of friction
5★  - Meets expectations, industry standard
7★  - Exceeds expectations, delight moments
10★ - Transforms the category, world-class
```

### Dimensions

#### Problem (1-10)
How well does this solve a real user problem?

- **10**: Solves a problem users didn't know they had
- **7**: Solves a known pain point elegantly
- **5**: Addresses a common need adequately
- **3**: Minor improvement over status quo
- **1**: Solution looking for a problem

#### Usability (1-10)
How easy is it to use?

- **10**: Invisible interface, works like magic
- **7**: Intuitive, minimal learning curve
- **5**: Learnable with some effort
- **3**: Confusing, requires documentation
- **1**: Unusable without training

#### Delight (1-10)
Does it create moments of joy?

- **10**: "Wow" moments throughout
- **7**: Pleasant surprises, polish
- **5**: Professional, not frustrating
- **3**: Functional but bland
- **1**: Purely utilitarian

#### Feasibility (1-10)
Can we build this well?

- **10**: Well-understood, proven tech
- **7**: Some complexity but manageable
- **5**: Moderate technical risk
- **3**: Significant unknowns
- **1**: Research project territory

#### Viability (1-10)
Sustainable business model?

- **10**: Clear path to positive ROI
- **7**: Likely profitable with scale
- **5**: Break-even scenario
- **3**: Expensive but strategic
- **1**: Pure cost center

## Build vs Buy Decision Tree

### When to BUILD

1. **Core differentiator**
   - Unique to your product
   - Competitive advantage
   - Strategic moat

2. **Unique requirements**
   - No existing solution fits
   - Heavy customization needed
   - Integration complexity

3. **Long-term cost**
   - Build cost < 3x buy cost
   - Critical scaling requirements
   - Data control requirements

### When to BUY

1. **Commodity feature**
   - Standard across industry
   - Not differentiating
   - Users expect it to "just work"

2. **Speed to market**
   - Need it in < 1 month
   - Building takes > 6 months
   - Competitive pressure

3. **Maintenance burden**
   - Ongoing compliance needs
   - Specialized expertise required
   - 24/7 reliability critical

### When to go HYBRID

1. Build core, buy integrations
2. Buy foundation, customize heavily
3. Build MVP, migrate to bought solution

## Industry Examples

### BUILD Examples

- **Stripe**: Built own payment infrastructure
- **Netflix**: Built custom CDN
- **Figma**: Built proprietary rendering engine

### BUY Examples

- **Auth**: Most startups use Auth0/Firebase Auth
- **Analytics**: Mixpanel/Amplitude over custom
- **Email**: SendGrid/Mailgun over SMTP servers

### HYBRID Examples

- **Shopify**: Built core platform, bought shipping integrations
- **Slack**: Built messaging, bought video (Screenhero)
- **Notion**: Built editor, bought AI features
