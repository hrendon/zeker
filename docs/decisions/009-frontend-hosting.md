# Decision 009 — The frontend runs on Cloud Run, not Vercel

**Status:** ✅ Accepted
**Date:** 2026-08-31
**Deciders:** Founder (the choice of platform), Software Architect (recommendation and trade-offs, explicitly declined to decide it alone), Security Engineer / CISO (consulted — infrastructure change trigger)
**Supersedes:** the frontend-hosting half of Decision 001, which named Vercel

---

## Context

The product had never run outside the Founder's computer. That single fact was
blocking three separate things at once: the phone camera has never decoded a
real permit, nobody has ever signed in as a guard on the device a guard will
use, and no stranger has ever seen the interface. A browser will not open a
phone camera over an insecure connection, so none of it can be tested until the
product is reachable over HTTPS.

Decision 001 named Vercel for the frontend. At the point of deploying, the
Vercel CLI was not installed on the machine and would need its own separate
sign-in, on top of the two Google sign-ins already required. Firebase Hosting
was also considered and would need a hosting configuration this project does
not have, plus Next.js support that is still not the plain path.

## Decision

The frontend runs on Cloud Run, in the same project and region as the backend,
built from a container the same way. Vercel is not used.

## Why

- **One place to operate.** One sign-in, one platform, one bill, one set of
  logs. For a company of one person, the operational surface matters more than
  the marginal capability of a second vendor.
- **No new vendor** to learn, pay or depend on before there is a single customer.
- **It unblocks everything else today.** The already-authenticated Google CLI is
  enough; adding Vercel adds a step before the camera can be tested at all.

**On latency, the stated reason, a correction is recorded rather than left
standing:** co-locating the frontend with the backend does *not* reduce what a
guard in Bogotá experiences. This app is browser-rendered — twelve screens run
on the client and call the API directly from the phone — so the browser makes
its own trip to the API regardless of where the pages were served from. Placing
them together speeds up server-to-server calls, which this app barely makes.
The decision stands on the operational reasons above, which are real; the
latency reason is not one of them.

## What we give up

Vercel's edge network and its image optimisation, and a preview deployment per
pull request. All real, none of them blocking for an MVP with no customers. If
the frontend later becomes content-heavy or measurably slow to load in Colombia,
this decision is worth revisiting — that is the condition, not a vague "later".

## Consequences

- `frontend/Dockerfile` and `frontend/.dockerignore` added; `next.config.ts`
  now builds a standalone server (`output: 'standalone'`).
- The backend must be deployed **twice**: once to exist and have an address, and
  again once the frontend's address is known, so it will accept requests from it.
  Neither can be configured before the other exists.
- `NEXT_PUBLIC_*` values are compiled into the browser bundle at build time, so
  they are passed as container build arguments, not as runtime variables.

## Predicted Outcome & Indicator

**Predicted:** within one session of deploying, the interface is reachable over
HTTPS from a real phone, and the camera decodes a real permit at a door for the
first time.

**Indicator:** the first check written to `access_events` that originated from a
phone camera rather than a typed code.

**If this does not happen,** the platform choice is not what failed — the
blocker is somewhere else, and this decision should not be blamed or reversed
for it.
