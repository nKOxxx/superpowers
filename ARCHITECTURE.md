# Gulf Watch + Hadal Architecture

## What We Have Live

| URL | Description | Status |
|-----|-------------|--------|
| gulfwatch-testing.vercel.app | Main Gulf Watch app | ✅ Live |
| github.com/nKOxxx/gulfwatch-testing | Source code | ✅ |

---

## Repo Map

```
GULF WATCH (Presentation)
└── gulfwatch-testing/          → gulfwatch-testing.vercel.app
    ├── public/
    │   ├── index.html         → Main app
    │   ├── js/
    │   │   ├── app.js         → Core app (tabs, navigation, map)
    │   │   ├── argus.js        → Entity resolution + threat scoring
    │   │   ├── chatter.js      → Social media intelligence
    │   │   ├── ignite.js       → NASA FIRMS thermal detection
    │   │   ├── chronos.js      → Temporal change detection
    │   │   ├── skyline.js      → Weather intelligence
    │   │   ├── maritime.js     → AIS vessel tracking
    │   │   ├── signals.js      → SIGINT/ELINT
    │   │   ├── venustrap.js    → Honeypot monitoring + 3D globe
    │   │   └── globe.gl        → 3D globe visualization
    │   ├── incidents.json      → Incident data (272 events)
    │   └── css/main.css        → Styling
    └── server.js               → API server (if needed)

GULF WATCH (Intelligence Layer)
└── ayn/                       → Intelligence features (source)
    ├── Ayn/src/lib/
    │   ├── argus.ts           → Entity resolution
    │   ├── chatter.ts         → Social media
    │   ├── ignite.ts         → NASA FIRMS
    │   ├── chronos.ts        → Temporal changes
    │   ├── skyline.ts        → Weather
    │   ├── maritime.ts       → AIS tracking
    │   ├── signals.ts        → SIGINT
    │   └── venustrap.ts      → Honeypot
    └── README.md

GULF WATCH (Memory/Infrastructure)
├── Cognexia/                   → Memory layer
│   ├── server.js              → API + web UI
│   ├── public/index.html       → Memory app
│   └── data-lake/             → Memory storage
│
├── spnitup/                    → Deployment platform
│   ├── docs/                  → Landing page
│   ├── worker/                 → Docker build worker
│   └── infra/                  → nginx configs
│
└── ruflo/                     → AI provider layer
    └── (AI provider integration)
```

---

## Data Flow

```
[HADAL FRONTEND]
        ↓
[GULFWATCH TESTING] ←→ [AYN INTELLIGENCE]
        ↓                    ↓
[COGNEXIA MEMORY]   [EXTERNAL APIs]
        ↓                    ↓
[SPNITUP DEPLOY]
```

---

## What Each Piece Does

### Hadal
- Frontend/presentation layer
- User interface
- Landing page
- User accounts/billing

### Gulf Watch Testing
- Intelligence dashboard
- 8 feature modules (Feed, Map, Argus, Chatter, Ignite, Chronos, Skyline, Maritime, Signals, Venus Trap)
- Geographic focus: Middle East/Gulf
- Live at: gulfwatch-testing.vercel.app

### Ayn
- Intelligence processing
- Entity resolution (Argus)
- Social media aggregation (Chatter)
- NASA FIRMS integration (Ignite)
- Temporal change (Chronos)
- Weather data (Skyline)
- Maritime tracking (Maritime)
- Signal intelligence (Signals)
- Honeypot monitoring (Venus Trap)

### Cognexia
- Long-term memory for agents
- Stores learned intelligence
- Agent context persistence

### spnitup
- Deployment platform for AI agents
- One-command deploy

### ruflo
- AI provider integration
- Model switching

---

## What Connects to What

| This | Connects To | Via |
|------|------------|-----|
| Hadal | Gulf Watch Testing | User's browser |
| Gulf Watch Testing | Ayn | JS imports (already ported) |
| Gulf Watch Testing | Cognexia | Future: share memory |
| Gulf Watch Testing | External APIs | NASA FIRMS, weather, etc. |
| Hadal | Cognexia | Future: user accounts |

---

## What's Missing / Needs Work

### High Priority
- [ ] Hadal frontend design (Hadal.site)
- [ ] User accounts + billing
- [ ] Real data feeds (currently mock/simulated)

### Medium Priority
- [ ] Connect Cognexia memory to Gulf Watch
- [ ] Real AIS data (MarineTraffic API)
- [ ] Real satellite data (NASA FIRMS API key)

### Low Priority (Nice to Have)
- [ ] Mobile app
- [ ] iCloud/Dropbox sync
- [ ] Team collaboration

---

## Decision: What Is Hadal?

**Option A: Hadal = Gulf Watch rebranded**
- Rename gulfwatch-testing → Hadal
- Use Hadal.site for landing
- All features are the same

**Option B: Hadal = Gulf Watch + extras**
- Hadal.site = premium tier
- gulfwatch-testing = free tier
- Extra features in Hadal: more regions, more feeds

**Option C: Hadal = separate product**
- Hadal = presentation/marketing
- Gulf Watch = technical showcase
- Different audiences

---

## Recommended Setup

```
HADAL.SITE (Landing + Accounts)
    ↓
GULFWATCH (Intelligence Dashboard)
    ├── Gulf Watch Testing (free tier features)
    └── Hadal Tier (paid features)
            ├── More regions
            ├── Real-time feeds
            └── Historical data

COGNEXIA (Memory - optional)
    ↓
SPNITUP (Deployment)
```

---

## Quick Reference

| Question | Answer |
|----------|--------|
| Where is Gulf Watch live? | gulfwatch-testing.vercel.app |
| Where is the code? | github.com/nKOxxx/gulfwatch-testing |
| Where are intelligence features from? | Ayn repo |
| What's Cognexia? | Memory layer for agents |
| What's spnitup? | Deployment platform |
| What's Hadal? | Frontend/brand (not built yet) |

---

_Last updated: 2026-03-25_
