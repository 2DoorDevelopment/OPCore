# CLAUDE.md — OPCore

OPCore is a static Star Citizen crew hub: multi-user mining/salvage sessions, fleet tracking, trade routing, and quick-links to the wider SC tool ecosystem. Full project spec lives in `opcore-spec.md`.

## Tech stack

| Layer | Choice |
|---|---|
| Build | Vite 5+ |
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router v6 (HashRouter — required for GH Pages) |
| State | Zustand |
| UI primitives | Radix UI + custom Tailwind components |
| Icons | lucide-react |
| Backend | Firebase (Spark free tier) — Auth + Firestore only, **no Cloud Functions** |
| Auth | Firebase Auth — Google provider only |
| Database | Firestore |
| External APIs | UEX Corp API 2.0, Star Citizen Wiki API v2 |
| Local cache | IndexedDB via `idb-keyval` |

Cloud Functions require the Blaze plan. All logic runs client-side; Firestore security rules enforce permissions.

## Environment variables

In `.env.local` (gitignored):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

See `.env.example` for the full template. UEX API tokens are per-user (stored in Firestore, not env vars).

## Key architectural decisions

- **HashRouter** — avoids 404s on GitHub Pages refresh. Do not switch to BrowserRouter.
- **No Cloud Functions** — all logic is client-side; security is enforced by Firestore rules (`opcore-spec.md §10`).
- **IndexedDB cache** — all external API calls (UEX, SC Wiki) are cached via `src/lib/cache.ts` (TTL-aware idb-keyval wrapper). Respect the TTLs — we're on a free API plan.
- **UEX tokens are per-user** — stored at `users/{uid}/settings/apiKeys.uex` in Firestore. Show onboarding modal if missing.
- **Regolith snapshot** — Regolith.rocks shuts down June 1 2026. Static JSON snapshot lives at `data/regolith-snapshot/`. The app reads this as static imports, never hits Regolith at runtime.

## Source layout

```
src/
  main.tsx / App.tsx / router.tsx
  firebase.ts           — Firebase init, exports auth + db
  theme/                — globals.css (Tailwind), fonts.css
  lib/
    auth.ts             — Google sign-in, useAuth hook
    firestore.ts        — typed Firestore helpers
    codes.ts            — session code generation/validation
    splits.ts           — equal / by-contribution / custom split logic
    uex.ts              — UEX API client with IndexedDB cache
    scwiki.ts           — SC Wiki API client with IndexedDB cache
    cache.ts            — idb-keyval wrapper with TTL support
  stores/
    authStore.ts        — Zustand: current user
    sessionStore.ts     — Zustand: active session (Firestore subscription)
    fleetStore.ts       — Zustand: fleet (Firestore subscription)
  components/
    ui/                 — Button, Card, Input, Modal, Tabs, etc.
    layout/             — AppShell, BottomNav (mobile), Sidebar (desktop)
    sessions/           — SessionCard, JoinByCode, RockEntry, SalvageEntry, SplitSummary, MemberList
    fleet/ refinery/ trade/ toolbox/
  pages/
    Landing.tsx         — sign-in page
    Dashboard.tsx       — home: active sessions, refinery countdowns, quick stats
    MiningOps.tsx       — create/join/list mining sessions
    SalvageOps.tsx      — create/join/list salvage sessions
    SessionView.tsx     — live single-session view (handles both types)
    Hangar.tsx          — fleet tracker
    Logistics.tsx       — trade route planner
    Refinery.tsx        — refinery job tracker
    Toolbox.tsx         — external tools quick-links
    History.tsx         — closed sessions + earnings
    Settings.tsx        — UEX key, handle, sign out
  data/
    toolbox.ts          — static external-tool catalog (not in Firestore)
    regolith.ts         — re-exports regolith-snapshot JSON as typed constants
data/
  regolith-snapshot/    — committed static JSON snapshot of Regolith data
scripts/
  snapshot-regolith.ts  — one-off scraper, run before June 1 2026
```

## Firestore data model (summary)

```
users/{uid}
  fleet/{shipId}
  refineryJobs/{jobId}
  tradeHistory/{tradeId}
  history/{recordId}         — closed-session payouts

sessions/{code}
  members/{uid}
  rocks/{rockId}             — mining sessions only
  salvage/{salvageId}        — salvage sessions only
```

Full security rules are in `opcore-spec.md §10`. Never weaken rules without review.

## Session code generation

6-char alphanumeric, no ambiguous chars (`0 O I 1 L`). Always do a transactional Firestore check for collisions before committing. Charset: `ABCDEFGHJKMNPQRSTUVWXYZ23456789`.

## Split modes

Three modes, host picks per session: `equal`, `contribution` (weighted by entry count), `custom` (host sets % per member, must sum to 100). Logic lives in `src/lib/splits.ts`.

## Theme

Dark mode only — no toggle. Tailwind color tokens: `bg`, `bg-panel`, `bg-elevated`, `border`, `border-bright`, `text`, `text-muted`, `text-dim`, `accent`, `warn`, `danger`, `success`. Fonts: Rajdhani (headings), Inter (body), JetBrains Mono (codes). Full palette in `opcore-spec.md §4`.

## Build & deploy

- `npm run dev` — local dev server
- `npm run build` — production build to `dist/`
- `vite.config.ts` must have `base: '/opcore/'` for GitHub Pages
- GitHub Actions (`.github/workflows/deploy.yml`) deploys `dist/` to `gh-pages` branch on push to `main`

## v1 build phases

1. Foundation — Vite/React/TS/Tailwind/Firebase/auth/deploy pipeline
2. Sessions core — mining create/join/CRUD/split/close
3. Sessions polish — salvage, split modes, history
4. UEX integration — API key flow, cache, trade route planner
5. Fleet + Refinery — SC Wiki autocomplete, refinery timers, Regolith data
6. Toolbox + Dashboard — quick-links, at-a-glance dashboard
7. Regolith snapshot — scraper script + hook data into UI (**before June 1 2026**)

## Out of scope (v1)

Discord login, real-time presence, push notifications, native mobile wrapper, org features, public marketplace, AI trade suggestions, in-app chat.

## External API quick reference

**UEX Corp API 2.0** — `https://api.uexcorp.space/2.0/` — Bearer token (per-user). Endpoints: `/commodities`, `/commodities_prices` (1h cache), `/vehicles`, `/terminals`, `/planets`, `/moons`, `/cities`, `/refineries_methods`, `/refineries_capacities`.

**SC Wiki API v2** — `https://api.star-citizen.wiki/api/v2/` — No auth required. Endpoints: `/vehicles`, `/vehicles/{name}`, `/manufacturers`.

Both APIs serve `Access-Control-Allow-Origin: *` — no proxy needed.

## Misc

- Footer must read: "OpCore is an unofficial fan-made tool. Star Citizen® is © Cloud Imperium Rights LLC."
- Dashboard refinery countdowns: `setInterval` at 1s (not rAF).
- Refinery yield logic in `src/lib/refinery.ts`; raw data in `src/data/regolith.ts`.
- Session cap: 10 participants (host + 9 members) — keeps Firestore reads predictable.
