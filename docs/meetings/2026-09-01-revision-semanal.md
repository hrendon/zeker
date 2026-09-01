# Revisión Semanal Zeker — 2026-09-01

**First occurrence.** No previous record existed; `docs/meetings/` did not exist
before today.

**Convened by:** Project Manager / Scrum Master (unfilled — convened by the session)
**Attendees (roles, all active):** Product Owner, Software Architect, Security
Engineer / CISO, QA Engineer, Interface & Experience Auditor
**Not present and material:** Content Strategist / Copywriter (active since
2026-08-31; owns wording for four items below and was not consulted this pass),
UI/UX Designer, Frontend Developer, Backend Developer
**Inputs read:** `PROJECT_STATE.md`, `docs/product/brief.md`, `docs/decisions/`
(010, 011, 006, 007, 008), `docs/security/data-minimization.md`,
`docs/architecture/architecture.md`, `docs/architecture/interface-audit.md`,
`docs/architecture/developer-guide.md`, `firestore.rules`, and the live code.
**Inputs that do not exist** (`meetings.md` §3.1 — each absence is a finding):
previous record, `indicators.md`, `risks.md`, `docs/quality/test-plan.md`,
`docs/security/threat-model.md`, `docs/security/privacy.md`,
`docs/customer-discovery.md`.

**This meeting is a merge.** It absorbs the leadership weekly, the area weeklies,
the project sync, the daily stand-up, the incident review, sprint planning and the
retrospective — see Decision 013.

---

## Decisions

- **D-005 answered by the Founder: one free organization per person.** Recorded in
  full, with its enforcement, its exits and its honest limits, as
  → `docs/decisions/012-one-free-organization.md`.

- **The email action handler moves into Zeker, on the existing Cloud Run host, and
  does not wait for a domain.** Owning role: Software Architect. Consulted:
  Security Engineer, Interface & Experience Auditor, Content Strategist, Product
  Owner. This reverses, for this one surface, `architecture.md`'s standing position
  that password reset sits outside our trust boundary — a position that was
  reasonable when written and stopped being so when Decision 006 routed *every*
  account in the product through that same unowned path. Firebase remains the
  credential authority; Decision 002 is untouched. **The page the user lands on
  becomes ours.**
  *Predicted outcome:* a person tapping a dead link sees Spanish naming what
  happened and a control that sends a fresh one, and we can see in logs that it
  happened. → `docs/decisions/` (to be written), amends `architecture.md`.

- **The two email problems are separated permanently.** "The link is dead when
  tapped" (ours, unblocked, free, no domain needed) and "the email lands in spam"
  (deliverability, blocked on a domain, Founder-held) are tracked and fixed
  separately even though the user experiences them as one failure. Merging them is
  what kept the free fix waiting behind the paid one. → promoted to `decisions/`.

- **No identity profiling to police a free tier** — no device fingerprinting, no
  linking accounts by internet address, no phone verification. Recorded inside
  Decision 012; contradicts nothing less than Decisions 005 and 008's own reasoning.

## Actions

Applied during this session, verified (typecheck clean, 48 frontend tests pass):

- ✅ `auth.languageCode = 'es'` — puts the Firebase email *and* the hosted page into
  Spanish. Closes a live violation of `developer-guide.md`'s rule that no English
  ever reaches the screen. — Frontend
- ✅ `actionCodeSettings.url` on **both** call sites (`recuperar/page.tsx`,
  `personas/page.tsx`) — gives Firebase's page a door back into Zeker. Without it a
  failed link is terminal, because the app's address is a Cloud Run hostname nobody
  types from memory. — Frontend
- ✅ `auth/expired-action-code` and `auth/invalid-action-code` mapped in
  `lib/errors.ts` with new Spanish strings. Without these an expired link rendered
  *"algo salió mal, intente de nuevo"* — untrue, and it sends the person into a
  retry loop against a link that will never work. **Wording to be reviewed by
  Content Strategist / Copywriter.** — Frontend

Open, with owner and date:

- **Run TC-AUTH-RESET-01** — the eight-step reproduction protocol that distinguishes
  a genuinely expired link, a superseded one, a scanner-consumed one, and an in-app
  browser consuming it. QA Engineer wrote it; the Founder executes it on the phone.
  By **2026-09-03**. → `PROJECT_STATE.md`
- **Write `docs/quality/test-plan.md` and `docs/quality/test-cases/`** holding
  TC-AUTH-RESET-01 and TC-PHONE-01 — QA Engineer, before the phone test runs.
- **Build `frontend/app/auth/action/`** handling all three modes, add the Cloud Run
  host to Firebase authorized domains, set the console's custom action URL —
  Frontend Developer, spec from Software Architect. By **2026-09-05**.
- **Enable Data Access audit logs for `identitytoolkit.googleapis.com`** so the next
  occurrence is diagnosable rather than reconstructed from a mailbox — Software
  Architect, by **2026-09-03**.
- **Read the configured reset-code lifetime** and record it as fact — Software
  Architect, by **2026-09-03**. Currently UNKNOWN and load-bearing.
- **Resend control and a visible "aún no ha entrado" state on the people screen** —
  Frontend Developer. Free, today, no domain.
- **Spam wording on the people screen.** The reset screen already says it; the
  people screen — which matters more under Decision 006 — does not. Content
  Strategist / Copywriter.
- **Cap member creation per organization on the free plan** — Backend Developer,
  before the URL is publicised.
- **Rewrite `docs/product/brief.md`** for the residential/business-complex segment,
  to the section-by-section specification produced here — Product Owner.
- **Split the 🔴 Known Issue in two** per the decision above — Software Architect.

## Findings

- **The English page is not a Firebase quirk — it is the visible edge of a recorded
  architectural position.** `architecture.md` declared authentication's last mile
  outside our system. Decision 006 then routed every resident and every guard
  through it. → `architecture.md`
- **The reset link and the "set your password" invitation are the same call with the
  same settings.** Any defect found in one is an onboarding defect for every account
  Decision 006 creates. → `docs/quality/test-plan.md`
- **A reset code lives about an hour; an invitation is opened whenever the invitee
  gets round to it.** Decision 006's onboarding is built on a credential whose
  lifetime is wrong for the job. Not a coding defect — a design mismatch the code
  implements faithfully. → `architecture.md`
- **Four points where the person is left with no next action**, three of them total:
  the English page; an admin-created member whose email is filtered; the
  administrator after inviting anyone; and the "revisa su correo" screen once spam
  has been checked and nothing is there. → `interface-audit.md`
- **Correction to a claim made in this meeting's own briefing:** the spam wording
  *is* present on the reset screen. It is absent from the people screen. The gap is
  narrower and more specific than `PROJECT_STATE.md` records. → `interface-audit.md`
- **Interface Audit Entry 1's prediction came true on a new screen.** It recommended
  a sweep of every screen where backend state changes without a visible change. The
  sweep was not done, and the pattern reappeared on the highest-stakes screen in the
  product. Re-raised, not restated. → `interface-audit.md`
- **The reset email is a shipped interface surface that no role owns and nobody in
  this project has ever read.** It is the first thing a new resident sees. It lives
  outside `strings.ts`, outside `design.md`, and outside every audit to date. Root
  cause: the audit boundary was drawn around our code, and the user's path is not.
  → `interface-audit.md`, `design.md`
- **Nothing anywhere checks `email_verified`.** It is read and passed to the client
  and never enforced. A second free account costs about eight seconds. → security.
- **The org-creation path performs no reads and therefore cannot carry a
  precondition.** It must become a transaction, following `lib/quota.ts`. → security.
- **QA's own artifacts do not exist.** `PROJECT_STATE.md` states a step-by-step
  "exists in the 2026-08-31 consultation"; it was never written to any file. Third
  instance of the project's standing pattern: defined, not recorded. → QA.
- **`brief.md`, rewritten honestly, leaves Zeker with no evidenced market case at
  all** — a Founder decision (010) and eight labelled assumptions. Two of them, A5
  (residents will use the app rather than call the portería or the WhatsApp group)
  and A6 (the model has no recurrence, and a conjunto's most frequent visitor is
  arguably the recurring one), could invalidate everything built. → Product Owner.

## Risks

All route to `docs/business/risks.md`, created today.

- Our own action handler can become an account-enumeration surface if it displays
  the address `verifyPasswordResetCode` returns. Security Engineer signs off before
  merge.
- The action URL is project-global; a fault in the new handler breaks email
  verification and email-change revocation too — paths currently unused, which is
  why a regression would go unnoticed.
- Every account in the product depends on one email channel with no fallback and no
  alerting. Spam is one instance; an outage, a corporate filter or a typo are others
  with the same silence.
- The second-organization block pushes people toward being invited, in a product
  that never checks who runs a building — D-006 unanswered. It moves the exposure
  rather than closing it.
- Running the phone test before sign-in is restored produces a partial result that
  reads like a pass.

## Escalated blockers

- **The Founder cannot sign in.** Every unit requiring verification is stopped
  behind it. *Resolved during this session* by generating a reset link server-side,
  which bypasses email entirely and doubles as the first diagnostic.
- **Exit 3 of the free-organization limit needs a contact channel** — a mailto, a
  WhatsApp number, or nothing. Zeker sends no email of its own. Founder's call.
- **A domain**, re-raised with new information: it unlocks two things, not one — a
  verified sender, *and* the option of sending invitations ourselves with a link
  lifetime chosen for an invitation. → the MBR record, and D-007.

## Parked

- Permit retention. `data-minimization.md` promises one year on revoked
  authorizations; nothing implements it. Returns next weekly, or immediately if a
  customer starts issuing volume.
- Backend-issued invitations through an email service — the structurally correct fix
  for the lifetime mismatch. Unbuildable without a domain. **Returns the moment the
  domain decision is made, not after** — it should shape that decision.
- Revisiting Decision 006's onboarding mechanism itself. Product Owner's call.
  Returns once the cheap fixes show how much of the problem they absorb.
- Whether `admin` becomes a grantable role — would change Decision 012's counting.
- Contrast-ratio measurement and the screen-reader pass. Interface & Experience
  Auditor. Returns after the phone test.
- What a paid plan contains and what it costs. Owner is CCO / VP of Sales, inactive.

## Agreements

- **The entry history's definition of done includes deployed indexes**, proven live
  in a browser for an administrator and for a responsable, with the responsable
  proven unable to see another apartment's entries. Product Owner will not accept
  the unit otherwise. → `requirements.md`, US-007.
- **Proposed process indicator: "declared infrastructure verified live."** Owner
  Software Architect, verifier QA Engineer, target 100%, with a companion measure —
  "declared-but-unverified resources currently outstanding", target 0, checked at
  every Session Close. Both failures to date happened with a fully green suite, so
  this lives at session close against the live project, never inside the test run.
  → `docs/business/indicators.md`.

## Alignment

The board is ordered around one fact rather than around feature appetite: **nobody
could sign in, so nothing could be verified, so nothing else was genuinely next.**

Beyond that, the honest picture: Zeker has a functionally complete product, a
Founder-decided market, and no evidence for that market. The brief rewrite does not
fix that — it makes it legible.
