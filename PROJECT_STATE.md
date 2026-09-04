# Project State — Zeker

Single source of truth for current progress. Updated at every checkpoint.

**Last updated:** 2026-09-04

**Session closed 2026-09-04. The document that says who we sell to has been
rewritten for the market the Founder chose four days ago, and it now says in
writing that Zeker has no evidence for that market at all. Two domain experts,
asked separately, named the same gap; checking their claim against the code
showed it was half wrong, and the half that was real — a permit that cannot say
"only these days and these hours" — was built the same day on the Founder's
instruction.**

---

# Session 2026-09-04

## Objective

Rewrite `docs/product/brief.md` for the segment Decision 010 chose on 2026-08-31.
The brief still argued schools and daycares. A decision that supersedes a document
does not change the document, and for four days it did not.

## Completed

**The brief is rewritten**, and it is a different kind of document than it was.
Every claim in it is labelled **fact** (observed in the repository or the running
product), **consultant judgement** (field knowledge from a domain role — informed
opinion, not evidence) or **assumption** (believed, untested). There is no fourth
label, because there is no customer evidence to label.

**Two domain consultations were run, separately, and neither role was shown the
other's answer:**

* **Residential Property Administration Consultant** — the conjunto residencial
  half. Named the decision path (administrador executes, consejo approves,
  asamblea above a threshold), what is actually in use at the portería today
  (the handwritten *minuta*, the intercom call, the building's WhatsApp group),
  and the gap below.
* **Physical Security Consultant** — the office and corporate-park half. Named
  the visitor logbook, the retained *cédula*, the call upstairs, and what
  "entries only, never exits" costs a facility manager.

**They reached the same two conclusions independently**, which is the reason
either is worth recording:

1. **The recurring visitor is the bulk of a building's traffic and the product
   cannot express it.** The domestic worker three days a week, the daily
   *domicilio*, the gardener. Without recurrence the resident would issue a fresh
   permit every visit, and will not — so the building keeps handling those people
   the way it does today. **The product covers the occasional visitor, not the
   core.** This is R-08 / assumption A6, raised on 2026-09-01 as a possibility and
   now stated by two domain roles as their expectation.
2. **The person who must operate the product at the gate does not work for the
   customer.** The guard is usually staff of a contracted security firm, rotating,
   with its own procedures and its own log. New — it was not among the eight
   assumptions, and it is now A9 / R-29.

**The eight assumptions exist.** They were named in the weekly review of
2026-09-01 and written down nowhere. A1–A8 are now in the brief, each with what
would validate it and what happens if it is false. A5 and A6 are kept identical to
R-07 and R-08 so the trail holds. A9 and A10 were added by the consultants rather
than renumbering the eight.

**The validation plan is in the brief, decided in advance so it cannot be argued
away later:** test A1 and A3 first; one opening question phrased so politeness
cannot answer it; five to eight conversations; and the specific answer pattern that
means A5 or A6 failed and Decision 010 needs the Founder again.

**`requirements.md` reframed.** Every "As:" line described a school director or a
parent picking up a child. They now name the people who actually use the product.
**Only the actors changed — no acceptance criterion was added, removed or
altered.**

**Four things the old brief claimed that do not exist**, now recorded as not built
rather than as scope: offline validation / installable app (PWA), the reports
dashboard with its chart, an email to anyone when a visitor enters (Decision 007
removed it), and a home screen of the responsable's own.

## Changed

* **Documents** — `docs/product/brief.md` (rewritten), `docs/product/requirements.md`
  (actors reframed), `docs/business/risks.md` (R-29, R-30, R-31),
  `docs/context-index.md`.
* **No code, no data, no deployment.** Nothing shipped today; nothing could break.

## Then, the same day: the days and hours a permit may be used (Decision 016)

The Founder answered D-009 by choosing to **build recurring permits**, against
the recommendation to talk to administrators first. The recommendation is not
withdrawn and the decision is recorded as the Founder's.

**The consultants' claim was checked before anything was designed, and it was
half wrong.** Both had read Decision 007 and neither had seen Decision 014,
which shipped two days earlier:

* A permit could already run **up to a year** with **free entries**. A resident
  never had to issue a fresh permit per visit for the domestic worker.
* What was genuinely missing is narrower — and it is a security hole rather
  than a convenience gap: **a year-long permit with free entries also opens the
  door at 03:00 on a Sunday.** A building could not say *"lunes, miércoles y
  viernes, de 7 a 4"*.

That correction changed the size of the work from "rebuild the permit model" to
one field, and the Founder chose it knowing so.

### Built and tested

* **A permit may carry a weekly schedule** — days of the week and one range of
  hours. Off by default; most permits are for one visit.
* **The organization gained a clock.** An IANA timezone, default Colombia's,
  because "Monday 7 to 4" means nothing without one. Names rather than an
  offset: an offset is right in Colombia and silently an hour wrong in Santiago
  for half the year.
* **The gate refuses with its own reason**, `outside_schedule`, checked
  **before** the entrance — a visitor on the wrong day must never be sent to
  another gate. And the guard is shown *when* the visitor may come back, which
  is the difference between a refusal and a closed door.
* **Nothing that already exists changed.** A permit with no schedule works at
  any hour of any day, and every permit issued before today is in that state.
* **A window may not cross midnight.** A night shift is two permits, and the
  refusal says so instead of only saying no.

### Verified

* **268 backend tests** (was 236), **108 frontend tests** (was 98), typecheck
  and production build: pass.
* The new tests are built so that **reading the time in UTC fails them** — every
  case is chosen at an hour where Bogotá and UTC disagree about the day.
* **Published and driven by hand against production**, revisions
  `zeker-web-00009-z7b` and `zeker-api-00009-gpb`. The Founder signed in; the
  session drove the rest in their browser, on Friday 2026-09-04 between 12:55
  and 13:05 Bogotá time — the hour is recorded because the whole test depends
  on it.
* **TC-016-01 passes, all eight steps.** The permit inside its hours was let in
  at 13:00; the one for 06:00–07:00 was refused with *"Este permiso no sirve a
  esta hora"* **and the line saying when it does serve**; the Saturday permit
  was refused on a Friday; the midnight-crossing schedule was refused at the
  form with the sentence that says to make two permits; and both refusals reach
  the entry history in Spanish.
* **TC-016-02 passes.** A permit created on 2026-09-03 was read straight out of
  Firestore and **has no `schedule` field at all** — not null, absent. At the
  gate it answered with the old rule (*"ya se usó"*), never with the schedule.
  **No door was closed that nobody decided to close.**
* **Read live, not assumed:** `CORS_ORIGINS` present on the running API after
  the publish (R-28), both revisions ready, and the old permit's stored fields.
* **A bonus from the history:** the permit used at 13:00 recorded **one** entry,
  though "Verificar" was pressed twice during the run. Decision 014's
  transaction does what it says.
* **Not verified:** that the hours are the building's and not the reader's
  phone — it needs a phone in another timezone or a building outside Colombia,
  and neither exists. Covered by automated test and by nothing else.

## Open issues

* **A copy question for Content, not a defect.** When the *day* is wrong, the
  gate says *"no sirve a esta hora"*. True in the sense of "not at this moment",
  and the line below names the right day — but a guard in a hurry may check the
  clock instead of the calendar.
* **Two of three checks needed a second press of "Verificar".** Possibly the
  automation's synthetic clicks landing before the screen settles, possibly the
  product. **Cannot be told apart from here**, so it is recorded rather than
  called a defect; a real thumb settles it in TC-PHONE-01.
* **R-29, new and untested:** the gate is staffed by somebody who does not work
  for the buyer, and their employer can close the sale before the product is
  evaluated.
* **R-30, new:** the building's security contract may already own the entry log.
* **R-31, new:** "entries only, never exits" — Decision 008 stands, but its cost
  at the corporate end is now written next to it, and it becomes an explicit
  question in every corporate conversation.
* **There is still nowhere to record a customer conversation.**
  `docs/product/customer-discovery.md` does not exist, and the brief now says it
  is written *before* the first call, not after.
* **`data-minimization.md` still frames its examples around a child being picked
  up.** Security Engineer's artifact, deliberately not touched by a Product Owner
  unit — the rules in it are right, only the examples belong to the old market,
  and one field it describes (`purpose`) already has a known contract mismatch
  with the code.
* **Nothing from 2026-09-03 was closed today.** The Founder's four items (the
  billing report, the budget alert on the billing account, `zeker.com.co`, and
  R-23's five actions) are all untouched and all still the Founder's hands.

## Then: closing the session properly

Three things, none of them product.

* **The image store's cleanup rule is applied.** Keep the three most recent
  versions per service, delete the rest — approved by the Founder after seeing
  the exact list of eight images it would remove. Confirmed live, and confirmed
  **not** in dry-run. **It has deleted nothing yet**: Google runs these on its
  own schedule, and the store still reads 300.9 MB. Recorded as R-32, declared
  and unproven, with its pass/fail line written for the next session — near
  150 MB and six images passes; 300 MB and fourteen fails, and then the rule is
  set and not running, which looks solved and is not.
* **`docs/product/customer-discovery.md` exists**, written **before** the first
  call — which is the only time it can be written honestly. It carries the
  opening question, the order the assumptions are tested in, the sample size,
  and what a "no" looks like, all decided in advance so a "no" cannot later be
  read as a "not quite yet". Its conversation table is empty, and that emptiness
  is the company's entire market evidence.
* **The weekly review ran**, three units late. Decision 013 requires it whenever
  a unit closes; four closed with one review between them. Recorded as a rule
  not being kept, not as a one-off. Its output is the ordered list below.

## Reopened the same day: the Founder ruled out interviews

**D-010, the Founder's:** *"La entrevista a los cinco administradores no es
opción para mí. Quiero que el mercado decida."*

Recorded as theirs, and the recommendation it overrides is left standing rather
than edited away. It is a legitimate position — behavioural evidence instead of
stated preference — and it was said once that it is **more** work, not less, and
almost all of it mine.

**What "let the market decide" actually requires:** that a stranger can find the
product, get in unaided, and that we can see what happened. The third half
exists (`npm run report` counts organizations, permits and entries without ever
printing a name). The other two do not.

### Built: the front door can no longer be used as a mailer (R-02)

Checking the code first turned up something more urgent than the market: **the
application is already public.** It is unadvertised, not private — anyone who
finds the address can sign up, and once inside could make Google send emails to
arbitrary addresses, unmetered, with our project's name on them. Nothing had
happened only because nobody knows we exist, which is precisely the protection
the Founder wants to remove.

**Two limits, because one is not enough:**

* `max_members` (25) — the plan limit. Goes down when somebody is removed.
* `max_invites_per_day` (15) — the abuse control. **Never given back on
  removal.** A cap that only counts current members is defeated by adding twenty
  people and removing them, and those twenty emails have already left.

Both are checked **before** the Firebase account is created, so a refusal leaves
no orphan account and sends nothing. The daily counter resets on the UTC day
boundary, and a counter from another day reads as zero rather than carrying
forward.

**A real bug the tests caught before it shipped:** the first version refused to
let a *full* organization change an existing member's role — trapping the
administrator instead of the abuser. Adding somebody who already has an account
creates nothing and sends nothing, so it now consumes neither allowance.

Nine tests. **276 backend, 110 frontend**, typecheck and production build clean.
The refusal has its own Spanish sentence: *"Ya agregó todas las personas que se
pueden agregar hoy… Puede seguir mañana"* — not "demasiados intentos", which
would send an administrator looking for a mistake they did not make.

### Decided: how the domain attaches, and it costs nothing (Decision 017)

Open since the domain was bought. The obvious path — an external load balancer —
costs **3.6× to 5× the entire monthly ceiling, permanently**. Rejected. Chosen:
**Cloud Run domain mapping**, direct, free, for both services.

**Running the script against the real project found two things that reasoning
about it would not have:**

1. **Google refuses to map a domain that is not verified for the account.** That
   step appears in no document in this repository, and it would have shown up
   for the first time in the middle of the sitting where the domain was meant to
   go live. It is the Founder's hands, once, and it lasts forever.
2. **Our own guard lied.** The script's DNS check reported "✅ resolves" for a
   domain that does not exist, because `nslookup` exits 0 on NXDOMAIN. **The
   same shape as R-27** — a check that passes when the thing it checks is
   absent. Fixed to read the answer instead of the exit code.

`scripts/conectar-dominio.sh` now stops on either condition with the steps
written out in Spanish, and ends by naming the three lists that must learn the
new address in the same sitting (R-25, R-26, R-28) or the product breaks in the
two ways it has already broken.

**Still blocked on the Founder:** `zeker.com.co` has no nameservers. Confirmed
again today.

## Then: a person approves each building (D-006 answered, Decision 018)

**D-006 had been open since 2026-08-27** — the oldest question in the queue, and
the one attached to the project's most serious risk. The Founder answered it on
2026-09-04: **a person approves each new building.**

It had to be answered today because the Founder's other decision removed the
only control there was. R-01's mitigation, in writing, was *"the URL is
unpublicised"* — security by obscurity on a public deployment. "Let the market
decide" is a decision to publicise it.

### The boundary, and it is the whole decision

An unapproved building can do **everything that concerns only its creator**:
create the organization, add entrances, add interiors, look around.

It cannot do anything that puts **a third person's data into the system**: no
member (which makes Google send that address an email carrying our name), and no
permit (which stores a real visitor's name).

**The line is not "can the product be used". It is "can data about somebody
other than the account holder enter it".** A stranger setting up a fictional
building alone is harmless and reversible. A stranger collecting a real
building's residents and visitors is what R-01 describes.

### Built

* `orgs/{orgId}` gains `approved`. **Absent means approved**, so nothing that
  exists today changed — proven by the fact that all 276 existing tests kept
  passing before a single new one was written.
* One middleware, mounted on exactly two routes. Its own error code, because an
  administrator told *"no tiene permiso"* goes looking for a role they already
  hold.
* **Approval is an operator script, never a route** (`npm run aprobar`). A route
  that could approve any customer's organization would be a privileged role
  living inside the product, and since Decision 004 the backend's own membership
  check is the only wall there is. The script reads Firestore as whoever runs
  it, governed by Google IAM — there is no account to steal and nothing to
  revoke inside Zeker. It prints what is needed to decide and **never a
  resident's name, a visitor's name or a permit code**.
* The screens say what is happening and what can be done meanwhile, and
  **deliberately do not promise an email**: Zeker sends none of its own, and a
  screen that says *"le avisamos"* lies.

**283 backend tests** (was 276), 110 frontend, typecheck and production build
clean. Run against production: the script answers correctly with nothing
pending.

### The gap this leaves, named rather than discovered later

**An unapproved administrator has no way to reach us.** Zeker sends no email,
D-008 is unanswered, and the domain that would give us an address does not
resolve. That is the interface audit's "left with no next action" failure, made
on purpose, with the alternative being worse. It is now a prerequisite rather
than a small copy question.

## Session close — 2026-09-04

### The one thing worth carrying forward

**Checking the consultants' claim against the code before building saved weeks.**
Two domain roles, asked separately, both said the product could not express a
recurring visitor. Both had read Decision 007 and neither had seen Decision 014,
from two days earlier. Most of it already existed; what was missing was the
schedule. **The general rule is not about those two roles — it is that an expert
opinion about our own product gets verified against the code before anyone acts
on it**, exactly the way declared infrastructure gets verified against live
infrastructure.

### Next

1. **Five to eight conversations with building administrators.** The script, the
   order and the stop condition are written. Seventeen days of building, zero
   conversations, and now something concrete to show. **Founder's hours; nothing
   else substitutes for them.**
2. **The Founder's console items, and the last excuse is gone:** the billing
   report by SKU with credits shown, and the budget alert on the **billing
   account** — the currency question that blocked it is answered, the amount is
   **20,000 COP** and the warning **5,000**. Then `zeker.com.co` in Cloudflare.
3. **Confirm the cleanup rule actually deleted something**, against its written
   pass/fail line.
4. Two copy questions for Content: the gate saying "a esta hora" when the *day*
   is wrong, and "Este permiso ya terminó" on a permit that was used.

---

# Session 2026-09-03

## Session close — 2026-09-03

### Objective

Close Decision 014, which had been built the day before and never driven by a
person. The session went further than that on the Founder's direction: Decision
015 and the entry history were also built, published and hand-run.

### Completed

Three units closed, each published and driven by hand against production:

* **Decision 014** — a permit is used once or many times, chosen when issuing;
  the permit counts its own entries; "ya se usó" is a named refusal.
* **Decision 015** — four fixed reasons a guard taps after a check, no free
  text; "el visitante no entró" gives a one-entry permit back within ten
  minutes (the Founder's number).
* **The entry history (US-007)** — what happened at the doors, with a date
  range and "solo los rechazados". An administrator sees the organization; a
  responsable sees only their own interiors; a guard cannot open it at all.

### Changed

* **Code** — `POST /orgs/{orgId}/validate/{eventId}/nota`,
  `GET /orgs/{orgId}/events`, the gate's four-reason panel, the history screen,
  `lib/history.ts`, `lib/navigation.ts`, `lib/interiors.ts`.
* **Data** — permits gained `entry_returns`; events gained `note`,
  `about_event_id`, `entry_returned`, and `action: "note"`.
* **Configuration** — `CORS_ORIGINS` now lives in `scripts/desplegar.sh`; the
  script names one address instead of two.
* **Database** — three composite indexes on `access_events`, deployed and
  confirmed `READY` **before** the query that needs them was written.
* **Deployment** — four publishes. Live: `zeker-web-00008-4lt`,
  `zeker-api-00008-ksl`.
* **Tests** — backend 198 → 236, frontend 66 → 98.
* **Test double** — `fakeFirestore` can now order by a timestamp (it silently
  could not), supports `in` with Firestore's real 30-value cap, and has a
  positional `startAfter`. Made **more faithful**, never more permissive.
* **Documentation** — `docs/delivery/manual-test-cases.md` created;
  `api.md`, `data-model.md`, US-007's acceptance criteria, `risks.md`,
  `vendors.md`, `context-index.md` updated.

### Decisions taken

* **Ten minutes** is the window for giving a burned permit back — the Founder's
  number, chosen as the line between fixing a mistake at the gate and
  re-opening a credential later.
* **The history's first version filters by date and by refusal only.** Filtering
  by entrance and jumping from a permit to its history were deliberately left
  out: each is another index to deploy and prove. Founder's choice.
* **Not restoring `LOG_LEVEL=debug`**, erased by a publish. The code's declared
  default is `info`; debug writes far more log, and logs are read by more people
  than permits are. Reversible on request.
* **Buy no further domain until a customer outside Colombia exists.**

### Requirements

* **US-007 rewritten.** It carried the school framing Decision 010 superseded,
  and said nothing about the responsable isolation, the guard exclusion, or the
  indexes being deployed rather than declared.
* **TC-AUTH-RESET-01 and TC-PHONE-01 had been cited since 2026-09-01 and
  existed nowhere.** They exist now.

### Verification

* 236 backend tests, 98 frontend tests, typecheck and production build: pass.
* **By hand, against production:** TC-014-01/02/03 (all steps), TC-015-01 (all
  applicable steps), TC-HIST-01 (six of seven).
* **By the Founder's own hands:** the responsable isolation — signed in as the
  responsable of apartment 202 and saw *"Todavía no ha entrado nadie"* while
  eleven events existed on apartment 101.
* **Read live, not assumed:** six indexes `READY`; `CORS_ORIGINS` present on the
  running revision after each publish; roles and interior assignments read
  straight from Firestore before the isolation step was run.
* **Not verified:** the ten-minute window (covered by test, would need ten
  minutes at a screen); a guard being unable to open the history (covered by
  test — no security account exists); the "asignado, sin nombre registrado" fix
  (deployed and tested, **not yet seen in a browser**).

### Open issues

* **R-28, new.** A publish erases any API setting not declared in the deploy
  script. Fixed for `CORS_ORIGINS` and proved over three later publishes.
  **Nothing checks that the script's list is complete.**
* **R-23/R-24 untouched.** This laptop still holds a standing grant to
  production. Five actions, the Founder's hands. Deferred by the Founder today.
* **The money.** The US$300 credit expires **2026-11-17** and is shared. The
  billing report by SKU has still never been read, and the budget alert is still
  not on the billing account.
* **`zeker.com.co` still does not resolve.** Bought at Cloudflare Registrar, so
  the whole fix happens in one place.
* **A product observation, not a defect.** The Founder could not tell a
  responsable's account from an administrator's at a glance — four tabs out of
  six, on similar-looking screens. If the person who owns the product cannot
  see the difference, a customer will not either.
* Copy: a spent permit says *"Este permiso ya terminó"*, which reads as expired
  rather than used.

### Next

1. The Founder's hands, with a deadline: the billing report, the budget alert
   on the **billing account**, and `zeker.com.co` in Cloudflare.
2. See the "asignado, sin nombre registrado" fix in a browser.
3. The brief rewrite — after it, Zeker has no evidenced market case at all.
4. R-23's five actions, when the Founder chooses.

### Knowledge updated

`PROJECT_STATE.md`, `docs/delivery/manual-test-cases.md`,
`docs/architecture/api.md`, `docs/architecture/data-model.md`,
`docs/product/requirements.md`, `docs/business/risks.md`,
`docs/business/vendors.md`, `docs/context-index.md`, `scripts/desplegar.sh`.

**A new session can continue from `PROJECT_STATE.md` alone.** Nothing needed
tomorrow lives only in today's conversation.

---

## Objective

Close Decision 014: publish what had been built on 2026-09-02 and drive it by
hand in a real browser. Nothing else was to start before that closed.

## What happened

**Decision 014 works, and a person proved it.** Three hand-run cases, all pass:
a one-entry permit is spent by being used and says so; a free-entries permit
keeps working and counts; a permit issued before the decision keeps the rule it
was issued under. The refusal at the gate reads word for word what was written
in advance: *"Este permiso era para una sola entrada y ya se usó. Pídale al
residente que haga uno nuevo."*

**Publishing broke the whole product for a few minutes, and it was not the
Decision.** `scripts/desplegar.sh` uses `--set-env-vars`, which replaces every
value rather than adding one. The API's list of browser origins
(`CORS_ORIGINS`) had been set by hand in the console and **was never in the
repository**, so a routine publish erased it. Every screen that reads data
died, showing *"revise su conexión a internet"* — which sends a person to look
for the fault in their own network.

| Revision | Allowed origins |
|---|---|
| Before (`zeker-api-00003-nks`) | `https://zeker-web-880033266233.us-central1.run.app` |
| What the publish produced (`00004-ncm`) | **empty** |
| After the fix (`00005-ml2`) | restored, and now declared in the script |

**This is the fourth time in three days the same shape of failure has appeared:
a setting that lives in exactly one place no process respects.** R-25 (two
Cloud Run addresses, one on the key), R-26 (a second Firebase permission list),
and now R-28. Recorded as **R-28**, and the fix is not the value — it is that
the value is in the repository.

**The Founder found a real interface defect within a minute of signing in:**
Edge draws its own eye icon inside a password field and it lands on top of our
"Mostrar la contraseña" button. Reproduced and fixed, with the before and after
both photographed in the same browser.

## What was built or fixed

* **`CORS_ORIGINS` now lives in `scripts/desplegar.sh`**, with a comment saying
  what it broke and why it is there.
* **The deploy script names one address**, the canonical one. It was printing
  the second Cloud Run address — the one nobody should bookmark, and the shape
  of R-25.
* **`docs/delivery/manual-test-cases.md` exists.** `TC-AUTH-RESET-01` and
  `TC-PHONE-01` had been named in the state file and a meeting record since
  2026-09-01 and **were never written anywhere**. The file now holds them, plus
  TC-014-01/02/03 with their pass/fail lines and a run log.
* **Edge's native password reveal is hidden** so our own labelled button is the
  only control.

## Verified, and how

* 198 backend tests, 66 frontend tests, typecheck and production build: pass.
* **By hand, in a real browser, against production:** TC-014-01, TC-014-02 and
  TC-014-03, every step, recorded step by step in
  `docs/delivery/manual-test-cases.md` with screenshots.
* **The CORS fix was proved the way the failure was found** — the same request
  from the same origin, before and after: the `access-control-allow-origin`
  header absent, then present.
* **The icon fix was proved by removing it again**: the icon reappears without
  the rule and is gone with it, same browser, same eight typed characters.

## Then, the same day: Decision 015

**The hole Decision 014 left open on purpose was open in production for about
five hours.** A one-entry permit checked by mistake stayed spent, and the person
at the gate could not come back. Decision 015 closes it, and it is live and
driven by hand.

**What a guard can now do, and what they deliberately cannot.** After any check
the screen offers four fixed reasons — *el visitante no entró*, *lo envié a otra
entrada*, *dijo que vuelve más tarde*, *pedí confirmación al residente*. There
is **no text box**, and that is the decision rather than an omission: what lands
in a free field at a real gate is document numbers, phone numbers and
descriptions of third parties who consented to nothing, which this project has
now refused four times. A closed list is also the only version an administrator
can count.

**"El visitante no entró" gives the entry back within ten minutes** — the
Founder's number, chosen as the line between fixing a mistake with the person
still at the gate and re-opening a credential later.

**A note is a new record pointing at the check, never an edit.** Nothing here
updates an access event once written, and that is not a detail: a log that can
be edited is not evidence. The note inherits the check's own expiry exactly, so
the two can never become half a history.

**The permit now says which of two different things happened.** "Todavía no se
ha usado" and "El visitante no llegó a entrar" are not the same fact, and an
administrator asked for exactly that difference (Decision 015's fourth
consequence). Until the entry history exists, the permit detail is the only
place anybody can read it.

**Two design calls worth naming**, both made while building and both verified:

* **"El visitante no entró" does not appear under a refusal.** It would ask the
  guard to record what the screen just said, and there would be no entry to give
  back. Confirmed by hand: a refused check offers three options, not four.
* **The panel closes after one tap**, so a guard cannot record twice. The
  server refuses a second note as well, but that path cannot be reached from one
  screen — it exists for two guards on two phones. The hand-run test was
  corrected to say so rather than to describe a step nobody can perform.

**Verified by hand, against production** (`zeker-web-00006-chq`,
`zeker-api-00006-2xj`): TC-015-01, every applicable step, in
`docs/delivery/manual-test-cases.md`. The step the unit exists for — a permit
that said "ya se usó" saying "puede entrar" again — is photographed.

**Not verified by hand:** the ten-minute window, which would mean waiting ten
minutes at the screen. Covered by automated test in both directions, and
recorded as not hand-tested rather than as tested.

**R-28's fix held its first real test.** This deploy carried `CORS_ORIGINS`
through, because it now lives in the deploy script. Proved by a real deploy, not
reasoned about.

## Then: the entry history (US-007)

**Built, published and partly proven by hand.** What happened at the doors,
newest first, with a date range and a "solo los rechazados" switch — the
smaller filter set the Founder chose, because every filter is another index
that must be deployed and proved.

**The indexes were deployed and read back `READY` before the query was
written.** That is the opposite order to the three times this project shipped
an index declared and never deployed, every time with a green suite (R-16). Six
composite indexes are now live, confirmed with `gcloud`.

**Who may read it is the design, not a setting.** An administrator sees the
whole organization; a responsable sees only their own interiors, scoped **in
the query** rather than filtered afterwards; **security staff cannot open it at
all** — no tab, and the API refuses them. Whoever can read who came into which
apartment, at what time, for ninety days holds exactly what Decision 007 kept
out of a guard's hands.

**Verified by hand against production** (`zeker-web-00007-sxd`,
`zeker-api-00007-mdz`), five of seven steps of TC-HIST-01: the list and its
ordering, a refusal naming which refusal it was, the date range (including the
same day in both boxes, which is where this kind of filter breaks), "solo los
rechazados", and a guard's note appearing under the check it corrects. The
audit trail now reads as a sentence: *"El portero anotó: El visitante no entró
· Se le devolvió la entrada."*

**Step C passed, and the Founder ran it.** They signed in as `Vecina Prueba`,
responsable of interior `202`, and the entry history said **"Todavía no ha
entrado nadie."** while **eleven events existed on interior 101**, one apartment
away. Not a filtered list — nothing. The *Personas* and *Portería* tabs were
absent too. This is the criterion Product Owner set for accepting the unit, and
it is now met by a person doing the thing.

The data behind it was read from production **before** the step was run, so the
result could not depend on what a screen said: Vecina Prueba's role is
`responsable`, 101 belongs to the Founder, 202 to her, and the eleven events are
all on 101.

**Step D — a guard cannot open it — is covered by test, not by hand**, and is
recorded that way rather than counted as a pass. No security account exists in
this organization and creating one costs another email and another password.
Four frontend tests assert a guard's tab list is exactly `["gate"]`; a backend
test asserts the API answers 403.

**A false alarm worth keeping.** The Founder first reported that the test
account "has the same profiles and permissions as the normal one". Everything
stopped and the role was read straight from the database before anything was
touched. It was correct. What they had seen was an account that enters the same
organization and shows similar-looking screens — four tabs out of six. **The
difference that matters is not visible at a glance, and that is a product
observation, not a mistake**: if the person who owns the product cannot tell a
resident's account from an administrator's at a glance, a customer will not
either.

**A real defect found while checking it, and fixed.** The interiors screen
showed *"Responsable: sin asignar"* for apartment 101, which does have a
responsable — the Founder. It decided from the **name** instead of from the
assignment, and the Founder's own account has no name recorded. An
administrator reading that would think the apartment was unclaimed and hand it
to somebody else. The rule moved to `frontend/lib/interiors.ts` with five
tests; an assigned interior whose person has no name now says so.

**A side effect worth recording:** creating that member showed the people
screen of 2026-09-02 working for the first time — "Aún no ha entrado" appeared
for a person who has an account but no password. Built that day, never seen
alive until now.

**`tabsFor` moved to `frontend/lib/navigation.ts`.** It decides whether a guard
is offered the history, and it had no test because it could not have one where
it lived. It is now where this codebase keeps rules it wants to test.

**US-007's acceptance criteria were rewritten.** They carried the school
framing Decision 010 superseded, and said nothing about the responsable
isolation, the guard exclusion, or the indexes being deployed rather than
declared.

## Not done, deliberately

* ~~The icon fix is committed and not published.~~ **Published with Decision
  015**, as planned — it rode with the next unit rather than costing a deploy of
  its own.
* **`LOG_LEVEL=debug` was not restored.** The publish erased it along with
  `CORS_ORIGINS`; the code's declared default is `info`. Debug logging in
  production writes far more log, and logs are read by more people than permits
  are. Say the word and it goes back.
* **Test data left in production**, in the Founder's own organization, with
  obviously fake names: `Prueba 014 Una Entrada` (spent), `Prueba 014 Libres`
  and `Prueba 015 Devolucion` (active until 4 September). None holds anything
  about a real person. They can be revoked on request.

---

# Session 2026-09-02

## Objective

Open the door. The previous session ended with the Founder unable to sign in and
a proved diagnosis; this one was to apply the fix, verify it by hand, and get on
with the people screen.

## What actually happened

**The fix from 2026-09-01 was correct and was not enough.** Two more locks sat
behind it, each producing the same symptom, which is why every partial fix
looked like a failure:

| # | Lock | Found how |
|---|---|---|
| 1 | The browser key never allowed Firebase's own password page | Proved 2026-09-01, applied today: `403` → `400` |
| 2 | Cloud Run answers on **two** addresses; only one was on the key. The canonical one — what the console shows and a person bookmarks — was blocked | The same call from both origins (R-25) |
| 3 | **Firebase keeps a second, different permission list.** Authorized domains held neither address the product runs on, so every request carrying a return address was refused outright | Sending the browser's exact request from a terminal, with and without the return address (R-26) |

The two look-alike permissions were mistaken for one for most of the day. **The
key decides who may call Google; the domain list decides where a person may be
returned to.**

Lock 3 is the one that reached beyond the Founder: **no invitation and no
recovery has ever left this application, for anyone.** Under Decision 006 that
is every resident and every guard.

## The milestone

**The Founder received the email, set a password, signed in, and issued an entry
permit from a phone.** First time end to end in the product's life. R-19 closed
— by a person doing the thing, not by a suite going green.

## The lesson, which is R-19's lesson a second time in two days

**A password request for an address with no account is answered "done" without
checking anything else**, so as not to reveal who has an account. Correct
behaviour, and it means the obvious smoke test is worthless here: the diagnostic
run at 11:20 reported success against a completely broken system. Recorded as
R-27, and written at the top of the script that fixes it.

## What was built

* **The people screen tells having an account from having access.** "Aún no ha
  entrado", a resend for exactly those people, and spam wording that names the
  sender. Unknown stays silent rather than guessing.
* **A blocked origin is now named** instead of "try again in a moment", which is
  what sent the Founder into a retry loop against something impossible.
* **Decision 014, built.** One entry or free entries, chosen when issuing; the
  permit counts its own entries in the same transaction that answers the guard;
  "ya se usó" is a named refusal; the detail screen says whether anybody came in.
* **Three scripts**, because pasted commands broke twice on line wrapping:
  `ver-cuentas.sh`, `arreglar-llave.sh`, `autorizar-dominios.sh`, plus
  `desplegar.sh`.

## Decisions taken (not proposals)

* **014** — a permit is used, and it says so. One entry by default.
* **015** — four fixed reasons a guard touches, never free text; "el visitante
  no entró" gives a one-entry permit back. **Decided, not built.**

## Verification — what actually happened

* 198 backend tests, 66 frontend tests, typecheck and production build: pass.
* **By hand, by the Founder, on a phone:** email received, password set, sign-in,
  permit issued. This is the only verification that closed anything today.
* **By hand, in a real browser, by the AI:** the failure reproduced on the
  blocked address and confirmed absent on the working one.
* **Not verified:** everything built after the door opened — the people screen
  and all of Decision 014. It is committed and **not deployed**.

## Open issues

* Decision 014 is built but has never been driven by a person. `desplegar.sh`
  publishes it.
* Decision 015 is written and not built.
* **R-23/R-24: this laptop holds a standing Google grant to production in the
  Founder's name, and there is no written way to revoke it.** Five actions,
  ~25 minutes, all the Founder's hands. Untouched today.
* R-25 leaves a product question open: **which single address is Zeker's?** Two
  front doors is the condition that produced lock 2.
* The US$300 credit expires 2026-11-17 and the billing report has still not been
  read by SKU.

---

## What the 2026-09-01 session was for

Update the Mantis framework, adopt its new meeting cadence, and answer four
Founder questions. It became something else on the first message: the Founder
could not sign in to their own product.

## The finding that mattered

**Password recovery has never once worked in Zeker.** Not slowly, not
intermittently — never.

On 2026-08-31 the browser API key was restricted to the deployed domain. That was
a correct, real security improvement, and it was recorded as one. But Firebase's
password page runs on a *different* domain, calls Google with that same key, and
is refused — so it renders its generic English *"expired or already used."* The
link was always fine. The permission was not.

**Proved, not inferred.** Same request, same fake code, two origins:

| From | Google's answer |
|---|---|
| The app's own domain | `400 INVALID_OOB_CODE` — the API works |
| Firebase's password page | `403 Requests from referer ... are blocked` |

The key was restricted at `23:49:08`. The Founder's account was created at
`23:51:42` — **2 minutes 34 seconds later.** Sign-in kept working because the
app's own origin was on the list. Only the way back in was not.

**Under Decision 006 this is not a founder inconvenience.** The same call sends
every resident's and every guard's "set your password" email. The product's only
door has been shut since the day before it was first used.

**And no test in this repository could ever have caught it.** 188 backend and 48
frontend tests were green throughout, and would stay green: none of them leaves
the app's own origin. Recorded as risk R-19 — the lesson is not the referrer
list, it is that changing an access control needs a hand-run check of every flow
that crosses an origin boundary.

**Not fixed.** The one-line fix needs console access this session did not have.
It is step 1 of the ordered list below.

## What else this session established

- **The US$300 GCP credit is active, expires 2026-11-17, and is shared with the
  Founder's other projects.** So every "US$0.00" reading until then proves
  nothing — a stack inside Always Free and one billed-then-credited look
  identical and diverge on one day. The budget alert must therefore be set on the
  **billing account**, not this project, or it watches the wrong pool.
- **Finance had no owner for 13 days.** This project's registry gated finance on
  revenue; the framework gates it on the first spend. `budget.md` named an owner
  who had never been appointed. FP&A Manager and Procurement / Vendor Manager are
  now active, FP&A backdated to 2026-08-19.
- **`npm run costs` now exists**, because a role in a document does not read a
  bill. It measures how full each free tier is and says plainly that it is not
  the invoice. First run: Artifact Registry went 107.4 MB → 133.2 MB **after a
  single deploy** — ~5% of the free allowance per deploy, growing with deploy
  count and not with customers.
- **The domain is bought:** `zeker.com.co`, Cloudflare, US$15/year = 25% of the
  ceiling. Registered but not yet resolving — verified from outside as NXDOMAIN,
  which is a setup step, not a fault in the purchase.
- **Two meetings ran for the first time**, with eight roles convened as real
  subagents. Records in `docs/meetings/`.

## Verified, and how

- Typecheck clean; **48 frontend and 188 backend tests pass**.
- The free fixes are **deployed** to `zeker-web` revision `00004-c6h`, and the
  live bundle was downloaded and confirmed to carry them. **They will not be
  visible until step 1 is done** — today the page never gets far enough to show
  a Zeker error at all.
- The API key diagnosis was proved by direct API call, not reasoned about.
- Artifact Registry, KMS versions and the billing-account link were read live.
- **Not verified:** the actual bill, the 2026-08-19 billing alert, and whether
  anything in this stack is truly inside Always Free rather than credited.

## Deployed but unproven

The reset flow still fails for the Founder as of session close. Everything below
assumes step 1 lands; if it does not, the diagnosis was wrong and the session's
central finding needs revisiting.

## Current Milestone

**MVP — Access Management for Physical Spaces**

---

## Current Status

🟢 **The product is visible in a browser for the first time** (Camino B: Build first, validate after)

```
Completed:       A person can be let into this product and use it — set-up,
                 issuing, the door, the way back in. And as of 2026-09-03 a
                 permit that may be used once is used once, and one burned
                 by mistake comes back, and there is a history of it that
                 the neighbour cannot read (236 backend + 98 frontend
                 tests pass)
In Progress:     Nothing. The entry history closed 2026-09-03: six of
                 seven hand-run steps pass, the seventh covered by test
                 and recorded as such
Blocked:         0 · D-006 and D-008 still waiting on the Founder,
                 neither blocking
Critical Risk:   R-23 — losing this laptop is losing control of production.
                 Five actions, ~25 minutes, only the Founder can do them
New Risk:        R-28 — a publish erases any API setting not declared in the
                 deploy script. Fixed for CORS_ORIGINS; nothing checks the rest
Next:            The money and the domain — both the Founder's hands,
                 both with a deadline. Then the brief rewrite
```

**Latest Update (2026-08-30): a guard can now check a permit at a door.**
This is the last piece. From today the product does, end to end, the thing it
exists to do — and it starts keeping the record that a security product is
ultimately bought for. Recorded as Decision 008.

- **One screen, and one answer.** The guard points the phone at the visitor's
  QR, or types the eight characters, and gets a green "Puede entrar" with the
  name, the apartment and how long it lasts — or a red "No puede entrar" that
  says which reason it is.
- **A refusal always says why.** Anulado, vencido, todavía no empieza, no
  existe, or "no es para esta entrada". A guard who is only told "no" cannot
  explain anything to the person standing in front of them, and that turns into
  an argument at the gate. A refusal also still names who was turned away, when
  the code was a real permit.
- **A wrong entrance names the right one**, so the guard can send the visitor
  to the correct gate instead of away.
- ⚠️ **The order the reasons are checked is a safety decision, not a detail.**
  The permit's own state is settled before the entrance is looked at, so a
  permit that was anulado can never produce "try the other gate". Getting that
  backwards would have a guard politely redirecting someone who must not be let
  in anywhere.
- **Every check is written down, allowed or refused.** That record is the audit
  trail the whole product rests on, and it is what makes the next unit — the
  entry history — possible. The record is never edited afterwards: a log that
  can be changed is not evidence.
- **The record keeps as little as it can.** Your call this session: not the
  guard's internet address and not their device. Across every scan of a shift
  those become a location trail of your customer's own staff — something we
  would then have to explain to their lawyer, for an investigation nobody has
  asked for. Nor is the visitor's name copied into it; the permit already holds
  it. A check is deleted after 90 days, or 30 if it was a refusal.
- **A code that opened a door is not copied anywhere.** The characters are kept
  only when they matched nothing at all — then they are the only evidence of
  what someone tried.
- **The camera is a convenience, never the only way in.** The typed field is
  always there. A cracked lens, a refused permission or a dead battery must not
  become a visitor who cannot get in.
- **A guard sees only the gate.** Their tab bar has one tab. They still cannot
  list, see or create permits — that rule from last session is unchanged, and
  this screen keeps it true by answering one code at a time and never listing.
- **Exits are deliberately not recorded**, your call. It doubles the guard's
  work at the gate and nobody has asked for it. The record has room for it.
- ⚠️ **Not verified: a real phone camera.** The QR-reading library was proved to
  decode exactly the QR this product draws, and the typed path was driven by
  hand against the live database — but no camera has yet read a real permit.
  This must happen before a guard uses it.
- ⚠️ **Something is switched off in Google that needs switching on.** Each check
  is stamped with the date it should be deleted, but the rule that actually
  deletes it has not been enabled. Until it is, no check is ever deleted, which
  contradicts what this product promises about keeping data. One command; it is
  in the developer guide and in Known issues.
- ⚠️ **Test data:** the test building has a permit "Prueba Portería" for
  apartment 302, now anulado, and three checks in its history. Delete them
  whenever you like.
- Verified: 188 backend tests, 45 frontend tests, typecheck and production build
  all clean, plus the gate driven by hand in a browser against the live
  database, and the three resulting records read back out of it.

**Found at session close (2026-08-27): a second program was listening on the
API's port** (a WSL forwarder on 3001), answering some requests instead of our
backend and producing confusing failures. Not a fault in our code. How to spot
it and how to work around it is written in the developer guide.

**Latest Update (2026-08-29): a resident can now issue an entry permit, and
the visitor gets a QR code.** This is the half of the product that makes money.
Recorded as Decision 007.

- **Type a name, press one button.** The form arrives already filled in for the
  common case — from this hour, for one day, at the apartment the person is in
  charge of. Creating the permit lands straight on the code, because sending it
  to the visitor is the whole reason for making one.
- **The code is a real credential, and is now treated like one.** The written
  plan would have built it out of the permit's own identifier — visible in the
  web address. Anyone who saw one permit could have worked out the code for
  another. It is now randomly generated, from 32 characters chosen so that a
  guard reading one aloud in bad light cannot produce a different one.
- **A guard who types "O" instead of zero still gets in.** The four letters
  people confuse are folded onto the digits they look like before the code is
  checked. Turning away a visitor who is holding a valid code is a failure of
  ours, not theirs.
- **The QR is drawn on the resident's own phone.** Nothing is sent anywhere and
  no picture is stored. It was proved — not assumed — to contain exactly the
  permit's code.
- **A permit cannot be quietly edited.** To change one you revoke it and issue
  another, so the history says what actually happened. The Spanish label for
  that is *Anular*. Revoking keeps the record: a permit that once opened a door
  is part of the audit trail.
- **Security staff cannot see or create permits.** A guard checks a code that is
  put in front of them; a guard who could list a building's permits would see
  who is expected where, all day.
- ⚠️ **A fault was found that would have arrived at a customer.** Deleting an
  apartment, a site or an organization is refused while a permit is still live.
  As written, "still live" meant "not revoked" — so one permit that finished
  last year would have blocked its apartment for ever, and taken the plan place
  with it. Now a finished permit stops blocking anything.
- ⚠️ **A fault found only by using it: the database was missing three indexes.**
  Every test passed while the real thing failed. The indexes were written down
  in the repository but had never been sent to Google. They are deployed now,
  and the developer guide says that writing one down is not the same as
  deploying it.
- ⚠️ **A second fault found by using it: two buttons meant opposite things.**
  The confirmation asked "¿Cancelar este permiso?" with *Cancelar* (go back)
  next to *Cancelar el permiso* (do it). The action is now *Anular*, everywhere.
- **What is deliberately not built**, all your calls this session: no shareable
  link for the visitor, no daily time window (only from-one-moment-to-another),
  and no email when someone enters. Each is written down in Decision 007 with
  the reason, and marked in the requirements so nobody thinks it exists.
- ⚠️ **Test data:** the test building now has two permits for apartment 302 —
  one live ("Domicilio Rappi"), one revoked. Delete them whenever you like.
- Verified: 166 backend tests, 38 frontend tests, typecheck and production build
  all clean, plus the whole flow driven by hand in a browser against the live
  database.

**Documentation corrected at session close (2026-08-29).** The audit compared
every architecture and security document against the code that now exists:

- `architecture.md` still described a permit holding the visitor's **phone
  number, encrypted** — a field Decision 005 removed on 2026-08-26 and which was
  missed when that decision was recorded. It also listed an endpoint that does
  not exist (`PUT` on a permit), was missing the endpoint that does
  (`GET` one permit), and had never been given the people endpoints built on
  2026-08-28. All corrected.
- `security/data-minimization.md` had no entry for the permit's **code**, which
  is the credential that opens a door, and still listed an optional free-text
  "relationship notes" field on a permit. That field does not exist and will
  not: a free-text box on a permit is where a cédula number eventually gets
  typed.
- The not-yet-built validation and entry-history sections of `api.md` described
  the old permit shape. They are the contract the next unit builds from, so
  they now match what a permit actually is.
- Both remaining "not built" sections of `api.md` are labelled as such, so no
  one builds a screen against them by mistake.

**Previous Update (2026-08-28): a resident can now have a real account, and the
building administrator creates it.** This was the last thing standing between
the product and the part that makes money — entry permits. Your decision this
session, recorded as Decision 006.

- **The administrator adds a person by name, email and role**, and that person
  receives an email to set their own password. Nothing about the password ever
  touches our server.
- **The email problem that made this look expensive did not exist.** Firebase
  sends that email itself, and has done since the password-recovery screen was
  built. Nothing to buy, build or operate. What was estimated at two to three
  days took one session.
- **Nothing new is stored about a resident.** The email lives in Firebase, which
  already holds every user's email. Our database keeps their name and which
  apartment they are in charge of — the same two things it already kept for you.
- **Your rule is enforced: every apartment always has a designated person.** The
  typed name is gone; the administrator picks a real person. When the resident's
  email is not known yet, the administrator can take the apartment themselves
  and hand it over later in one step.
- **Security guards arrive by the same door.** The same screen adds them with a
  different role, so their screens will not need this built a second time.
- **A person can be removed**, which a product about physical access must
  allow. Removal is refused while they are still in charge of an apartment, and
  the message says what to do about it. Their account is never deleted — they
  may belong to another building.
- **An administrator cannot use this screen to find out who else uses Zeker.**
  The answer is identical whether or not that email already had an account. It
  is the same deliberate unhelpfulness as the sign-in and recovery screens.
- ⚠️ **One bug found by using it, not by testing it.** Handing over an apartment
  that had no account yet showed a person in the list but saved nothing, and
  refused with a message that explained nothing. Fixed: the choice now matches
  what the screen shows, and an apartment with nobody attached says
  "sin asignar" instead of leaving a blank.
- ⚠️ **A test resident now exists in Firebase**
  (`residente.prueba@zeker-test.com`) from verifying the flow, and apartment
  302 in "Conjunto Los Cedros" is assigned to her. The domain does not exist,
  so no real person was emailed. Delete both whenever you like.
- Verified: 122 backend tests, 22 frontend tests, typecheck and production build
  all clean, plus the whole flow driven by hand in a browser.

**Previous Update (2026-08-27): a building administrator can now set up their
building from start to finish, in a browser.** Create an organization, add a
site, add apartments with the person in charge of each, and see how much of the
free plan is used. The dead end after signing up is gone.

- **Eight roles reviewed this before a line was written** — product, design,
  architecture, security, implementation, testing, customer validation and
  metrics. Three disagreements between them were resolved, two questions went
  to you, and one new risk was found that nobody had written down (D-006 below).
- **The free plan is visible and enforced.** A bar shows what is used, turns red
  at the limit, and the "add" button disappears rather than letting someone fill
  in a form that will be refused.
- **Deleting and retiring are kept apart on purpose.** Retiring keeps a site and
  its history and keeps using a plan place; deleting frees the place and cannot
  be undone. Both ask for confirmation, and the wording is what separates them.
- **Nothing about a customer is kept in the browser.** Which organization you are
  looking at lives in the web address only. This was a direct security
  requirement: one person can be an administrator of one building and a plain
  member of another, and leftover data must never be painted onto the next one.
- **Two bugs were found by using it, not by testing it.** Opening a page
  directly showed a false "your session ended" — fixed. And refusing to delete a
  site said only "that conflicts with something", which told the administrator
  nothing — it now names the cause and what to do.
- **A resident's account still cannot be linked to their apartment.** The system
  has no way to look up who belongs to an organization, so for now the person in
  charge is a typed name. **This must be built before entry permits**, because
  the plan says a resident issues permits for their own apartment.
- Verified: 16 frontend tests, 102 backend tests, typecheck and production build
  all clean, plus the whole flow driven by hand in a browser.

**Previous Update (2026-08-26): the product can be seen and used in a browser.**
Someone can now create an account, sign in, recover a forgotten password and
sign out — in Spanish, on a phone or a computer. Nothing else is on screen yet;
after signing in they see their name and an empty list of organizations.

- **Everything was tried for real, not just tested.** An account was created
  against live Firebase, the profile was written to the live database, signing
  out was confirmed to end the session on the server, and signing back in
  reused the same profile rather than creating a second one.
- **The Spanish is complete and lives in one file.** No English can reach a
  customer's screen: the API answers with codes, and one file turns each code
  into Spanish. Adding a second language later is one file, not a rewrite.
- **Two deliberate refusals to be helpful, for security.** Signing in never says
  whether the email exists or the password was wrong. Password recovery gives
  the same answer whether or not the account exists. Being more specific would
  let anyone with a list of emails find out who our customers are.
- **Signing out is honest.** If the server cannot end the session, the person is
  told they are still signed in, instead of the screen pretending otherwise.
- ⚠️ **Found and fixed while building:** library versions were not being locked,
  so two builds of the same code could install different versions. Both projects
  now lock them and the production container refuses to build if they disagree.
- ✅ **A gap was closed:** the screen-design document that everything since
  launch has referred to had never been written. It exists now, describing what
  was actually built.
- **A test account exists in Firebase** (`prueba.desarrollo@zeker-test.com`) from
  verifying the flow. Delete it whenever you like — nothing depends on it.
- ⚠️ **Not checked:** the screens were only viewed at desktop width. The layout
  is built phone-first, but no one has looked at it on a real phone.

**Decision 005 recorded (2026-08-26).** A permit will not collect the visitor's
phone number. Your call, made this session. The knock-on effect is larger than
it sounds: that was the last piece of personal data that needed our own
encryption, so **the encryption problem that has been open since 2026-08-21 is
now closed by not holding the data at all** rather than by building anything.

**Previous Update (2026-08-25):** Three blocking decisions answered by the Founder
and recorded. Database access closed.
- ✅ D-002 approved → sign-in happens in the browser with Firebase; our server
  never handles a password. Recorded as Decision 002.
- ✅ D-003 approved → "interiors" become a real level under a location, and plan
  limits move onto the organization. Recorded as Decision 003.
- ✅ D-004 approved and **already built and deployed** → browsers can no longer
  reach the database at all. Recorded as Decision 004.
- ✅ Verified after the change: the backend still reads the live database
  (`/health/ready` → 200), typecheck clean, 12/12 tests pass.
- ⚠️ Found while doing it: the original setup script could never have worked —
  it called a `gcloud` command that has no rules option. The rules are now a
  real file in the repository, deployed with the Firebase CLI.

**Session closed 2026-08-25.** Five units built, six commits, three decisions
recorded and one raised. Documents were audited against the code at close and
corrected — see "Documentation corrected" below.

**Documentation corrected at session close (2026-08-25).** The technical
documents had drifted from what was actually built. Fixed rather than noted:
- `architecture.md` still described sign-in with a password reaching our server,
  browser-side encryption that cannot work, per-role database rules that are not
  deployed, and an endpoint list missing half the product. All corrected, with
  the superseded parts marked as superseded rather than deleted.
- `context-index.md` pointed at four documents that do not exist. They are now
  marked missing, with a note of when each is actually needed.
- `developer-guide.md` now states the isolation rule as a build step, so the
  next person cannot add an endpoint that skips it by accident.
- `role-registry.md` still listed decisions as pending that you approved a week
  ago, plus today's three.

**Interiors built (2026-08-25). The setup half of the product is now complete
on the server, and the offer you approved is buildable and built.**
- Add an apartment, warehouse bay or zone inside a site, each with its number
  and the person in charge. List them, rename, reassign, remove.
- **The 10-interior free limit works, counted the way you specified** — across
  everything the customer has, not per site. The eleventh is refused with a
  message the screens can show in Spanish, and nothing is saved.
- Two people cannot both claim apartment 302 in the same building, even if they
  press save at the exact same moment. The same number is still allowed in a
  different building.
- An interior can be linked to a resident's account, which is what will let
  that resident issue entry permits for their own apartment. The person must
  already belong to the organization.
- An interior cannot be quietly moved to another building — that would drag its
  existing permits along with it.
- Deleting is refused while a permit for it is still active, and frees the slot
  when it succeeds.
- Every create, change and delete is written to the audit trail, as security
  required.
- Five more tests prove another customer cannot see or touch any of it.
- Verified: 102/102 tests pass, typecheck clean, production build clean, all
  five routes answer on a live server.

**Locations built (2026-08-25).** The first half of what you actually sell now
works, limits included.
- Add a site, list them, rename one, take one out of use, delete one.
- **The plan limit is enforced properly.** The free plan allows 1 location. The
  check and the save happen together in one operation, so two requests arriving
  at the same instant cannot both take the last free place. Refusal returns its
  own message type, so the screens can show your Spanish wording rather than a
  generic "not allowed".
- Deleting frees the slot again. Taking a site out of use keeps it and its
  history, and keeps using its slot — those are two different actions on
  purpose.
- Deleting is refused while the site still has interiors or an active permit.
- Security staff can see the list of sites (they need it to check entries), but
  only administrators can change anything.
- Five more tests prove another customer cannot see, create, change or delete
  anything here.
- ⚠️ Found and fixed while building: test-only code was being copied into the
  package we deploy to production, and it referred to a tool that is not
  installed there. Now excluded from the build.
- Verified: 73/73 tests pass, typecheck clean, production build clean, all five
  routes answer correctly on a live server.

**Organizations built (2026-08-25).** Customers are now separate from each
other, and that separation is proven by tests.
- Create an organization, list the ones you belong to, view one, change its
  details, delete it. Creating one makes you its administrator automatically.
- **Six tests prove one customer cannot reach another's data** — cannot read
  it, cannot change it, cannot delete it. This was the mandatory test before
  launch. It now exists and runs on every change.
- Someone who is not a member is told the organization does not exist, rather
  than that they lack permission. Otherwise a stranger could discover which
  customers we have simply by guessing.
- A customer cannot raise their own plan limits — the request is refused.
- Deleting is reversible bookkeeping, not erasure: entry records are an audit
  trail we are required to keep. Deletion is also refused while any permit is
  still active, so an organization cannot vanish out from under a permit that
  would still open a door.
- We store less again: no street address and no organization phone number. For
  a residential building, the address plus an apartment number plus a permit
  would reveal exactly where a named person lives. City and country are enough.
- ⚠️ Found while building: someone could create unlimited free organizations,
  each with its own free allowance. Raised as D-005 — your call, not mine.
- Verified: 49/49 tests pass, typecheck clean, all five routes answer correctly
  on a live server.

**Sign-in endpoints built (2026-08-25).** The account side of the product now
works end to end on the server.
- `POST /auth/session` — called once after the browser signs in. Creates the
  person's profile the first time, refreshes it after. Safe to call repeatedly.
- `GET /auth/me` — who am I, and which organizations do I belong to. This is
  what decides whether the app shows the admin, responsable or security screens.
- `POST /auth/logout` — ends the session on the server, so a stolen session
  cannot be resumed.
- We store **less personal data than the original design asked for**: no email
  address and no phone number in our database. Firebase already holds the email
  and sends it with every request. This also sidesteps the unresolved
  encryption problem, and a test now proves the email is never written.
- Verified: 27/27 tests pass, typecheck clean, and the three routes answered
  correctly on a live server (a fake token is rejected by real Firebase).
- Correction: the plan said these routes would get a strict 5-per-minute limit.
  They did not, on purpose — several staff of one customer share one office
  internet address and would have locked each other out each morning. There is
  no password to guess on this API any more, so the strict limit had no job.

**Previous Update (2026-08-21):** Backend skeleton built and verified.
- ✅ Express + TypeScript app running, compiles clean, 12 tests passing
- ✅ Firestore reached live through ADC (`/health/ready` returns 200)
- ✅ Firebase token verification, uniform error shape, rate limits, request tracing
- ✅ Cloud Run container definition ready (non-root, no source in image)
- ✅ Security fix: service-account key filenames can no longer be committed
- ⚠️ Three design contradictions found — raised as D-002, D-003, D-004

**Previous Update (2026-08-19):** Multi-role dispatch validation completed.
- ✅ Backend Developer: Ready to scaffold (48-hour launch plan)
- ✅ Frontend Developer: Ready to scaffold (component library outlined)
- ✅ Architect: Infrastructure 6/6 complete (rules update flagged Week 2)
- ✅ Product Owner: Prioritization clear (Backend first, 7 critical stories)
- ✅ Security Engineer: ADC approach confirmed secure

---

## Completed

✅ **Product Definition**
- Problem statement: Control access to physical spaces (Locations) via entry authorization
- Organization type (MVP): Locations only (schools with pick-up auth deferred to Phase 2)
- Users identified: Admin, Authorizer, Security personnel
- MVP scope: Locations + Interiors management, entry authorizations (QR), validation, trazabilidad
- Free tier limit: 1 location, 10 interiors max
- Out of scope (MVP): Schools/pick-up auth, recurrence, complex rules, hardware, mobile native

✅ **Architecture & Technology**
- Stack decided: GCP Cloud (Firestore, Cloud Run, Firebase Auth, Vercel)
- Multi-tenancy design: org-level isolation, one admin → multiple orgs
- ~~Encryption strategy: AES-256 at rest~~ — **superseded by Decisions 002 and 005** (2026-09-01 cleanup). TLS in transit stands. Nothing in the MVP needs our own encryption: the API never sees a password (002) and no phone number is collected (005). The KMS key is kept, unused
- PWA: Yes (for offline read capability)

✅ **Security & Compliance**
- Data minimization rules written
- Never store: IDs, photos, biometrics, addresses
- ~~Encrypt: Emails, phone numbers~~ — **never built, and correctly so.** Decisions 002 and 005 removed the need. Corrected 2026-09-01; it had read as completed work since 2026-08-26
- Retention: 90 days events, 1 year auth records
- Compliance target: Ley 1581/2016 (Colombia)

✅ **Backend Skeleton** (2026-08-21)
- Express 5 + TypeScript app, strict compile, ESM build to `backend/dist/`
- Configuration validated at startup — the app refuses to run half-configured
- Firebase Admin SDK wired through Application Default Credentials (no key file)
- `requireAuth`: verifies Firebase ID tokens, rejects revoked sessions immediately
- Single error handler producing the documented `{ error, message, request_id }` shape
- Request tracing (`X-Request-Id`), structured logs shaped for Google Cloud Logging
- Rate limits per `api.md` (5/min auth, 100/min validate, 60/min general)
- `GET /health` and `GET /health/ready` (real Firestore round trip)
- Dockerfile for Cloud Run: two-stage, non-root, no compiler or source in the image
- Verified: `npm run typecheck` clean · `npm test` 12/12 pass · live 200 from Firestore

✅ **Interiors + plan quotas** (2026-08-25)
- `POST/GET /orgs/{orgId}/interiors`, `GET/PUT/DELETE .../{interiorId}`
- 10-interior limit counted org-wide, not per location, enforced in a transaction
- Number unique per location, checked in the same transaction
- Optional link to a resident's account (must be a member) for US-003
- `location_id` immutable; delete refused while a permit is active; delete frees the slot
- Audit trail entry on every create, change and delete
- Verified: 102/102 tests pass · typecheck clean · production build clean

✅ **Locations** (2026-08-25)
- `POST/GET /orgs/{orgId}/locations`, `GET/PUT/DELETE .../{locationId}`
- Plan limit enforced inside a transaction; refusal is `quota_exceeded` (403)
- Delete frees the slot; `enabled: false` retires a location without freeing it
- Delete refused while interiors or active authorizations still reference it
- Any member can list; only admins can create, change or delete
- No staff name, floor or building stored
- Verified: 73/73 tests pass · typecheck clean · production build clean

✅ **Organizations** (2026-08-25)
- `POST /orgs`, `GET /orgs`, `GET/PUT/DELETE /orgs/{orgId}`
- Membership check on every org-scoped route; non-members get 404, not 403
- Six tests prove one customer cannot reach another's data
- Plan limits attached at creation (free = 1 location, 10 interiors)
- Customers cannot change their own plan, limits or usage counters
- Soft delete, refused while any authorization is still active
- No street address and no organization phone stored
- Verified: 49/49 tests pass · typecheck clean · live routes answer correctly

✅ **Sign-in endpoints** (2026-08-25)
- `POST /auth/session`, `GET /auth/me`, `POST /auth/logout` (Decision 002)
- The API never accepts a password; sign-in happens in the browser at Firebase
- User profile stores no email and no phone — Firebase holds the email, and it
  arrives verified with every request
- Role is per organization, not global (one person can run several orgs)
- Verified: 27/27 tests pass · typecheck clean · live routes answer correctly

✅ **Setup screens — a customer can set up their building** (2026-08-27)
- `/inicio` lists your organizations and is also how you switch between them
- `/organizaciones/nueva` creates one; whoever creates it becomes its admin
- `/organizaciones/{id}/sedes` — list, add, rename, retire, reactivate, delete
- `/organizaciones/{id}/interiores` — the same, plus the person in charge, with
  a filter by site once there is more than one
- Plan usage shown as a bar and in words; at the limit the add button is removed
  rather than letting someone fill in a form that will be refused
- Refusals say what to do: hitting the plan limit, deleting a site that still
  has apartments, and reusing an apartment number each have their own message
- Which organization you are viewing lives in the web address only. Nothing
  about a customer is stored in the browser, so switching cannot leak
- Only admins see the create, change and delete actions; other members see a
  read-only list and a line explaining why
- Guessing an organization address shows "not found", never "not allowed"
- Verified: 16/16 frontend tests · typecheck clean · production build clean ·
  the whole flow driven by hand in a browser against the live database

✅ **Account screens — the first thing anyone sees** (2026-08-26)
- Next.js app in `frontend/`, Spanish, phone-first, four screens: `/entrar`,
  `/crear-cuenta`, `/recuperar`, `/inicio`
- Sign-in happens in the browser against Firebase; our API never sees a password
  (Decision 002). `POST /auth/session` runs once after sign-in
- Signing out calls the server first; if that fails the person is told they are
  still signed in rather than shown a fake success
- Sign-in and password recovery never reveal whether an account exists
- All user text in `lib/strings.ts`; all API error codes turned into Spanish in
  `lib/errors.ts` — no English can reach a customer's screen
- Verified in a real browser: account created, profile written to the live
  database (201), signed out (200), signed back in reusing the same profile
  (200), and no email address written to our server logs
- Verified: 9/9 frontend tests pass · typecheck clean · production build clean

✅ **Screen design recorded** (2026-08-26)
- `docs/architecture/design.md` — who uses the product and on what, the layout,
  the five interface pieces, touch sizes, colour, how waiting and failing are
  shown, accessibility, and the two sign-in rules that are security rather than
  design. Written from what was built, not as a wish list.

✅ **Library versions locked** (2026-08-26)
- `package-lock.json` is now kept in version control for both projects
- The production container installs with `npm ci`, which fails if the lockfile
  and the package list disagree, instead of quietly resolving newer versions

✅ **Documentation**
- `docs/architecture/design.md` — how the screens look and behave
- `docs/architecture/developer-guide.md` — how to run, test, and deploy
- `docs/product/brief.md` — what we build
- `docs/product/requirements.md` — 10 user stories
- `docs/architecture/architecture.md` — full technical spec
- `docs/architecture/data-model.md` — Firestore schema
- `docs/security/data-minimization.md` — security policy
- `docs/decisions/001-freemium-gcp-stack.md` — why GCP
- `docs/decisions/002-client-side-firebase-auth.md` — how users sign in
- `docs/decisions/003-interiors-and-plan-quotas.md` — interiors and plan limits
- `docs/decisions/004-backend-only-firestore-access.md` — who can reach the database
- `docs/decisions/005-no-visitor-phone-number.md` — a permit holds no phone number
- `firestore.rules` — the database rules actually deployed
- `docs/roles/role-registry.md` — who owns what

---

## In Progress

🔨 **Week 1-2: MVP Development**

**Backend (Days 1-7):**
- [x] Express app scaffolded + TypeScript configured
- [x] Firebase Admin SDK + Firestore client initialized
- [x] Request pipeline: auth middleware, error contract, rate limits, tracing
- [x] Health + readiness endpoints, Cloud Run container definition
- [x] Firestore rules in the repository, clients denied, deployed (Decision 004)
- [x] Auth endpoints — `POST /auth/session`, `GET /auth/me`, `POST /auth/logout` (Decision 002)
- [x] Org endpoints + multi-org support + membership check + 6 isolation tests
- [x] Location endpoints + plan limit enforced in a transaction (Decision 003)
- [x] Interior endpoints + global 10-interior quota enforced in a transaction (403)
- [x] Member endpoints — add a person (account created), list, remove
      (Decision 006) + 4 isolation tests
- [x] Permit endpoints — issue, list, view, revoke, with a random code
      (Decision 007) + 4 isolation tests + 3 composite indexes deployed
- [x] Validation endpoint — check one permit at one entrance, and record the
      check (Decision 008) + 22 tests, including an isolation test
- [ ] Unit + integration tests for all critical flows
- [ ] Cloud Run deployment pipeline ready

**Frontend (Days 1-3 scaffold, 5-14 build):**
- [x] Next.js + React scaffolded (Next 16 / React 19 / Tailwind 4)
- [x] Firebase Auth SDK configured
- [x] Sign-in state held in one place (`AuthProvider`). Zustand is named in the
      architecture but not installed — there is one piece of state so far, and
      a library for it would be weight with no job yet
- [x] Signup/signin/password-reset pages connected to backend
- [x] Admin dashboard: org switcher, location CRUD, interior CRUD, plan usage
- [x] People screen: add a person with a role, list them, remove them, and
      hand an apartment over to someone else
- [x] Permit screens: issue a permit, list them, show the QR and the code,
      copy it, download it, revoke it
- [ ] Responsable experience: a home of their own (today they arrive through
      the organization list and the administrator's tab bar)
- [x] Security experience: the gate — camera scan, typed fallback, and a
      green/red answer with the reason. A guard's tab bar shows only this
- [ ] Entry history view — the next unit. Checks are being recorded from
      2026-08-30, so the history exists before the screen that shows it
- [ ] PWA setup (manifest, service worker, offline read-only)
- [ ] E2E tests for critical flows

**Critical Blocker (Week 2 pre-launch gate):**
- [x] Firestore security rules locked down — clients denied entirely (Decision 004,
      deployed and verified 2026-08-25). The granular per-role design is retained
      in `data-model.md` as a reference, not deployed.
- [x] Multi-org isolation verified in backend code (2026-08-25). Six tests prove
      user A cannot read, change or delete user B's organization. Every new
      org-scoped route must mount the same membership check — there is no
      second safety net behind it.

---

## Next (Ordered)

### Phase 1: MVP Development (Weeks 1-4)

1. **Approval Gate** ✅ APPROVED (2026-08-19)
   - ✅ Founder approves freemium model
   - ✅ Founder approves GCP stack
   - ✅ Founder confirms Colombia as initial market
   - ✅ Decision D-001 approved

2. **Infrastructure Setup** ✅ COMPLETE (2026-08-19)
   - ✅ GCP project created (zeker-505918) + billing alert
   - ✅ Firestore database configured (us-central1)
   - ✅ Firebase Auth enabled
   - ✅ Cloud KMS key created (90-day rotation)
   - ✅ Service accounts + IAM roles assigned
   - ✅ ADC (Application Default Credentials) documented
   - ⚠️ Vercel connection: TODO (Week 1, non-blocking for local dev)

3. ✅ **Backend MVP** — built and deployed. 188 tests pass. *(This section was
   left unchecked until 2026-08-31 while the work was finished; corrected at
   session close.)*

4. ✅ **Frontend MVP** — built and deployed. 48 tests pass. Note: "basic
   notifications (email on entry)" was listed here as a target and was
   **deliberately dropped by Decision 007** — it is not pending, it is out.

5. ⚠️ **Testing** — automated coverage is done; **manual verification on a real
   phone has never happened.** That is the next unit of work.

6. ✅ **Launch (infrastructure)** — deployed 2026-08-31. Custom domain still
   open; monitoring and alerts still not configured.

### Phase 2: Customer Validation (Weeks 5-8)

1. **Recruit Beta Users** (Ongoing)
   - [ ] Contact administrators of residential and business complexes in Bogotá **(corrected 2026-09-01 — this said "schools" for a day after Decision 010 changed the segment)**
   - [ ] Onboard 5-10 pilot customers
   - [ ] Train on platform

2. **Measure Usage**
   - [ ] Track: orgs created, authorizations issued, validations performed
   - [ ] Track: retention (% still active after 1, 2, 4 weeks)
   - [ ] Collect feedback: what works, what's confusing

3. **Iterate Based on Feedback**
   - [ ] Bugs fixes
   - [ ] UX improvements
   - [ ] Small feature requests (if quick)

### Phase 3: Freemium → Paid Transition (Weeks 9-12)

1. **Decide Pricing** (After seeing usage)
   - [ ] Measure: How many events/month do successful orgs generate?
   - [ ] Price: Based on willingness to pay from pilot users
   - [ ] Tiers: Define PAID tier based on usage patterns

2. **Implement Billing** (3-5 days)
   - [ ] Upgrade trigger: Show "upgrade" button when user hits limit
   - [ ] Stripe integration (or similar)
   - [ ] Invoice generation

3. **Expand Market** (After product-market fit signal)
   - [ ] Research next market (residences? offices?)
   - [ ] Adapt positioning
   - [ ] Target that segment

---

## Known Issues

- 🔴 **ROOT CAUSE FOUND 2026-09-01, and proved: the browser API key was locked to
  one domain, and the password-reset page lives on a different one.**
  The key's allowed referrer was `https://zeker-web-...run.app/*` **only**. Firebase's
  password page runs on `https://zeker-505918.firebaseapp.com/__/auth/action` and
  calls Identity Toolkit with that same key. Google refuses it, and Firebase's page
  renders its generic *"expired or already used"* — because it collapses several
  distinct API errors into one English sentence.
  **Proved, not inferred.** The same request with the same fake code, from two
  referrers:
  - from the app's own domain → `400 INVALID_OOB_CODE` (the API works)
  - from Firebase's reset page → `403 Requests from referer
    https://zeker-505918.firebaseapp.com/__/auth/action are blocked.`
  **The timeline is decisive.** The key was restricted at `2026-08-31T23:49:08Z`.
  The Founder's account was created at `23:51:42Z` — **2 minutes 34 seconds later.**
  Password recovery has therefore **never once worked in this product.** Sign-in
  kept working because the app's own origin was on the list; only the reset page
  was not.
  **This is what the 2026-08-31 session recorded as a security win** — "the Firebase
  browser key restricted to two APIs and to the deployed domain only." It was a real
  hardening. It also silently closed the only door into the product, and **188 green
  tests could not see it**, because no test leaves the app's own origin.
  **Fix (30 seconds, needs Founder's console/CLI):** add
  `https://zeker-505918.firebaseapp.com/*` to the key's allowed referrers. Still two
  domains, both ours; the restriction stays meaningful.
  **The durable fix removes the need for that exception:** our own `/auth/action`
  page on the Cloud Run host, which is already an allowed referrer. Then
  `firebaseapp.com` can be dropped from the list again.

- 🔴 **The password link is dead when it is tapped — and it is how EVERY account
  gets in.** Found by the Founder on their own phone, 2026-09-01: reset requested,
  email received, link tapped, and Firebase's own page answered in English
  *"Your request to reset your password has expired or the link has already been
  used."* Locked out of their own product.
  **This is a different and worse fault than the email landing in spam**, and the
  two were previously recorded as one entry — which kept the free fix waiting
  behind the paid one. They are now tracked separately (weekly review, 2026-09-01).
  `frontend/app/recuperar/page.tsx` and the people screen make the **same call with
  the same settings**, so this is not the Founder's inconvenience: under Decision
  006 it is the only door for every resident and every guard.
  **The deeper fault is a lifetime mismatch:** a reset code lives about an hour;
  an invitation is opened whenever the invitee gets round to it. Decision 006's
  onboarding is built on a credential whose lifetime is wrong for the job. The code
  implements it faithfully — it is a design mismatch, not a bug.
  **Fixed 2026-09-01, free:** the email and Firebase's page now render in Spanish
  (`auth.languageCode`); both call sites pass a continue URL, so that page finally
  has a door back into Zeker; and `auth/expired-action-code` /
  `auth/invalid-action-code` now map to real Spanish instead of falling through to
  *"algo salió mal, intente de nuevo"* — which for a dead link is untrue and sends
  the person into a retry loop.
  **Still open:** our own `/auth/action` page (unblocked, no domain needed); a
  resend control and an "aún no ha entrado" state on the people screen; audit logs
  so the next occurrence is diagnosable; and the reset-code lifetime, still UNKNOWN.
  Reproduction protocol TC-AUTH-RESET-01 is written and needs the Founder's phone.


- 🔴 **The email that lets a person into the product lands in spam.** Found by
  the Founder on 2026-08-31, on their own account: the password-reset email
  arrived, but in the spam folder, so it was never seen. This is not a personal
  mishap — it is the product's onboarding path. Decision 006 makes the
  administrator create every resident's and every guard's account, and Firebase
  sends each of them a "set your password" email. **If that email lands in spam,
  that person never gets in, and the administrator has no way to know.** In a
  ten-apartment building that is ten people who cannot use what was set up for
  them, with nothing on any screen indicating why.
  The cause is the default sender, `noreply@zeker-505918.firebaseapp.com`: a
  generic address on a domain with no reputation and no alignment with any real
  sender, which is close to the definition of what spam filters catch.
  Two fixes, different sizes:
  **(a) Free, today** — the people screen and the reset screen must say plainly
  that the email may arrive in spam and should be looked for there. It does not
  fix delivery; it stops the silence.
  **(b) The real fix** — a custom domain with a verified sender. That is a
  recurring cost and therefore a 🟡 Budget Gate decision (`docs/business/budget.md`),
  and it overlaps with needing a real domain for the product anyway.


- ✅ ~~Nothing deletes an old check yet~~ — **closed 2026-08-31.** The Firestore
  TTL policy on `access_events.expires_at` is enabled and verified `state: ACTIVE`
  against the live project. An entry now deletes itself after 90 days and a
  refusal after 30, which is what `docs/security/data-minimization.md` promises.
  It had been written in the repository since 2026-08-30 and never applied — the
  same shape of mistake as the missing indexes on 2026-08-29.
- 🟡 **Superseded note, kept for the pattern:** the original entry read that every
  check was stamped with a removal date that nothing acted on. Declaring
  infrastructure in the repository is not deploying it; this has now happened
  twice, and both times the tests stayed green throughout.
- 🟡 **The phone camera has never read a real permit.** The QR-reading library
  was proved to decode exactly the QR this product draws, and the typed fallback
  was driven by hand against the live database — but the camera path itself
  (permission, video, frames) has only been opened, not used to decode. It needs
  a real phone. This sits with the "never seen on a real phone" issue below and
  should be closed in the same pass.
- 🟡 **A guard's own view has not been seen.** The API rules for security staff
  are covered by tests (a guard may check a code; a resident is refused; another
  customer's guard gets 404), but nobody has signed in *as* a guard and looked at
  the screen. What is unverified is the tab bar, which is convenience rather than
  a control — the API refuses each screen on its own.
- 🟢 **The two sides disagree about one field's type.** The gate endpoint types a
  permit's `purpose` as free text; the browser types it as one of five known
  values and looks up a Spanish label with no fallback. An unexpected value would
  render an empty row on the guard's screen. It cannot happen today — the API
  refuses any other value when a permit is created — so this is a loose contract,
  not a live fault. Found by the close audit on 2026-08-30. Fix both sides
  together: `backend/src/routes/validate.ts` (`PermitSummary.purpose`) and
  `purposeLabel()` in `frontend/lib/permits.ts`.
- 🟡 **A permit at the wrong entrance has not been tried live.** The test
  building has one site, and its free plan allows only one, so there is no second
  gate to check against. Covered by tests, not by use.

- ✅ ~~Nothing is saved in version history~~ — fixed 2026-08-25. Six commits now
  cover all the code and documents.
- 🟡 **Isolation between organizations depends entirely on backend code** — a
  consequence of closing the database (Decision 004). It is built and covered by
  16 tests across organizations, locations and interiors. **It stays on this
  list because it is a standing rule, not a finished task:** every new
  org-scoped route must mount the membership check and ship with a test proving
  another customer gets 404. Forgetting it once exposes every customer.
- 🟡 **Two documents are still missing: the threat model and the privacy
  policy.** **The privacy policy is legally required before launch**
  (Ley 1581/2016) and the threat model should exist before real customer data
  arrives. The screen design was written on 2026-08-26; the roadmap still lives
  inside this file under "Next", which is adequate for now.
- ✅ ~~A resident's account cannot be linked to their apartment~~ — closed
  2026-08-28 by Decision 006. An administrator creates the person's account,
  and every apartment always has one designated. Entry permits are unblocked.
- 🟡 **Nothing limits how many permits a customer may issue.** The free plan
  caps sites and interiors, but permits are uncounted — and they are the record
  that actually accumulates and costs money to keep. No customer exists, so
  nothing is being abused. It belongs with D-005, which asks the same kind of
  question about free organizations.
- 🟡 **Unresolved contradiction: the delivery rules say one thing, the repository
  does another.** `mantis/delivery-framework.md` §2 requires short-lived
  branches merged by pull request and forbids pushing straight to the main
  branch; §4 additionally requires a security sign-off before any merge. Every
  commit in this repository has gone directly to `master`, and
  `branching-strategy.md`, which that document names as the place to record the
  chosen variant, has never been written. On 2026-08-29 the Founder chose to
  merge directly again and declined to change the rule, so the gap stands. It
  costs nothing today with one person and no production traffic; it matters
  before anyone else commits, or before there is a deployment pipeline to
  protect.
- 🟡 **A green test suite does not prove a Firestore query runs.** The in-memory
  test double answers queries that real Firestore refuses without a composite
  index. This was found on 2026-08-29 when deleting an apartment failed against
  the live database while all 166 tests passed. The developer guide now makes
  deploying the index part of adding the query, but nothing enforces it.
- 🟡 **Nothing limits how many accounts one organization may create.** The free
  plan caps apartments at 10, which bounds how many responsables a free
  customer needs — but not how many people they may add. No customer can abuse
  this today because there are no customers; it belongs with D-005, which asks
  the same kind of question about free organizations.
- 🟡 **The screens have not been seen on a real phone.** They are built
  phone-first — one column, large buttons, 44px touch targets — but were only
  viewed at desktop width. Security staff will use this at a gate on a phone, so
  this needs a real check, ideally before the guard screens are designed.
- 🟡 **Nobody has checked contrast or used a screen reader.** The screens carry
  proper labels, announced errors and visible focus rings, but no contrast ratio
  has been measured and no screen reader has been run against them.
- ✅ ~~Encryption plan is not buildable as written~~ — closed 2026-08-26 by
  Decision 005. The visitor's phone number was the last field that would have
  needed our own encryption. It is not collected, so nothing in the MVP needs
  Cloud KMS. The key is kept, unused, in case a decision is revisited.
- ✅ ~~Dependency versions are not locked~~ — fixed 2026-08-26. Both projects
  keep `package-lock.json` in version control and the container builds with
  `npm ci`, which fails rather than silently installing different versions.
- 🟡 **Rate limits are counted per internet address, not per person** — the
  general 60-per-minute limit runs before the app knows who the caller is, so
  everyone in one office shares one budget. Fine for now; will need attention if
  a customer has many staff on one connection.
- 🟡 **Error messages are in English, the product is in Spanish** — the API
  returns an error code plus an English sentence. The intended approach is for
  the frontend to turn the code into Spanish text for the user. Needs one
  deliberate pass when the frontend is built, so the two do not drift.
- 🟢 **Requirements checkbox meaning clarified** (2026-08-25) — a note at the
  top of `requirements.md` now says a ticked box means "required criterion",
  not "built". Build progress lives in this file.
- ✅ ~~Database open to any signed-in user~~ — closed 2026-08-25 (Decision 004).
- ✅ ~~Design documents contradict each other~~ — the three conflicts were
  resolved by Decisions 002, 003 and 004 on 2026-08-25.
- ✅ ~~Two stale references~~ — both fixed 2026-08-25: `architecture.md` now
  points at the real decision files, and `firestore.rules` now exists.
- ⚠️ **Not yet validated with customers** — All assumptions, no market feedback
- ⚠️ **Privacy policy not yet written** — Needed before launch (high priority)
- ⚠️ **Terms & Conditions not yet written** — Needed before launch
- ⚠️ **No mobile app** — Web + PWA only for MVP (acceptable risk)
- ⚠️ **No recurring authorizations** — Phase 2 (acceptable for MVP)
- ⚠️ **No advanced reporting** — Phase 2 (acceptable for MVP)
- ⚠️ **No hardware integrations** — Phase 2 (acceptable for MVP)

---

## Pending Decisions

Everything waiting on the Founder. One card each. Answering these is all that is
needed — an answered card becomes a record in `docs/decisions/` and leaves this queue.

### ✅ D-009 — ANSWERED 2026-09-04: build the days-and-hours schedule

**The Founder chose option B** — build recurring permits — over talking to
administrators first. Recorded as `docs/decisions/016-days-and-hours-a-permit-may-be-used.md`,
which also carries the correction that made the work small: most of "recurrence"
already existed since Decision 014, and what was missing was the days and hours.

The recommendation below was to talk first, and it is left standing rather than
edited away. **It was not followed, and that is the Founder's call to make.**

---

### ✅ D-006 — ANSWERED 2026-09-04: a person approves each building

Open since 2026-08-27, and the oldest question in this queue. The Founder chose
manual approval over opening registration with the risk accepted, and over not
opening registration at all. Recorded in full as
`docs/decisions/018-a-person-approves-each-new-building.md`, with what it costs
written next to it: it puts the Founder in the path of every new customer, and
it is a wall in front of the very thing the market is meant to decide.

### ✅ D-010 — ANSWERED 2026-09-04: the market decides, not interviews

*"La entrevista a los cinco administradores no es opción para mí. Quiero que el
mercado decida."* The recommendation it overrides is left standing in this file
rather than edited away.

### D-009 — the card as it was raised 🔴 Founder-only

**Raised 2026-09-04 by the brief rewrite.** Not a new fact — a fact that now has
nowhere left to hide.

**The situation.** Zeker has a working product, deployed, hand-verified, with a
market chosen by you on 2026-08-31 and **zero conversations with anyone in it**.
Two domain experts, asked separately today, both said the same thing before any
customer did: the product handles the occasional visitor, and the visitor a
building deals with most is the recurring one — the empleada three days a week,
the daily domicilio. Decision 007 removed recurrence deliberately, for good
reasons, when the market was schools.

**What is being decided.** Where the next weeks of work go.

| | What it means | What it costs | What it risks |
|---|---|---|---|
| **A. Talk to five to eight administrators first** | The brief already has the opening question, the sample size and what a "no" looks like. Build nothing until A5 and A6 have an answer | Your hours, not code. No infrastructure spend | You find out the product needs recurrence, having built for two weeks without it. **That is the cheap version of finding out** |
| **B. Build recurring permits now** | Close the gap both consultants named, then go and sell | Real build time, a data-model change, and it reopens Decision 007 | **Building on speculation.** R-08 said not to do this, and it is still right. If A5 fails — residents will not use an app at all — recurrence was the wrong fix for the wrong problem |
| **C. Finish billing first** | Decision 011 already says billing must exist before going to market | Weeks, and a price nobody has tested against a real buyer | You build a way to charge before knowing whether anyone will pay, or what for |

**Recommendation (Product Owner + Customer Discovery Advisor):** **A.** It is the
only option that can be wrong cheaply. Both B and C spend weeks defending a market
case that currently consists of one decision of yours and ten labelled
assumptions.

**Not urgent for the product; urgent for the money.** The US$300 credit expires
**2026-11-17**, which is the real clock on all three options.

**This is yours alone.** Market and direction are Founder-held; no AI role decides it.

### ✅ D-005 — ANSWERED 2026-09-01: one free organization per person

The Founder chose Option A. Recorded in full as
`docs/decisions/012-one-free-organization.md`, with its enforcement point, its three
exits, and — recorded rather than smoothed over — Security Engineer's refusal to
sign off on it being described as a defence against abuse. **It is an accounting
control.** Nothing checks `email_verified`, so a second account costs eight seconds.

**Enforcement ships with the billing unit, not before.** The two limits parked
against this card are *not* closed by it, and are now more attractive: permits per
organization and accounts per organization are both still uncounted.

---

### D-007 — What domain do we buy, and from whom? 🟡 Budget Gate

```
Decision:       Buy zeker.com at Cloudflare Registrar, with auto-renewal, WHOIS
                privacy included, and the account's contact email OFF the
                domain being bought.

Cost:           ~US$10.44/year at cost (~COP 41,760); ~COP 45,100/year with
                card and exchange friction. That is ~3,758 COP/month = ~19% of
                the 20,000 COP ceiling. Approximate market prices, not quotes.
                A verified email sender (Resend or Brevo) adds COP 0.

Fits ceiling:   Yes, amortized. It would be the project's first recurring cost.
                On a cash basis it is 2-3x the monthly ceiling in the month it
                is paid -- which is a convention this budget has never stated.
                See "What only you can answer" below.

Why it matters: It is the prerequisite for the red issue -- the email that lets
                a person into the product lands in spam. Without our own domain
                there is no verified sender, and every resident and every guard
                the administrator adds can be locked out silently.
                It is also, per the Interface Auditor, the only thing that makes
                every other dead end recoverable: someone who can type zeker.com
                can rescue themselves. Someone facing
                zeker-web-880033266233.us-central1.run.app cannot.

BEFORE PAYING:  1) Confirm zeker.com is free and NOT premium-priced. "Zeker" is
                   a common Dutch word; premium means hundreds to thousands of
                   dollars -- treat that as taken.
                2) Confirm Cloud Run attaches by domain mapping or Firebase
                   Hosting (free) and NOT by load balancer
                   (~72,000-100,000 COP/month = 3.6x-5x the WHOLE ceiling).
                   Owner: Software Architect.
                3) Confirm you are the registrant of record.

If taken:       zekerapp.com -> zekeracceso.com -> zekeringreso.com -> zeker.com.co

Not recommended: .co (46.7% of the ceiling, for nothing in return) and
                Squarespace/ex-Google Domains (Google sold its customer book
                without consulting them -- a demonstrated continuity risk).

Committee:      DEFERRED pending the billing alert and the annual-vs-monthly
                convention -- but the Founder may override, and there is a real
                argument for it: a name someone else takes cannot be recovered.
                If overridden, it is recorded as a purchase made ahead of the
                control, not one that passed it.

Detail:         docs/business/vendors.md
Owning role:    Procurement / Vendor Manager (activated 2026-09-01)
Approver:       Founder
```

---

### D-008 — How does someone ask about a paid plan? 🟢 small but blocking a screen

```
Decision:       When a person hits the one-free-organization limit, the third
                way out is "ask about a paid plan". Zeker sends no email of its
                own (Decision 007), so that resolves to a mailto, a WhatsApp
                number, or nothing.

Recommendation: Nothing, for now -- state plainly that paid plans are coming and
                show no button. A button that leads nowhere is exactly the dead
                end the limit's design was written to avoid. But it must be a
                stated choice, not an omission.

Waiting since:  2026-09-01
Blocks:         The wording of the second-organization screen.
```

---

### D-006 — Nothing checks that a person actually runs the building they register

```
Decision:       Before real customers use Zeker, must we verify that whoever
                creates an organization has any real authority over the
                building they describe?

Why it matters: Anyone can sign up, name a building, and record that a named
                person lives in a specific apartment. Nothing checks that they
                have anything to do with that building. Held together, those
                records say where a named individual lives.

                Our whole justification for storing "apartment 302 = María
                García" is that the building administration is our customer
                and already holds that information legitimately. If the
                creator is not the administration, that justification is gone
                and the product becomes a way to find where someone lives.

                Raised by the security review on 2026-08-27, while building
                the setup screens. Nobody had written it down before.

Option A:       Verify before an organization can be used: a document, a phone
                call, or manual approval by us for the first customers.
                → Safest. Slows down every new customer. With fewer than ten
                  pilot customers, doing it by hand costs almost nothing.

Option B:       Leave open during the pilot, verify before opening signup to
                the public.
                → Costs nothing now. Acceptable only while every customer is
                  someone you personally recruited and know.

Option C:       Do nothing.
                → Not recommended. This is the kind of thing that ends a
                  company if it is discovered by a journalist rather than by us.

Recommendation: B now, A before anyone can sign up without you knowing.
                Concretely: keep signup closed or invitation-only until this is
                answered properly.

Cost impact:    B = none today · A ≈ 1-3 days depending on how it is checked
Reversibility:  High
Waiting since:  2026-08-27
Blocks:         Nothing today. Blocks opening signup to the public.
```

## Approved Decisions

### Decision 008: Checking a permit at a door ✅ APPROVED (2026-08-30)

Three scope calls, all yours, plus the choices the roles made about what a
check leaves behind.

**Your calls:**
1. **The camera now, with the typed code always beside it.** Building only the
   typed field first was cheaper today; a guard typing eight characters per
   visitor is the slow experience this product exists to remove, and the guard's
   screen would have had to be designed twice. Camera-only was rejected — a
   refused permission must never become a visitor who cannot get in.
2. **Entries only, no exits.** Recording an exit means finding the visitor again
   on the way out. It doubles the work at the gate and nobody has asked for it.
   The record has room for it later.
3. **Nothing about the guard's device or connection is kept.** Across a shift
   those become a location trail of your customer's own staff.

**What the roles decided, inside that:** a refusal is a successful answer and
never an error; the reasons are evaluated permit-state-first so a revoked permit
can never say "try the other gate"; the record points at the permit instead of
copying the visitor's name; and a code is stored only when it matched nothing.

Full record: `docs/decisions/008-checking-a-permit-at-a-door.md`

---

### Decision 007: What an entry permit is, and what its code is ✅ APPROVED (2026-08-29)

Four scope calls, all yours, plus five corrections the roles made to a
specification written before Decisions 003, 005 and 006.

- **Build the issuing side only** this session; checking at a door is next.
- **Add a QR library** (~20KB) rather than sending permit codes to an outside
  QR service. Nothing leaves the resident's phone.
- **No shareable link for the visitor.** A public page keyed by a permit code
  is a new unauthenticated entrance, and it says where a named person is going.
- **No daily time window** ("only 14:00–17:00 each day"). It needs each
  building's local time, which we do not store. A permit runs from one moment
  to another moment.
- **No email when someone enters.** We can send no email of our own, so this
  needs a paid service, a new supplier, and a privacy decision. Revisit after
  customers say whether they want it.

The corrections: a permit points at an apartment not a site; the code is random,
never derived from the permit's id; the QR image is not stored; "finished" is
worked out from the dates rather than stored; and there are no identity-document
fields at all. Full reasoning in `docs/decisions/007-entry-permits.md`.

### Decision 006: A responsable is an account, created by the administrator ✅ APPROVED (2026-08-28)

The person in charge of an apartment is a real account, not typed text, and only
a building administrator creates it. Your call, made this session. It answers
what was raised as D-007 and unblocks entry permits.

- Every apartment always has a designated person — your rule. An apartment with
  nobody designated has nobody to issue its permits.
- When the resident's email is not known yet, the administrator designates
  themselves and hands the apartment over later. Setting up a large building is
  never blocked.
- One screen adds people, with a role: responsable of an apartment, or security
  staff at the gate. Guards need accounts by the same route within days.
- The name shown comes from the account. The typed name disappears.
- **Nothing new is stored about a resident.** The email goes to Firebase, which
  already holds every user's email. Our database keeps the account link and the
  name — the same two things it keeps for an administrator today.
- The email worry in the original card was wrong: Firebase sends the
  "set your password" email itself, and has done since the password-recovery
  screen was built. Nothing to buy, build or operate.

Full record: `docs/decisions/006-members-and-responsable-accounts.md`

---

### Decision 005: A permit does not collect the visitor's phone number ✅ APPROVED (2026-08-26)

A permit stores the visitor's name and nothing else about them. The visitor is
not our user, never agreed to anything, and nothing in the product sends them
anything. Full record: `docs/decisions/005-no-visitor-phone-number.md`.

**Consequence to carry forward:** this was the last field that would have needed
our own encryption, so the encryption question is closed rather than solved.
What we give up: we cannot message a visitor — the resident passes the code on
themselves. Reopening it costs about a day and needs a consent mechanism for
someone who is not our user.

*(Numbered 005 in `docs/decisions/`. The card labelled D-005 in the queue below
is a different, still-unanswered question and will be recorded as 006.)*

---

### D-004: Close the database to browsers ✅ APPROVED (2026-08-25) — BUILT

Browsers can no longer reach the database at all. Only the Zeker backend can,
and it already handled every operation. Deployed and verified the same day.
Full record: `docs/decisions/004-backend-only-firestore-access.md`.

**Consequence to carry forward:** keeping organizations separate is now purely a
job for backend code. Every endpoint must check that the caller belongs to the
organization, and a test must prove one customer cannot reach another's data.

---

### D-003: Interiors are real, limits belong to the plan ✅ APPROVED (2026-08-25)

An interior (apartment, warehouse bay, zone) becomes a real thing in the system,
sitting inside a location, with a number and a person in charge — exactly what
the approved offer sells. The old "up to 100 locations" cap is replaced by
limits attached to the customer's plan: free = 1 location, 10 interiors in
total. Hitting the limit blocks creation with a plain Spanish message.
Full record: `docs/decisions/003-interiors-and-plan-quotas.md`.

---

### D-002: Sign-in happens in the browser ✅ APPROVED (2026-08-25)

The browser signs in with Firebase directly. Our server never receives, handles,
or stores a password — it only checks the signed proof of identity it is given.
The three password-handling endpoints in the API design are removed.
Full record: `docs/decisions/002-client-side-firebase-auth.md`.

---

### D-001: Freemium Model (Resource-Limited) + GCP Stack ✅ APPROVED (2026-08-19)

**Card:**
```
Decision:       Resource-limited freemium model for access control

Scope:          MVP focuses on LOCATIONS (not schools)
                Future: Schools as separate org type

Free tier:      1 location organization
                Up to 10 interiors per location
                Unlimited entry authorizations (QR-based, not quotas)

Paid tiers:     Plan A: Up to 5 locations, 10 interiors per location
                Plan B: Up to 20 locations, 50 interiors per location
                (Exact pricing TBD after validation)

Schools (Phase 2):
                Max 50 students per free plan (different org type)
                Schools create pick-up authorizations
                (Deferred: not in MVP scope)

GCP Stack:      Approved ✓ (Firestore, Cloud Run, Firebase Auth, KMS)

Cost impact:    ~$0/month (free tier) until customers grow
Reversibility:  High (can migrate pricing model, ~1 week effort)

Waiting since:  2026-08-18
Blocker:        Data model + MVP scope locked until this approved
```

**Founder clarifications (2026-08-18):**
- Quota applies to **total interiors across all locations** (not per location; global quota)
- 1 user can manage multiple locations within the quota
- Interiors created manually; each interior has:
  - Responsable (person in charge)
  - Number/ID (bodega #, apartment #, zone #, etc.)
- Quota enforcement: Block creation on limit (no warnings)
- Data model: Locations + Interiors separate from Schools (Phase 2)

**Multi-role dispatch feedback (2026-08-19):**
- ✅ **Product Owner:** Quota must be visible in UI (global counter)
- ✅ **Architect:** Will use Firestore atomic transactions to prevent quota bypass
- ✅ **Security:** Audit logging required for all interior creates
- ✅ **UX Designer:** Single global quota bar (not per-location)
- ✅ **Backend:** 403 Forbidden response with user-friendly message (not technical)
  - Example: "Ya tiene 10 interiores. Mejore su plan para agregar más."

**Status:** ✅ APPROVED — Ready for infrastructure setup (Week 1)

---

## Technical Decisions

### Active Decisions

- Entry permits: random 8-character codes, QR drawn in the browser, expiry
  computed not stored, no share link, no daily window (Decision 007)

- **GCP Cloud Stack** — Firestore, Cloud Run, Firebase Auth, KMS
- **Sign-in in the browser** — Firebase Auth Web SDK; our API never sees a password (Decision 002)
- **Interiors under locations** — plan-based limits on the org document; free = 1 location / 10 interiors total (Decision 003)
- **Backend-only database access** — clients denied all Firestore access; isolation enforced in backend code (Decision 004)
- **A permit holds no phone number** — nothing in the MVP needs application-level encryption (Decision 005)
- **Frontend: Next.js App Router + Firebase Auth Web SDK** — Spanish only, all user text in one file so a second language is cheap later
- **No data-fetching library** — decided 2026-08-27. Each screen fetches what it
  shows and re-reads after a change. A caching library was proposed and refused:
  its job is to keep data around, and the security rule here is to keep nothing
  from the previous organization. Revisit if hand-written refreshing gets messy
- **Nothing about a customer in browser storage** — which organization is being
  viewed lives in the web address only, so it cannot survive a switch
- **Freemium Model (Resource-Limited)** — 1 location + 10 interiors free; paid plans unlock more locations/interiors
- **MVP Scope: Locations Only** — Entry authorization (QR validation). Schools deferred to Phase 2.
- **Web + PWA** — No mobile native (Phase 2+)
- **Multi-admin-multi-org** — One user can manage multiple organizations
- **Data Minimization** — Never store IDs, photos, detailed addresses
- ~~**Encryption at Rest** — AES-256 for emails, phones~~ — **not an active decision.** Superseded by 002 and 005; removed from this list 2026-09-01 by the session-close contradiction check
- **90-day Event Retention** — Auto-delete access logs after 90 days

### Superseded Decisions

(None yet)

---

## Explicitly Out of Scope (MVP)

- ❌ Mobile-native apps (iOS/Android)
- ❌ Recurring/recurring authorizations
- ❌ Facial recognition or biometric auth
- ❌ Hardware integrations (turnstiles, doors, cameras)
- ❌ Advanced authorization rules engine
- ❌ Real-time notifications (email only)
- ❌ Multi-language (Spanish only, initially)
- ❌ Audit reports (basic logs only)
- ❌ API for third-party integrations
- ❌ SLA guarantees (best-effort, no uptime guarantee)

---

## Metrics We Care About

**How to see them:** `cd backend && npm run report` prints the ones that live in
the database — customers, segment, permits, checks at a door, refusal reasons,
and who has outgrown the free plan. Speed, error rate and cost are not in the
database; the report ends with the Google Cloud links that hold them.

That report is an **operator tool, not a product feature**, and there is
deliberately no "platform administrator" account. Roles in Zeker are per
organization; there is no global role, and no route in the API can read across
customers (Decision 004). The report reads Firestore directly as whoever runs
it, through their own Google credentials — so access is governed by Google IAM
rather than by a privileged Zeker account that could be stolen or misused.
Added 2026-08-30.


### User Acquisition

- Organizations created (total, weekly)
- Users invited/activated per org
- Segment breakdown (schools vs. residences vs. other)

### Engagement

- Active organizations (created auth in last 7 days)
- Authorizations created (total, trend)
- Access validations per day
- Denied/failed validations (% of total)

### Retention

- % organizations still active after 1/4/12 weeks
- Authorization revocation rate (expected: low, means trust)

### Business

- Customers willing to pay (conversion intent)
- Pricing elasticity (what price breaks market?)
- Cost per customer acquisition (if doing paid ads later)

### Technical

- API latency (validation < 2 seconds)
- Error rate (< 1%)
- Firestore costs (stay under free tier limit)

---

## Risk Register

| Risk | Severity | Mitigation | Status |
|------|----------|-----------|--------|
| No market demand | 🔴 Critical | Validate with 5-10 residential/business complexes ASAP (Decision 010 — corrected 2026-09-01; this said 'schools' for a day after the segment changed) | ⏳ Mitigating |
| Compliance violation | 🔴 Critical | Privacy lawyer review before launch | ⏳ Planning |
| Data breach | 🔴 Critical | Least data possible is held: no ID documents, photos, addresses, emails or phone numbers anywhere (Decisions 002, 003, 005); audit logs enabled | ✅ Mitigated |
| Multi-org isolation bug | 🔴 Critical | Clients cannot reach the database at all; backend checks org membership per request; 6 isolation tests run on every change | ✅ Tested (2026-08-25) |
| Firestore costs exceed budget | 🟡 High | Set alerts at 80% quota, scale pricing if needed | ✅ Monitored |
| Vercel deployment fails | 🟡 High | Have rollback plan, GitHub branches | ⏳ Prepared |
| Slow QR validation | 🟡 Medium | Optimize queries, cache results | ⏳ TBD in code |

---

## Team & Capacity

**Current Team:**
- Founder/CEO: You
- Engineers: TBD (building initially with AI assistance)
- Designer: TBD
- Operations: TBD

**Recommended by Series A:**
- 1 Backend engineer (to review + deploy code)
- 1 Frontend engineer (to build UI)
- 1 Product/PM (to talk to customers)
- 1 QA (to test before launch)

---

## Success Criteria for MVP

**⚠️ This checklist was written on 2026-08-19 and its ticks were never
maintained. Corrected 2026-08-31 against what is actually true.**

| | |
|---|---|
| ✅ | Create org, locations and permits in under 5 minutes |
| ✅ | Scan a QR or type a code and register an entry |
| ✅ | No data leaks between organizations (16 tests; **never proven live**) |
| ✅ | Deployed to production (Cloud Run, 2026-08-31) |
| ❌ | **Privacy policy and terms — do not exist.** Legally required before the first real customer, not before public launch (Security Engineer, 2026-08-31) |
| ❌ | **Threat model — does not exist** |
| ❌ | **Monitoring and alerts — not configured** |
| ❌ | **10+ permits created by real test users — nobody outside this project has used it** |
| ❌ | **Ready for 5–10 pilot customers** — blocked by D-006 and by the items above |

**The MVP is functionally complete and is not launch-ready.** Those are different
statements, and this section previously conflated them.

---

## Next Session Checklist

When you restart, check:

- [ ] Read this file first (current state)
- [ ] Check `docs/context-index.md` (know where to find docs)
- [ ] Check Pending decisions above — D-005 and D-006 are waiting, not blocking
- [ ] Read "Where to pick up" below
- [ ] `cd backend && npm run report` — one page on how the platform is doing
- [ ] Update this file when work is done

---

## Where to pick up

**Updated 2026-09-01 by the first weekly review and the first MBR** (records in
`docs/meetings/`). The board is now ordered around one fact rather than around
feature appetite: **nobody could sign in, so nothing could be verified.**

### 1. Sign-in and account recovery, end to end — THE unit

Not a founder convenience. Decision 006 routes every resident and every guard through
the same broken path. In scope: run TC-AUTH-RESET-01 on the phone; build our own
`/auth/action` page; resend control and an "aún no ha entrado" state on the people
screen; spam wording on the people screen; and drive the whole journey by hand in a
real browser, including receiving and using the email. **Automated tests cannot see
this failure; they never have.**

Explicitly out of scope: the custom domain and verified sender (🟡 Budget Gate,
D-007); any change to how accounts are created; the entry history; D-005's
enforcement code; the brief rewrite; the `purpose` contract mismatch.

### 2. The phone pass — parallel with #3, needs your hands

TC-PHONE-01 now has pass/fail lines for all four questions, which the previous
version lacked. **A test with no pass/fail line is a demo.** Preconditions that are
easy to get wrong: mobile data on and Wi-Fi off; no traffic for 20 minutes
beforehand so Cloud Run has scaled to zero, or step A measures nothing; outdoors, in
sun, at 50% brightness — a pass at 100% but a fail at 50% is recorded as a fail.

Three of its four questions are blocked until #1 lands. The cold/warm load
measurement is **not** blocked and takes three minutes.

### 3. The brief rewrite — parallel with #2, needs no code

Section-by-section specification produced by Product Owner on 2026-09-01 and recorded
in the weekly review. **The re-opened finding:** Decision 010 was recorded on
2026-08-31 and the finding was closed on the strength of that. A decision that
supersedes a document does not change the document. The brief still argues schools.

**What the rewrite will expose, and this is the point:** afterwards Zeker has no
evidenced market case at all — a Founder decision and eight labelled assumptions. Two
of them could invalidate everything built (`docs/business/risks.md` R-07, R-08).

### 4. The entry history

Unchanged, with one addition: Product Owner will not accept it as done until the
composite indexes are **deployed and proven live**, for an administrator and for a
responsable, with the responsable proven unable to see another apartment's entries.

### 5. D-005 enforcement — ships with billing, not before

---

### The single ordered list — updated 2026-09-01

Everything outstanding, in one sequence. Earlier records scattered these across two
meeting records, four decisions and a risk register; this is the one place that says
what happens next and in what order. **Y** = only the Founder can do it.

#### Blocking — nothing else moves until these are done

| # | Do | Who | Why it is first |
|---|---|---|---|
| 1 | **Fix the API key referrer** — the exact command is below | 30 s. **Either of us** — this machine's gcloud session has the rights (checked 2026-09-02) | Password recovery has never worked. No sign-in, no phone test, no demo, no discovery call |
| 2 | Request a reset link and sign in | **Y** — 2 min | Proves 1 worked. If it still fails, stop and say so — the diagnosis was wrong |

**Status 2026-09-02:** still not done. Re-proved from a blocked origin that same
morning: `403 API_KEY_HTTP_REFERRER_BLOCKED`. Security Engineer reviewed the
change and **approved it as written**, with one condition: **do not add
`zeker.com.co` yet** — the domain is bought but does not resolve, and allowing an
origin that does not exist is opening a door to nobody-knows-what. It goes on the
list in the same sitting as step 10, once it resolves and serves the app. The
configuration as it stood before the change is kept at
`docs/security/api-key-snapshots/2026-09-02-before.json`.

**Done 2026-09-02 15:23 UTC**, after the Founder authorised it in the session.
The evidence is the one written down in advance, from the origin that was
blocked: `403 API_KEY_HTTP_REFERRER_BLOCKED` → `400 INVALID_OOB_CODE`. The key
is now accepted and only the deliberately fake code is refused. Both states are
kept in `docs/security/api-key-snapshots/` (`-before` and `-after`).

**Two more locks were found behind it, both on 2026-09-02, and the first fix
did not open the door on its own:**

1. **The product answers on two Cloud Run addresses and only one was on the
   key.** The canonical one — the address the console shows and a person
   bookmarks — was blocked (R-25). Scripted in `scripts/arreglar-llave.sh`.
2. **Firebase keeps a second, different permission list** — authorized
   domains, the addresses a person may be returned to after setting a password
   — and it held neither address the product runs on (R-26). **This is why no
   invitation and no recovery has ever left the application**, for anyone.
   Fixed and verified 2026-09-02: the browser's exact request, which refused
   with `UNAUTHORIZED_DOMAIN` minutes earlier, now succeeds.

**A made-up email address cannot test any of this** (R-27). Firebase answers
"done" for an unknown account without checking anything else, so the obvious
smoke test passes against a completely broken system — it did, at 11:20 that
morning.

**Closed the same day, by hand, on a real phone.** After all three locks were
open the Founder received the email, set a password, signed in, and **issued an
entry permit from a phone**. First time end to end in the product's life. R-19
is closed — not by a passing test, by a person doing the thing.

**What that unblocks:** the phone test (TC-PHONE-01) can now run whole, a
demonstration is possible, and Decision 006's invitation path — every resident
and every guard — works for the first time.

```bash
gcloud services api-keys update   projects/880033266233/locations/global/keys/22180854-c084-41a2-ab6c-df3ba4d97cd1   --allowed-referrers="https://zeker-web-880033266233.us-central1.run.app/*,https://zeker-505918.firebaseapp.com/*"
```

That key is `Browser key (auto created by Firebase)`, the one whose value sits in
`frontend/.env.production`. It stays restricted to two domains, both ours — the
restriction is not being loosened, it is being made complete.

**Verify it worked without touching the product**, by asking Google the same
question from the blocked origin. Before the fix this returns `403 blocked`;
after it, `400 INVALID_OOB_CODE`, which means the key is accepted and only the
fake code is refused:

```bash
curl -s -X POST   "https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=$(grep NEXT_PUBLIC_FIREBASE_API_KEY frontend/.env.production | cut -d= -f2)"   -H "Content-Type: application/json"   -H "Referer: https://zeker-505918.firebaseapp.com/__/auth/action"   -d '{"oobCode":"PRUEBA"}'
```

**Step 8 removes the need for this exception entirely** — once the action page
lives on our own host, `firebaseapp.com` comes back off the list.

#### This week — the money, because it now has a deadline

The US$300 credit **expires 2026-11-17** and is **shared with other projects**.
Until then every "US$0.00" reading proves nothing.

| # | Do | Who | Note |
|---|---|---|---|
| 3 | **Read the billing report grouped by SKU, with the credits column shown** | **Y** | The only thing that separates "inside Always Free" from "billed and credited to zero". Minutes |
| 4 | **Create the budget alert on the BILLING ACCOUNT, not just this project** | **Y** | The credit is shared; a project-scoped alert watches the wrong pool. Threshold **25%**. ⚠️ **Check the account currency first — if it is USD the amount is US$5, not 20000** |
| 5 | Cloudflare → Websites → Add a site → `zeker.com.co` → Free plan | **Y** | The domain is registered but has no DNS delegation; that is what "invalid nameservers" means |
| 6 | The five domain controls, in one sitting: auto-renew on, card expiry after renewal, account email **not** on this domain, 2FA + registrar lock, WHOIS privacy on, registrant is you | **Y** | Lapse costs more than the annual budget. R-20 stays open until a reminder exists outside this repository |
| 7 | Calendar reminder: **2027-07-18**, renewal 45 days out | **Y** | |

#### Then — the work I do, in this order

| # | Do | Depends on |
|---|---|---|
| 8 | Our own `/auth/action` page, in Spanish, on our host — removes the need for the referrer exception in step 1 | 2 |
| ~~9~~ | ~~Resend control and an "aún no ha entrado" state on the people screen; spam wording there~~ — **built 2026-09-02**, unverified in a browser until step 1 lands | — |
| 10 | Confirm the **free** path to attach the domain to Cloud Run (domain mapping vs. Firebase Hosting) | 5 |
| 11 | Remove the unused KMS key (Decision 005 left it with no purpose) and add an Artifact Registry cleanup policy | 3 |
| 12 | Cap member creation per organization | — |
| 13 | Rewrite `brief.md` for the real segment | — |
| 14 | The entry history, with its indexes **deployed** and proven live | 2 |

#### The phone test — as soon as step 2 lands

Runs whole once you can sign in. `TC-PHONE-01` has pass/fail lines now. Do it
outdoors, on mobile data, at 50% brightness, with no traffic to the site for 20
minutes beforehand or the speed measurement is meaningless.

#### Built 2026-09-02, after the door opened

| Do | State |
|---|---|
| **Decision 014 — one entry or many.** The resident chooses when issuing; the permit itself counts the entries; "ya se usó" is a named refusal at the gate; the detail screen says whether anybody came in | ✅ **Done 2026-09-03.** Published (`zeker-web-00005-x8k`) and driven by hand against production: TC-014-01, TC-014-02 and TC-014-03 all pass, step by step, in `docs/delivery/manual-test-cases.md` |
| **Decision 015 — what a guard records when nobody comes in.** Four fixed reasons, no free text; "el visitante no entró" gives a one-entry permit back | ✅ **Done 2026-09-03.** Built, published (`zeker-web-00006-chq`) and driven by hand: TC-015-01 passes, including a permit that said "ya se usó" saying "puede entrar" again. The ten-minute window is covered by test, not by hand |

#### The machine we work on — added 2026-09-02, all five are your hands

Audited today: this laptop holds a standing Google grant to production, in your
name. Losing the laptop is losing control of the company; losing the *disk*
costs almost nothing, because everything is on GitHub. Recorded as R-23 and R-24.

| # | Do | Time | Why |
|---|---|---|---|
| 15 | Two-step verification on the Google account | 5 min | The single biggest reduction. Everything else assumes this exists |
| 16 | Windows password + automatic lock on the screen | 5 min | Today the credential is protected by whoever can open the lid |
| 17 | Confirm device encryption is on (Settings → Privacy and security) | 2 min | Could not be checked from here: it needs administrator rights, and Windows 11 Home has no BitLocker management |
| 18 | An encrypted copy of `backend/.env` and `frontend/.env.local` | 5 min | The only two files that exist nowhere else |
| 19 | Write the revocation procedure, before it is needed | 10 min | It is a Google-account action, not a `gcloud` command on a laptop you no longer have |

#### Still yours to decide, not blocking today

- **D-006** — do we verify that whoever registers a building runs it? Security
  answered *how*: manual approval is the only mechanism that proves anything.
- **D-008** — how does someone ask about a paid plan: mailto, WhatsApp, or nothing?
- **The budget convention** — does an annual charge count amortized (25% of the
  ceiling) or as cash in the month paid (3× the ceiling)? Both readings are
  defensible from `budget.md` as written, and they disagree.

