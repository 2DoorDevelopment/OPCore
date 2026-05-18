# OpCore — Project Specification

**A unified Star Citizen crew hub: mining/salvage sessions, fleet tracking, trade routing, and quick-access to the wider SC tool ecosystem.**

Built as a single static site, free to host, free to run, mobile-first, dark mode only.

---

## 1. Project goals & non-goals

### Goals
- Replace the constant tab-switching between cstone, UEX, Regolith, etc. with one personal hub.
- Provide multi-user session tracking for **mining** and **salvage** runs (host generates a code, friends join, host has authority).
- Persist per-user data (fleet, refinery jobs, trade history) tied to a Google account, accessible from any device.
- Stay 100% free to operate forever — Firebase Spark plan, GitHub Pages, no paid tiers, no Cloud Functions.
- Work identically on desktop and mobile (mobile-first responsive).
- Dark mode only.

### Non-goals
- No public marketplace / no replacing SC Market or Serpent's Hold.
- No real-time voice / video / chat (Discord already does this).
- No replacing in-game data overlays (that's Arkanis territory).
- No monetization, no ads, no analytics beyond what Firebase gives for free.

---

## 2. Repository & deployment

- **Repo name:** `opcore`
- **Owner:** Noah's personal GitHub account
- **Hosting:** GitHub Pages, deployed from a `gh-pages` branch via GitHub Actions on push to `main`.
- **Custom domain:** none initially. URL will be `https://<username>.github.io/opcore/`.
- **License:** No license file (keep it private-use). Add a `NOTICE.md` clarifying it's a fan tool, unaffiliated with CIG, and listing data sources.

### `vite.config.ts` base path

Because it's served from `/opcore/`, Vite needs:
```ts
export default defineConfig({
  base: '/opcore/',
  // ...
});
```

### GitHub Action (`.github/workflows/deploy.yml`)
- Triggers on push to `main`.
- Runs `npm ci`, `npm run build`, deploys `dist/` to `gh-pages` branch.
- Uses `peaceiris/actions-gh-pages@v3` or the official `actions/deploy-pages@v4`.

---

## 3. Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Build | Vite 5+ | Fast, Noah uses it on Holo-Manifest |
| Framework | React 18 + TypeScript | Same as Holo-Manifest, familiar |
| Styling | Tailwind CSS | Same as Holo-Manifest |
| Routing | React Router v6 (HashRouter) | HashRouter avoids 404s on GH Pages refresh |
| State | Zustand | Lightweight, no Redux boilerplate |
| UI primitives | Radix UI (headless) + custom Tailwind components | Free, accessible, looks professional |
| Icons | lucide-react | Already used in Holo-Manifest |
| Backend | Firebase (Spark / free tier) | Auth + Firestore only — NO Cloud Functions |
| Auth | Firebase Auth — **Google provider only** | Free, one-click, everyone has Google |
| Database | Firestore | Free tier: 1 GiB storage, 50K reads/day, 20K writes/day |
| External APIs | UEX Corp API 2.0, Star Citizen Wiki API v2 | Both free |
| Local cache | IndexedDB via `idb-keyval` | Cache UEX responses to stay under Firestore limits |

### Why no Cloud Functions
Cloud Functions require the Blaze (pay-as-you-go) plan. We can do **everything** client-side:
- UEX API calls happen straight from the browser.
- Firestore security rules enforce permissions (no server code needed).
- Session codes are generated client-side and validated by Firestore rules.

---

## 4. Theme / design system

**Dark mode only. No light theme toggle.**

### Color palette (Tailwind config)
```js
colors: {
  bg: {
    DEFAULT: '#0a0e14',    // page background
    panel:   '#111820',    // cards, panels
    elevated:'#1a232e',    // hover states, modals
  },
  border: {
    DEFAULT: '#1f2a37',
    bright:  '#2a3a4d',
  },
  text: {
    DEFAULT: '#e4e9ef',
    muted:   '#8a96a3',
    dim:     '#5a6573',
  },
  accent: {
    DEFAULT: '#4ecdc4',    // teal — primary actions, highlights
    hover:   '#5eddd4',
    dim:     '#2d8a85',
  },
  warn:    '#f5a623',
  danger:  '#e74c3c',
  success: '#4caf50',
}
```

### Typography
- Headings: **Rajdhani** (Google Fonts) — already in Noah's Serpent's Hold palette, gives a sci-fi industrial feel without being kitsch.
- Body: **Inter** (Google Fonts) — clean, readable on mobile.
- Monospace (codes, IDs): **JetBrains Mono**.

### Layout principles
- Mobile-first. Breakpoints at `sm:` (640px), `md:` (768px), `lg:` (1024px).
- Bottom tab bar on mobile, left sidebar on `md:` and up.
- All cards have subtle border (`border-border`), no heavy shadows.
- Density: comfortable on mobile (44px tap targets), denser on desktop.

### Naming aesthetic
- The app is "OpCore." Internal page names lean operational: "Mining Ops," "Salvage Ops," "Logistics," "Hangar," "Refinery," "Toolbox."
- Avoid hyper-thematic flavor text. Functional > flashy. Noah's Drydock has that covered.

---

## 5. Authentication

**Provider: Google only (Firebase Auth).**

### Flow
1. First visit shows a landing/login screen with one button: "Sign in with Google."
2. On success, the user document is created in Firestore at `users/{uid}` if it doesn't exist (see schema below).
3. Subsequent visits auto-restore session.
4. Sign-out clears Firebase session; does not delete user data.

### What gets stored on first sign-in
```ts
// users/{uid}
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  createdAt: Timestamp,
  lastSeenAt: Timestamp,
  handle: string | null,    // optional in-game handle, user sets later
}
```

### What is NOT stored
- No passwords (Google handles auth).
- No payment info (there is none).
- No PII beyond what Google provides.

---

## 6. Features (v1 scope)

The six features Noah selected:

1. **Mining Sessions** — host generates code, members join, rocks/payouts tracked, splits calculated.
2. **Salvage Sessions** — same session model, tracks RMC/CM hauls and splits.
3. **Cargo / Trade Route Planner** — UEX-powered, finds best routes for cargo capacity.
4. **Fleet Tracker** — user's owned ships, optional shared "crew fleet" view.
5. **Refinery Job Tracker** — active jobs with timers, yields, profit calc.
6. **Toolbox** — curated quick-links dashboard to the wider SC tool ecosystem.

Each is its own page, accessible via the nav. Sessions (mining + salvage) are the most complex; everything else is more straightforward CRUD on Firestore.

---

## 7. Sessions: shared mining/salvage tracking

This is the crown jewel and the part that most needs to match Noah's expectation from the existing mining site.

### Session model
A session is a single coordinated run between a host and 1–9 members (cap at 10 total participants to keep Firestore reads predictable).

### Session lifecycle
1. **Host creates session** → app generates a 6-character alphanumeric code (uppercase, no ambiguous chars: no `0`, `O`, `I`, `1`, `L`). Code lives at `sessions/{code}`.
2. **Members join** by entering code on the join screen → adds their uid to `sessions/{code}/members/`.
3. **During session** any member can:
   - Add scanned rocks / salvaged hulls (with composition, scan value, location).
   - Edit entries they created.
   - View the running total and per-member split.
4. **Only host can:**
   - Remove members.
   - Edit entries created by others.
   - Set the split formula (equal / by-contribution / custom percentages).
   - Close the session.
5. **On close:**
   - Final splits are computed and written to each member's `users/{uid}/history/`.
   - Session document is marked `status: 'closed'` (not deleted, kept for history).
   - Members can still view it read-only.

### Code generation
Client-side, in a loop with a transactional Firestore check to avoid collisions:
```ts
function generateCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/I/1/L
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
```
Collision probability with ~30 chars × 6 positions is ~7.3 × 10⁸ codes — negligible at our scale, but still check + retry on write.

### Roles
Two roles only:
- `host` — the creator. Exactly one per session.
- `member` — everyone else.

Stored as a field on each entry in `sessions/{code}/members/{uid}`. **Firestore security rules enforce this** (see §10).

### Mining session entry shape
```ts
// sessions/{code}/rocks/{rockId}
{
  rockId: string,
  createdBy: uid,
  createdAt: Timestamp,
  location: string,            // free text: "Aaron Halo, near Crusader"
  rockType: string,            // "Quantanium-class", "Bexalite-class", etc.
  scanValue: number,           // aUEC, optional
  composition: {               // mineral % from scanner
    [mineralId: string]: number,  // e.g., { "quantanium": 28.5, "bexalite": 12.0 }
  },
  notes: string,
  status: 'scanned' | 'mined' | 'refined' | 'sold',
  finalSaleValue: number | null,  // filled in once sold
}
```

### Salvage session entry shape
```ts
// sessions/{code}/salvage/{salvageId}
{
  salvageId: string,
  createdBy: uid,
  createdAt: Timestamp,
  shipType: string,            // "C2 Hercules", etc. (free text or from ship list)
  location: string,
  rmcUnits: number,            // SCU of RMC pulled
  cmUnits: number,             // SCU of Construction Materials
  status: 'scanned' | 'stripped' | 'sold',
  finalSaleValue: number | null,
}
```

### Split calculation
Three modes, host picks per session:
- **Equal** — total ÷ member count.
- **By contribution** — weighted by how many entries each member created. Simple but useful for "whoever did more work earns more."
- **Custom** — host sets % for each member, must sum to 100.

Live split preview should update on the session screen as entries are added.

---

## 8. Other features (detail)

### 8.1 Fleet Tracker

Personal list of owned ships, with optional "share with crew" toggle that exposes the ship to a specific session.

```ts
// users/{uid}/fleet/{shipId}
{
  shipId: string,
  shipName: string,            // model: "Aegis Tiburon"
  customName: string | null,   // "Whiskey Tango Foxtrot"
  manufacturer: string,
  role: 'mining' | 'salvage' | 'cargo' | 'combat' | 'multi' | 'other',
  cargoSCU: number,            // pulled from Wiki API or manual
  acquired: 'standalone' | 'ccu' | 'pack' | 'loaner',
  notes: string,
  sharedInSessions: string[],  // session codes this ship is "in play" for
}
```

Ship data autocomplete is powered by Star Citizen Wiki API v2 (`api.star-citizen.wiki/api/vehicles`). Cache responses in IndexedDB for 7 days.

### 8.2 Trade Route Planner

Pull commodities & prices from UEX. Form inputs:
- Cargo capacity (SCU)
- Starting location (system / planet / station)
- Budget (optional)
- Risk tolerance (avoids contested zones if "low")

Output: top 5 routes by aUEC/hour estimate, with buy/sell locations and current prices.

Cache UEX commodity data per terminal for 1 hour in IndexedDB to stay well under their fair-use limits.

### 8.3 Refinery Job Tracker

```ts
// users/{uid}/refineryJobs/{jobId}
{
  jobId: string,
  station: string,             // "ARC-L1", "HUR-L1", etc.
  method: string,              // "Cormack", "Dinyx Solventation", etc.
  inputs: { [mineralId: string]: number },  // raw SCU per mineral
  expectedOutputs: { [mineralId: string]: number },
  cost: number,                // aUEC paid to refinery
  startedAt: Timestamp,
  completesAt: Timestamp,
  status: 'active' | 'ready' | 'collected' | 'sold',
  finalSaleValue: number | null,
}
```

Refining method data (yield %, time multiplier, cost multiplier) comes from the **Regolith snapshot** (see §11). UEX has some of this too, but Regolith's data is more complete for the niche edge cases.

Active jobs surface a live countdown timer on the dashboard.

### 8.4 Toolbox (Quick-links dashboard)

Static curated grid of external SC tools, each card has icon + name + one-line description + click-to-open. Categories:

**Trade & Economy**
- UEX Corp (uexcorp.space)
- SC Trade Tools (sc-trade.tools)
- Gallog (gallog.co)

**Mining & Industrial**
- Regolith Co. (regolith.rocks — flag as "shutting down June 1 2026")
- CCU Game App (ccugame.app)

**Fleet & Ships**
- CStone Universal Item Finder (finder.cstone.space)
- Erkul DPS Calculator (erkul.games)
- Starship 42 Fleet View (starship42.com/fleetview)
- SPViewer / SC Ships Performances Viewer

**Combat & PvP**
- SnarePlan (quantum interdiction)
- Armory (armory.thespacecoder.space)
- Contested Zone Timers (contestedzonetimers.com)

**Reference & Lore**
- Star Citizen Wiki (starcitizen.tools)
- VerseNavigator (versenavigator.com)
- VerseTime (in-universe clock)

**Keybinds & Controls**
- SCFOCUS Keybinds
- starbinder.space
- HOTAS Helper

**Official**
- RSI Status (status.robertsspaceindustries.com)
- RSI Spectrum
- Galactapedia

Tools are stored as a static `src/data/toolbox.ts` array. **Not in Firestore** — no point burning reads on static reference data.

---

## 9. Firestore data model (full schema)

```
users/{uid}
  ├─ uid, email, displayName, photoURL, handle, createdAt, lastSeenAt
  │
  ├─ fleet/{shipId}              → see §8.1
  ├─ refineryJobs/{jobId}        → see §8.3
  ├─ tradeHistory/{tradeId}      → optional, completed trades from planner
  └─ history/{recordId}          → past closed-session payouts

sessions/{code}
  ├─ code (== doc id), type: 'mining' | 'salvage',
  ├─ hostUid, createdAt, closedAt, status: 'active' | 'closed',
  ├─ splitMode: 'equal' | 'contribution' | 'custom',
  ├─ customSplits: { [uid]: percentage } | null,
  │
  ├─ members/{uid}
  │    └─ uid, displayName, role: 'host' | 'member', joinedAt
  ├─ rocks/{rockId}              → only present for mining sessions
  └─ salvage/{salvageId}         → only present for salvage sessions
```

**Why nested subcollections?** Firestore query limits favor this layout. We never need to query rocks across sessions (that's a session-scoped operation), so subcollections are cheap reads.

---

## 10. Firestore security rules

These rules enforce all the role/permission logic. **No Cloud Functions needed.**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helpers
    function isSignedIn() { return request.auth != null; }
    function isUser(uid)  { return isSignedIn() && request.auth.uid == uid; }
    function isHost(code) {
      return get(/databases/$(database)/documents/sessions/$(code)).data.hostUid == request.auth.uid;
    }
    function isMember(code) {
      return exists(/databases/$(database)/documents/sessions/$(code)/members/$(request.auth.uid));
    }

    // Users own their own data
    match /users/{uid} {
      allow read, write: if isUser(uid);

      match /fleet/{shipId}         { allow read, write: if isUser(uid); }
      match /refineryJobs/{jobId}   { allow read, write: if isUser(uid); }
      match /tradeHistory/{tradeId} { allow read, write: if isUser(uid); }
      match /history/{recordId}     { allow read, write: if isUser(uid); }
    }

    // Sessions
    match /sessions/{code} {
      // Anyone signed in can read a session (needed for join-by-code lookup).
      // Could tighten to "members only" later, but for v1 simplicity wins.
      allow read: if isSignedIn();

      // Only the creator can create (hostUid must == auth uid).
      allow create: if isSignedIn() && request.resource.data.hostUid == request.auth.uid;

      // Only host can update / close.
      allow update: if isHost(code);

      // No deletes — closed sessions stay as history.
      allow delete: if false;

      match /members/{uid} {
        // Anyone signed in can read members.
        allow read: if isSignedIn();
        // Users can add themselves; host can remove anyone.
        allow create: if isUser(uid);
        allow delete: if isUser(uid) || isHost(code);
        allow update: if isHost(code);
      }

      match /rocks/{rockId} {
        allow read: if isMember(code);
        allow create: if isMember(code) && request.resource.data.createdBy == request.auth.uid;
        // Members edit their own; host edits anyone's.
        allow update, delete: if isHost(code) ||
          (isMember(code) && resource.data.createdBy == request.auth.uid);
      }

      match /salvage/{salvageId} {
        allow read: if isMember(code);
        allow create: if isMember(code) && request.resource.data.createdBy == request.auth.uid;
        allow update, delete: if isHost(code) ||
          (isMember(code) && resource.data.createdBy == request.auth.uid);
      }
    }
  }
}
```

---

## 11. Regolith data snapshot

**Regolith.rocks shuts down June 1, 2026.** Before that date, scrape and commit a snapshot to the repo at `/data/regolith-snapshot/`.

### What to snapshot (priority order)
1. **`rock-types.json`** — every rock class/type, expected mineral composition ranges, scan-value formulas.
2. **`mineral-data.json`** — minerals: aUEC/unit base, refining method compatibility, density.
3. **`location-density.json`** — per-location rock spawn rates and mineral biases (Aaron Halo vs. Yela vs. Daymar, etc.).
4. **`refining-methods.json`** — Cormack, Dinyx Solventation, Ferron Exchange, etc., with yield %, cost %, time multiplier per mineral.
5. **`scan-value-formula.md`** — the documented formula Regolith uses for scan-to-actual-value estimation.

### How
Claude Code should write a one-off Node script `scripts/snapshot-regolith.ts` that:
- Fetches relevant Regolith pages (they have a JSON API at `regolith.rocks/api/` per their open-source convention; check `https://regolith.rocks/api/` first, fall back to HTML scraping if no API).
- Saves JSON files into `/data/regolith-snapshot/`.
- Logs a snapshot timestamp into `/data/regolith-snapshot/SNAPSHOT_META.json`.

The script needs to be run **once, before June 1, 2026.** After that, the JSON files just sit in the repo and the app reads them as static imports.

If Regolith has scrape protection or no API endpoint at all, fall back to:
- Using UEX's commodity and refining data for what overlaps.
- Manually populating a smaller curated JSON of just rock-types and refining methods from community-known values.

### How the app uses it
`src/data/regolith.ts` re-exports the JSON files as typed constants. Mining session UI uses `rock-types.json` for autocomplete; refinery tracker uses `refining-methods.json` for yield estimates.

---

## 12. External API integration

### 12.1 UEX Corp API 2.0

- **Base URL:** `https://api.uexcorp.space/2.0/`
- **Auth:** Bearer token (Noah needs to create account at `uexcorp.space`, then "My Apps" → create app → copy access token).
- **Token storage:** **Not in the repo.** Stored in user's Firestore profile at `users/{uid}/settings/apiKeys.uex` so each user supplies their own. (UEX terms favor per-user keys for fair-use accounting.)
- **First-run flow:** if a user hits Trade or Refinery features without a UEX key set, show a one-time onboarding modal: "OpCore uses UEX Corp for live trade prices. Create a free account at uexcorp.space, generate an API token at My Apps, and paste it here. It's stored in your private profile and never shared."

#### Endpoints OpCore uses
| Endpoint | Purpose | Cache TTL |
|---|---|---|
| `GET /commodities` | List of all commodities | 24h |
| `GET /commodities_prices` | Current prices at all terminals | 1h |
| `GET /vehicles` | Ship list for fleet tracker fallback | 24h |
| `GET /terminals` | Buy/sell locations | 24h |
| `GET /planets`, `/moons`, `/cities` | Location reference | 7d |
| `GET /refineries_methods` | Refining methods + multipliers | 7d |
| `GET /refineries_capacities` | Per-station refining capacity | 24h |

All caches stored in IndexedDB via `idb-keyval`. Cache key includes a version string so we can bust everything by bumping the version.

### 12.2 Star Citizen Wiki API v2

- **Base URL:** `https://api.star-citizen.wiki/api/v2/`
- **Auth:** None required for public endpoints.
- **Docs:** `https://docs.star-citizen.wiki`

#### Endpoints OpCore uses
| Endpoint | Purpose | Cache TTL |
|---|---|---|
| `GET /vehicles` | Ship database (autocomplete) | 7d |
| `GET /vehicles/{name}` | Ship details | 7d |
| `GET /manufacturers` | Manufacturer list | 30d |

### 12.3 CORS

Both UEX and Star Citizen Wiki API serve `Access-Control-Allow-Origin: *` (verified at time of writing). No proxy needed.

If a future API doesn't, the workaround is a free Cloudflare Worker as a CORS proxy — but **don't add this preemptively**.

---

## 13. App structure

```
opcore/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── data/
│   └── regolith-snapshot/      ← scraped snapshot, committed to repo
│       ├── rock-types.json
│       ├── mineral-data.json
│       ├── location-density.json
│       ├── refining-methods.json
│       ├── scan-value-formula.md
│       └── SNAPSHOT_META.json
├── public/
│   └── favicon.svg
├── scripts/
│   └── snapshot-regolith.ts    ← one-off, see §11
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── firebase.ts             ← Firebase init, exports auth + db
│   ├── theme/
│   │   ├── globals.css         ← Tailwind base + custom CSS vars
│   │   └── fonts.css           ← @import Google Fonts
│   ├── lib/
│   │   ├── auth.ts             ← Google sign-in, signOut, useAuth hook
│   │   ├── firestore.ts        ← typed helpers for collections
│   │   ├── codes.ts            ← session code generation + validation
│   │   ├── splits.ts           ← split-calculation logic (equal/contrib/custom)
│   │   ├── uex.ts              ← UEX API client with IndexedDB cache
│   │   ├── scwiki.ts           ← SC Wiki API client with IndexedDB cache
│   │   └── cache.ts            ← idb-keyval wrapper with TTL
│   ├── stores/
│   │   ├── authStore.ts        ← Zustand: current user
│   │   ├── sessionStore.ts     ← Zustand: active session subscription
│   │   └── fleetStore.ts       ← Zustand: fleet subscription
│   ├── components/
│   │   ├── ui/                 ← Button, Card, Input, Modal, Tabs, etc.
│   │   ├── layout/
│   │   │   ├── AppShell.tsx    ← shell with nav + content
│   │   │   ├── BottomNav.tsx   ← mobile bottom tabs
│   │   │   └── Sidebar.tsx     ← desktop sidebar
│   │   ├── sessions/
│   │   │   ├── SessionCard.tsx
│   │   │   ├── JoinByCode.tsx
│   │   │   ├── RockEntry.tsx
│   │   │   ├── SalvageEntry.tsx
│   │   │   ├── SplitSummary.tsx
│   │   │   └── MemberList.tsx
│   │   ├── fleet/
│   │   ├── refinery/
│   │   ├── trade/
│   │   └── toolbox/
│   ├── pages/
│   │   ├── Landing.tsx         ← sign-in
│   │   ├── Dashboard.tsx       ← home: active sessions, active refinery jobs, quick stats
│   │   ├── MiningOps.tsx       ← create/join/list mining sessions
│   │   ├── SalvageOps.tsx      ← create/join/list salvage sessions
│   │   ├── SessionView.tsx     ← single-session live view (handles both types)
│   │   ├── Hangar.tsx          ← fleet tracker
│   │   ├── Logistics.tsx       ← trade route planner
│   │   ├── Refinery.tsx        ← refinery job tracker
│   │   ├── Toolbox.tsx         ← quick-links dashboard
│   │   ├── History.tsx         ← past closed sessions + earnings
│   │   └── Settings.tsx        ← UEX API key, handle, sign out
│   └── data/
│       ├── toolbox.ts          ← static external-tool catalog
│       └── regolith.ts         ← re-exports regolith-snapshot JSON
├── .env.example                ← documents required env vars
├── .env.local                  ← Firebase config, NOT committed
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 14. Environment variables

In `.env.local` (gitignored), Vite-style:
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=opcore-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=opcore-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=opcore-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**Firebase API key is safe to expose in the client bundle** (it's a project identifier, not a secret — Firestore security rules protect data). But still keep it out of git so different deploys can use different projects.

For GitHub Actions deploy, set these as repo secrets and inject at build time.

UEX tokens are **per-user**, not env vars.

---

## 15. Setup checklist for Noah

In order:

1. **Create Firebase project** at `console.firebase.google.com`, name it `opcore`.
2. **Enable Authentication → Google provider.** Add `localhost` and `<username>.github.io` to authorized domains.
3. **Enable Firestore** in production mode. Paste the security rules from §10.
4. **Copy Firebase config** from Project Settings → General → Your apps → Web app, into `.env.local`.
5. **Create UEX account** at `uexcorp.space`, then My Apps → create app → save the access token somewhere (Noah will paste it into OpCore Settings on first run).
6. **Create the GitHub repo** `opcore` (private is fine — GH Pages works on private repos for paid plans; if free GH plan, make it public).
7. **Add Firebase config values as GitHub Actions secrets** under repo Settings → Secrets and variables → Actions.
8. **Enable GitHub Pages** under repo Settings → Pages → Source: GitHub Actions.
9. **Run the Regolith snapshot script** (Claude Code will write it) before June 1, 2026.
10. Push → site deploys.

---

## 16. v1 build order for Claude Code

Suggested sequence — each phase should be a working app at the end:

### Phase 1 — Foundation
- Vite + React + TS + Tailwind setup with the theme colors and fonts.
- HashRouter + AppShell with placeholder pages.
- Firebase init, Google sign-in working, user doc auto-created.
- Deploy pipeline green to GitHub Pages.

### Phase 2 — Sessions core
- Mining session create / join by code / list active.
- Member management.
- Rock entry CRUD with role-aware permissions.
- Live split summary (equal mode only).
- Close session → archive to history.

### Phase 3 — Sessions polish
- Salvage sessions (same model, different entry shape).
- Split modes: by-contribution + custom percentages.
- Mobile UX pass on session screen.
- History page with past sessions and earnings totals.

### Phase 4 — UEX integration
- API key onboarding flow.
- IndexedDB cache layer.
- Trade route planner (basic): pick origin + cargo SCU → list top 5 routes.

### Phase 5 — Fleet + Refinery
- Fleet tracker with SC Wiki autocomplete.
- Refinery job tracker with live timers.
- Integrate refinery yield data from Regolith snapshot.

### Phase 6 — Toolbox + Dashboard
- Toolbox quick-links page.
- Dashboard home with at-a-glance: active sessions, refinery jobs nearing completion, recent earnings.

### Phase 7 — Regolith snapshot
- Script to scrape Regolith into `/data/regolith-snapshot/`.
- Hook snapshot data into the mining session UI (rock-type autocomplete, composition templates).
- **Must be done before June 1, 2026.**

---

## 17. Things explicitly OUT of v1

These have come up in conversation but aren't in scope yet — capture them as future ideas:

- Discord login (would push us off Spark plan).
- Real-time presence indicators ("X is online in session").
- Push notifications when refinery jobs complete.
- Mobile app wrapping (PWA install icon is fine; native wrapper isn't worth it).
- Org-level features (multi-crew, sub-orgs).
- Public marketplace.
- AI-assisted trade route suggestions.
- In-app voice chat / chat at all.
- Sharing sessions outside of a code (no public session URLs).

---

## 18. Open decisions deferred to implementation

These are calls Claude Code should make using its judgment during the build, flagging if anything seems off:

- Exact session code length (6 vs 8 chars). Start with 6; bump if collisions feel even remotely possible at scale.
- Whether dashboard countdowns use `setInterval` (simple) or `requestAnimationFrame` (smoother). Start with `setInterval` at 1s.
- Mobile bottom-nav active tab indicator style — pick something tasteful from Radix or Tailwind UI patterns.
- Whether refinery method-yield calc lives in `lib/refinery.ts` or `data/regolith.ts`. Logic in `lib`, raw data in `data`.

---

## 19. Notes & caveats

- This is a fan project, not affiliated with CIG/RSI. Add a footer line in the AppShell: "OpCore is an unofficial fan-made tool. Star Citizen® is © Cloud Imperium Rights LLC."
- UEX data is community-sourced and can have errors. Don't treat it as authoritative for in-game decisions.
- The Spark plan has hard limits. If usage ever spikes (extremely unlikely with <10 users), Firestore will throttle reads/writes. Worst case: degraded UX, never billing.
- Regolith snapshot is best-effort. If their API is closed and HTML scraping fails, fall back gracefully.

---

**End of specification.**
