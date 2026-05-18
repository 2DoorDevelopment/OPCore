# OPCore

A unified Star Citizen crew hub — multi-user mining/salvage sessions, fleet tracking, trade routing, and a curated toolbox of SC resources.

Built as a single static site: free to host, free to run, mobile-first, dark mode only.

## Features (v1)

- **Mining Sessions** — host generates a 6-char code, crew joins, rocks and payouts tracked, splits calculated in real time
- **Salvage Sessions** — same session model for RMC/CM hauls
- **Trade Route Planner** — UEX-powered, finds best routes for your cargo capacity
- **Fleet Tracker** — your owned ships, optional "share with crew" toggle per session
- **Refinery Job Tracker** — active jobs with live countdowns, yield estimates, profit calc
- **Toolbox** — curated quick-links to the wider SC tool ecosystem

## Stack

React 18 + TypeScript · Vite 5 · Tailwind CSS · Zustand · Firebase Auth + Firestore (Spark free tier) · Deployed to GitHub Pages

## Setup

1. Create a Firebase project, enable Google Auth and Firestore, and add your deployment host (for GitHub Pages: `2doordevelopment.github.io`) to Firebase Auth authorized domains. Paste security rules from `opcore-spec.md §10`.
2. Copy your Firebase config into `.env.local` (see `.env.example`).
3. Create a free UEX Corp account and generate an API token — you'll paste it into OpCore Settings on first run.
4. `npm install && npm run dev`

Full setup checklist in `opcore-spec.md §15`.

## Docs

- [`opcore-spec.md`](opcore-spec.md) — complete project specification
- [`CLAUDE.md`](CLAUDE.md) — architecture and conventions reference for Claude Code

## Disclaimer

OpCore is an unofficial fan-made tool. Star Citizen® is © Cloud Imperium Rights LLC.
