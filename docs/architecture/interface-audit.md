# Interface Audit — Zeker

**Owner:** Interface & Experience Auditor
**Standard audited against:** `docs/architecture/design.md` (layout, components,
language, accessibility conventions) plus the WCAG 2.1 AA basics named there as
the target.

---

## Entry 1 — 2026-08-31: first real user, first real evidence

**Reviewed:** six findings from the first person outside this session to use the
deployed product (`https://zeker-web-880033266233.us-central1.run.app`).

**Reported fixed by the session — not independently re-verified in a browser by
this role. A hands-on pass is recommended before closing them:**

1. The responsable dropdown showed a blank second option. The label was built
   from first + last name, and an account created by signing up has neither.
2. Revoking was undiscoverable from the permit list: the only action on a row
   was labelled "Código de entrada", and revoke lived only on the permit's own
   screen.
3. No show-password toggle — passwords were typed blind.

**Open:**

4. **Slow load on a phone** (cold start plus 223 KB before the sign-in screen is
   usable). **Verdict: friction, elevated severity.** It lands hardest on the
   guard-at-a-gate case that `design.md` names as the floor for every screen, at
   the moment patience is thinnest. Fix belongs to Software Architect (scale to
   zero) and Frontend Developer (bundle size).
5. **Nothing on the permits screen shows that a permit has already been used.**
   **Verdict: functional block.** No path in the shipped interface answers this
   at all — not a hidden button, not a filter. A stranger cannot get there by
   trying harder. Unlike 1–3, this is not a hidden capability but an absent one:
   the entry-history screen does not exist yet. Recorded as a standing coherence
   gap for a security product whose core promise is traceability; whether and
   when to build it is Product Owner's call.
6. **Interiors do not show their active permits.** **Verdict: friction that
   becomes a block at realistic scale.** A determined user could read the whole
   permit list and cross-reference by apartment. That stops working past a
   handful — and the free tier's own 10 interiors make that the normal case, not
   the edge case.

## Pattern finding

Findings 1, 2 and 3 share one root cause: **a capability existed and worked, but
nothing on screen signalled its state or its presence to a stranger.** Findings 5
and 6 are the same root cause in a different form — a capability that does not
exist yet rather than one that is hidden.

**Prediction:** any screen where backend state changes without a corresponding
visible change is a candidate for the same defect. The building process that
produced these screens optimises for "does this action work when I do it", which
is correct for backend and QA, not for "can a stranger tell that it worked, or
that it is available, without being told."

**Recommended, before the next feature ships:** a targeted pass over every list
and status screen against one question — *can a stranger who has never seen this
system tell what state this is in, right now, without being told?* — rather than
only whether it renders.

**Not verified by this entry:** contrast ratios and screen-reader behaviour
remain unchecked, as already logged in `PROJECT_STATE.md`'s Known Issues. This
role has not yet performed a first pass against those standards either.
