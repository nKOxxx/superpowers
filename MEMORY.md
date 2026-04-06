
## 2026-03-23 - Ayn Paused

**Status:** Ayn/Gulf Watch development paused by user.

**What happened:**
- Building Argus, Chatter, Ignite, Chronos, Skyline features
- Struggled with CSS/JS integration - new sections wouldn't display properly
- Multiple deployment attempts to Vercel (local vs git mismatch issues)
- User frustrated with the complexity

**Lessons learned:**
- Deploy via GitHub + Vercel auto-deploy, not local CLI
- New sections must be INSIDE `section-content` div
- CSS `display: block !important` needed to override parent rules
- Keep changes simple and push to git before testing

**User preferences:**
- Prefers simpler solutions
- Wants analysis of tools/competitors when shared
- Likes Conductor-style parallel agent spawning
- Said "lets pause Ayn"

**Next:** Resume when ready. Focus on getting features working before adding complexity.

## ARES Agent Project

**Purpose:** Multi-agent orchestrator for spawning parallel AI agents on git worktrees

**Features:**
- Clone repos, create worktrees, spawn agents
- Task list per workspace  
- Real-time status updates via SSE
- Conductor-style dark UI

**Repo:** https://github.com/nKOxxx/ares-agent

**Stack:** Electron + Node.js backend + vanilla JS frontend

**Status:** Working prototype deployed 2026-03-24

## Gulf Watch / Ayn Feeds Inventory (2026-03-25)

### RSS/REST Feeds (73 total)
| Feed | URL | Status |
|------|-----|--------|
| Newsdata.io API | pub_f718c2f2458e4aa9af72230e5d3f5d | ✅ |
| FARSNews | https://rss.app/feeds/9X7fSOVOaiZHtOr6.xml | ✅ |
| MehrNews | https://rss.app/feeds/iBfZthMj9m7d99uN.xml | ✅ |
| TehranTimes | https://rss.app/feeds/ySovRTtsScjix9r.xml | ✅ |
| Israel MOD | https://rss.app/feeds/ONFaZNztIulPvZDc.xml | ✅ |
| Royal Oman Police | https://rss.app/feeds/YHfnBinoL5JV1J7.xml | ✅ |
| Kuna | https://rss.app/feeds/pMqH90ylFHYmpPF2.xml | ✅ |
| Kuwait Fire | https://rss.app/feeds/WzsZIKALXFycsVCA.xml | ✅ |
| Bahrain MOI | https://rss.app/feeds/RGESjvd3KiLouQ1Q.xml | ✅ |
| Qatar MOD | https://rss.app/feeds/J9LSu9US4gNAowu.xml | ✅ |
| Qatar Civil Defence | https://rss.app/feeds/Gv74CuEmr7jMI8S.xml | ✅ |
| Oman Civil Defence | https://feeds.rssh.app/RyXtNTHU7MscSDx.xml | ✅ |
| Saudi CD | https://feeds.rssh.app/53nS4uUWlgreFs.xml | ✅ |
| Saudi MOD | https://feeds.rssh.app/8QxmtjO1nBYaMhl.xml | ✅ |
| WAM | https://feeds.rssh.app/yWxDexVK5P5WlnV9.xml | ✅ |
| UAE CD | https://feeds.feedmix.app/Da5ZvV4gQsJYMJja.xml | ✅ |
| UAE Cabinet | https://feeds.feedmix.app/OTlOJkkz297qnQN.xml | ✅ |
| UAE ENG | https://feeds.feedmix.app/DKefnWqL6iphgtp.xml | ✅ |
| UAE NDMC | https://feeds.feedmix.app/oqxMcPt6uwJ10D0.xml | ✅ |
| NCEMA UAE | https://feeds.feedmix.app/t0JvfszuALDyg4uh.xml | ✅ |
| mod.gov ae | https://feeds.feedmix.app/5DzID481Msg3w5Go.xml | ✅ |
| UAE MOI | https://feeds.feedmix.app/oPyw4FJ41usBjG0c.xml | ✅ |

### API Keys
| Service | Key | Status |
|---------|-----|--------|
| OpenSky Network | arestheagent@gmail.com-api-client / E9hWNjvQoXKWmguZcKBbrZSBvIHC5hlw | ✅ Active |
| NASA FIRMS | Free tier | ✅ |
| Newsdata.io | pub_f718c2f2458e4aa9af72230e5d3f5d | ✅ |

### Not Configured (needs credentials)
| Service | URL |
|----------|-----|
| Space-Track.org | https://www.space-track.org |
| N2YO Satellite | https://api.n2yo.com |
| Sentry | https://sentry.io/api |
| Twitter API | https://developer.twitter.com |
| Telegram Bot | @BotFather |

### Free Services (no key needed)
| Service | Status |
|---------|--------|
| Open-Meteo Weather | ✅ |
| NASA FIRMS Thermal | ✅ |
| GDELT News | ✅ |
| ReliefWeb UN | ✅ |
| WHO Disease | ✅ |
| US Treasury OFAC | ✅ |
| US BLS Jobs | ✅ |
| EIA Energy | ✅ |
| US Census Trade | ✅ |

## Feeds Inventory (2026-03-25)

### RSS/REST Feeds (73 total)

| Feed | URL |
|------|-----|
| FARSNews | https://rss.app/feeds/9X7fSOVOaiZHtOr6.xml |
| MehrNews | https://rss.app/feeds/iBfZthMj9m7d99uN.xml |
| TehranTimes | https://rss.app/feeds/ySovRTtscjx9r.xml |
| IsraelMOD | https://rss.app/feeds/ONFaZNztIulPvZDc.xml |
| RoyalOmanPolice | https://rss.app/feeds/YHfnBinoL5JV1J7.xml |
| Kuna | https://rss.app/feeds/pMqH90ylFHYmpPF2.xml |
| KuwaitFire | https://rss.app/feeds/WzsZIKALXFycsVCA.xml |
| BahrainMOI | https://rss.app/feeds/RGESjvd3KiLouQ1Q.xml |
| QatarMOD | https://rss.app/feeds/J9LSu9US4gNAowu.xml |
| QatarCivilDefence | https://rss.app/feeds/Gv74CuEmr7jMI8S.xml |
| OmanCivilDefence | https://feeds.rssh.app/RyXtNTHU7MscSDx.xml |
| SaudiCD | https://feeds.rssh.app/53nS4uUWlgRFs.xml |
| SaudiMOD | https://feeds.rssh.app/8QxmtjO1nBYaMhl.xml |
| WAM | https://feeds.rssh.app/yWxDexVK5P5WlnV9.xml |
| UAECD | https://feeds.feedmix.app/Da5ZvV4gQsJYMJa.xml |
| UAECabinet | https://feeds.feedmix.app/OTlOJkkz297qnQNn.xml |
| UAEENG | https://feeds.feedmix.app/DKefnWqL6iphgtp.xml |
| UAENDMC | https://feeds.feedmix.app/oqxMcPt6uwJ10D0K.xml |
| NCEMAUAE | https://feeds.feedmix.app/t0JvfszuALDyg4uh.xml |
| modgov ae | https://feeds.feedmix.app/5DzID481Msg3w5Go.xml |
| UAEMOI | https://feeds.feedmix.app/oPyw4FJ41usBjG0c.xml |

### API Keys

| Service | Key |
|---------|-----|
| OpenSky Network | arestheagent@gmail.com-api-client / E9hWNjvQoXKWmguZcKBbrZSBvIHC5hlw |
| Newsdata.io | pub_f718c2f2458e4aa9f72230e5d3f |
| NASA FIRMS | DEMO_KEY (free tier) |

### Free Services (no key)

| Service | Website |
|---------|---------|
| Open-Meteo Weather | https://open-meteo.com |
| NASA FIRMS | https://firms.modaps.eosdis.nasa.gov |
| GDELT News | https://www.gdeltproject.com |
| ReliefWeb UN | https://reliefweb.int |
| WHO Disease | https://www.who.int/emergencies |
| US Treasury OFAC | https://home.treasury.gov/policy-issues/financial-sanctions |
| US BLS Jobs | https://www.bls.gov |
| EIA Energy | https://www.eia.gov |
| US Census Trade | https://usatrade.census.gov |
| Nitter (Twitter proxy) | https://nitter.net |
| Sentry Error Tracking | https://sentry.io |

### Not Configured (needs credentials)

| Service | Website |
|----------|---------|
| Space-Track | https://www.space-track.org |
| N2YO Satellite | https://api.n2yo.com |
| Twitter API | https://developer.twitter.com |
| Telegram Bot | @BotFather |
| OpenAI API | https://platform.openai.com |

## Active Tasks

### ARES Agent
- Build real OpenClaw agent spawning
- Integrate feeds (73 RSS feeds via rss.app/feeds.feedmix.app proxies)
- NASA FIRMS free tier
- OpenSky credentials active
- Not configured: Space-Track, N2YO, Twitter API, Telegram bot, OpenAI

### Nitter (Twitter proxy)
- nitter.net instances work without API key
- RSS format: nitter.net/username/rss
