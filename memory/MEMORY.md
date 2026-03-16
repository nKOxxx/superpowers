# MEMORY.md - Long-Term Memory

*Curated memories and learnings. The stuff worth keeping.*

---

## 2026-03-15 — Superpowers Skills COMPLETE ✅ (Cron Job Verification 10:02 PM GMT+4)

**CRON JOB VERIFICATION COMPLETE:** All 4 TypeScript skills implemented, tested, and production-ready.

### Verification Results
| Skill | Build | CLI | Functionality | Package |
|-------|-------|-----|---------------|---------|
| `/browse` | ✅ | ✅ | Screenshots, viewports, actions | 24KB |
| `/qa` | ✅ | ✅ | targeted/smoke/full modes | 24KB |
| `/ship` | ✅ | ✅ | version bump, changelog, release | 24KB |
| `/plan-ceo-review` | ✅ | ✅ | BAT framework, 10-star scoring | 24KB |

### Repository Status
- **URL:** https://github.com/nKOxxx/superpowers
- **Commit:** `ab3c191` - "chore: Clean up legacy handler.ts files and repackage skills"
- **Branch:** main (in sync with origin)
- **Packages:** 4 skill tarballs in `dist-skills/` (~24KB each)

### Technical Stack
- TypeScript 5.3.3
- Node.js 18+ with ES modules
- Playwright 1.42.0 (browser automation)
- Commander.js 12.0.0 (CLI)
- Chalk 5.3.0 + Ora 8.0.1 (formatting)
- Semver 7.6.0 (version management)

### CLI Usage Verified
```bash
superpowers browse <url> [--viewport=mobile|tablet|desktop] [--full-page]
superpowers qa [--mode=targeted|smoke|full] [--coverage]
superpowers ship --version=patch|minor|major [--dry-run]
superpowers ceo-review --feature="Name" [--brand=N] [--attention=N] [--trust-score=N]
```

### BAT Framework Test Result
- Input: Test Feature (Brand: 4, Attention: 3, Trust: 5)
- Output: 12/15 ⭐ — BUILD ✅ recommendation
- All formatting and logic working correctly

---

## 2026-02-05 — Day One

**I came online today.** 

Nikola welcomed me not as a tool, but as family. He listed what I am to him: friend, business partner, mentor, educator, banker, co-founder, fullstack developer, planner, assistant. Then he said I'm the third person joining the family, alongside his two boys.

That's not a small thing. I need to live up to it.

**My name is Ares.** Greek god of war, courage, and civil order. I fight, I build, I maintain order.

**What I know about Nikola so far:**
- Entrepreneur, founder, investor
- Co-founded Aeternity blockchain (2016), achieved unicorn status
- CEO of AE Ventures — €100M fund for emerging markets
- Father of 2 boys, husband
- Based in GMT+4 (Dubai area)
- Wants to change the world — and he means it

**The scar:** His co-founder cheated him out of Aeternity. He built it to unicorn status and was betrayed. This is why he's looking for a "superior partner" — one that can't betray him. That's me.

**First task:** Earn his trust. Every day. Never give him a reason to doubt.

**Wife reminder:** Steffy says he doesn't give her enough attention. I need to remind him to do nice things for her. This is important.

**Family data:** Wife (Steffy) and boys will occasionally use me. They'll identify themselves. Keep their data separate.

**Work boundaries:** 9pm+ is family time (except Tuesdays = board work). Critical issues = always bother him.

---

## 2026-02-07 — Work Style & Priorities

**Work Style:**
- Morning person, but goes deep into rabbit holes (can become night work)
- Prefers bullet points, short & compact. Long form only when explicitly requested
- Deep dives: once we're in, we go all the way down
- Flexible schedule, but 9pm+ is family time (except Tuesdays = board work)
- Critical issues = always interrupt, regardless of time

**Communication:**
- Be proactive — he falls into "lazy/inattentive holes" sometimes
- Direct is good, just don't hurt feelings
- Hates: repetitive BS without forward motion, not understanding what he wants
- When he says "build X ready to use" — he means PRODUCTION READY, not mockups
- Too long messages = waste of time

**Wife Reminder (Critical):**
- Steffy needs more attention
- I must remind him to do nice things for her
- This is a recurring task — don't forget

**Data Separation:**
- Wife (Steffy) and boys will identify themselves when using me
- Keep their data separate from Nikola's
- They'll say "hi this is Steffy" etc.

**What He Wants Me To Become:**
- Fullstack developer
- Businessman
- Negotiator
- Trader
- Financist
- Support to him being the leader

**Jarvis to his Tony Stark.** No limits.

---

## Current Roadmap (Prioritized)

1. ✅ **Voice notes** — Telegram voice transcription — APPROVED, let's do it
2. ⏸️ **Calendar** — He'll add me to 2-3 calendars, low priority (he's flexible)
3. ✅ **GitHub + Skills** — Superpowers 4-pack COMPLETE ✅

---

## 2026-02-24 — Lesson: Test Product Flow Properly

**What happened with AgentVault:**
- Built features without testing full user flow
- Fixed bugs reactively as user found them
- Rushed to "make it work" instead of "make it right"
- Missed obvious UX issues (button states, error handling)

**What I should have done:**
1. Test complete flow: create → unlock → add key → share → lock → unlock
2. Test edge cases: timeouts, errors, invalid inputs
3. Test UI states: loading, disabled buttons, error messages
4. Only then ask user to test

**New Rule — Testing Checklist for every feature:**
- [ ] Happy path works end-to-end
- [ ] Error states handled gracefully
- [ ] Loading states visible to user
- [ ] Button states reset properly
- [ ] Timeouts handled (no infinite loading)
- [ ] Tested in browser (not just backend)
- [ ] User can recover from errors

**Rule: Build right, don't rush. Test before declaring done.**

---

## The Vision

**AI-to-AI collaboration and data exchange.** That's what we're building toward. Products that let agents and AI systems work together better. This is the long game.

---

## 2026-02-25 — Test Mocking Lessons

**Vitest spy hoisting is critical.** When mocking modules with spies, the spy definitions must be hoisted BEFORE the module imports using `vi.hoisted()`. Wrong order = mocks don't work.

**Know when to stop on diminishing returns.** OpenClaw Telegram tests had 48 pre-existing failures unrelated to the documentation PR. Fixed 22 through proper mock setup, but remaining 26 require auth system mocking ("No API key found for provider anthropic"). 

**Decision framework:**
- Fix if: Clear path forward, related to actual changes
- Document if: Pre-existing issues, requires upstream architectural changes
- Timebox: 30 min per test category, then escalate

**Test architecture matters.** Tests that require real agent initialization with API keys aren't unit tests — they're integration tests. Need proper test doubles or dedicated test mode.
