# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 1 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/Roue Revally clair.dc.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `Roue de fortune Revally` project files (HTML prototypes, assets, components)

---

# Implementation

The design in `project/Roue Revally clair.dc.html` (light theme, the one the user had open) has been implemented
as a real Next.js app, with a back-office for two roles. Everything below this line documents the actual app,
which lives at the repo root (`src/`, `prisma/`, `package.json`, etc.) — the `project/`, `chats/` and the section
above are the original design handoff and are kept for reference only.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4) — one deployable for both the public wheel and the admin back-office.
- **PostgreSQL + Prisma** for data.
- **Custom session auth** — email/password, bcrypt-hashed, signed JWT in an httpOnly cookie (via `jose`). No third-party auth provider.
- **Email sending is stubbed**: the win code email is rendered, logged to the server console, and stored in `EmailLog` so the flow works end-to-end. Wire up a real provider (Resend, SendGrid, Postmark…) in `src/lib/email.ts` when ready — nothing else needs to change.

## What's built

- **Public wheel** (`/r/[slug]`) — pixel recreation of the design's 6 screens (welcome → review → wheel → win/lose → code), with the spin picked server-side (can't be gamed from the browser), a unique `RV-XXXX` code generated and emailed on win, and an opt-in checkbox for marketing consent.
- **Super admin** (`/admin`, role `SUPER_ADMIN`) — global stats across all restaurants, restaurant list, create a restaurant (spins up its wheel with default prizes + its admin login), activate/deactivate a restaurant, per-restaurant detail page (stats, prize editor, settings, participants, CSV export, add extra admin logins).
- **Restaurant admin** (`/dashboard`, role `RESTAURANT_ADMIN`) — their own restaurant's stats (plays, win rate, prizes won, redemption status, emails collected), participants table with a "mark redeemed" toggle, CSV export of collected emails, and a settings page to edit the Google review link, unlock delay, confetti toggle, and the wheel's 4 prizes (the wheel always keeps its 8-slot / 4-winning-slot layout — that's baked into the design's geometry and copy — but each restaurant configures what the 4 prizes are and how likely each slot is).
- Route protection is centralized in `src/proxy.ts` (Next 16's renamed `middleware.ts`): unauthenticated users are bounced to `/login`, and each role is confined to its own section.

## Running it locally

```bash
cp .env.example .env   # then fill in DATABASE_URL / AUTH_SECRET
npm install
npx prisma migrate dev
npm run db:seed        # creates a super admin + a demo restaurant ("Bella Vista"); prints their login credentials once
npm run dev
```

- Super admin: `/admin` (create/manage restaurants from here).
- Restaurant admin: `/dashboard` (the demo restaurant's login is printed by `db:seed`).
- Public wheel for the demo restaurant: `/r/bella-vista`.

`npm run db:seed` only prints credentials the first time it creates each account (it skips accounts that already
exist), so save them when you see them. You can pin them instead of generating random ones via
`SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` / `SEED_DEMO_ADMIN_PASSWORD` env vars before seeding.

In production, generate the QR code from `<APP_URL>/r/<restaurant-slug>` (any QR generator — one isn't built in,
since the wheel URL is just a plain static link) and print it for the restaurant to display.
