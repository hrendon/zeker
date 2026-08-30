# Project State — Zeker

Single source of truth for current progress. Updated at every checkpoint.

**Last updated:** 2026-08-30
**Session open:** 2026-08-30. One unit built — a guard checks a permit at a
door, and every check is recorded. Three scope questions answered by the Founder
and recorded as Decision 008.

**Last verified:** 2026-08-30 — backend typecheck clean, 188/188 tests pass;
frontend typecheck clean, 45/45 tests pass, production build clean; the gate
driven by hand in a real browser against live Firebase and live Firestore: a
permit issued for apartment 302 and let in (code typed in lowercase with a
space, and accepted), a code that matches nothing refused with "ese código no
existe", the permit then revoked and the same code refused with "el permiso fue
anulado" — and all three checks confirmed written to live Firestore with no
guard device or connection data in them. The QR-reading library was separately
proved to decode exactly the QR this product draws. **The phone camera itself is
not yet verified** — see Known issues.

**Previously verified:** 2026-08-29 — backend typecheck clean, 166/166 tests pass; frontend typecheck clean, 38/38 tests pass, production build clean; the permit flow driven in a real browser against live Firebase and live Firestore: a permit issued for apartment 302, its QR proved to encode the permit's own code, deleting that apartment correctly refused while the permit was live, and the permit revoked, with its code and QR disappearing.

**Previously verified:** 2026-08-28 — backend 122/122, frontend 22/22; the whole people flow driven in a real browser: a resident's account created by the administrator, the member list showing her with the email Firebase holds, an apartment handed over to her, and removing her correctly refused while she was still in charge of it.

**Previously verified:** 2026-08-27 — backend typecheck clean, 102/102 tests pass; frontend typecheck clean, 16/16 tests pass, production build clean; the whole setup flow driven in a real browser against live Firebase and live Firestore: account created, organization created, site added, apartment added with its responsable, apartment deleted, and deleting a site correctly refused while it still had apartments in it.

---

## Current Milestone

**MVP — Access Management for Physical Spaces**

---

## Current Status

🟢 **The product is visible in a browser for the first time** (Camino B: Build first, validate after)

```
Completed:       The product now does, end to end, the thing it exists to do.
                 Set-up (sign-in, organizations, sites, interiors + limits,
                 people), issuing (a permit, a QR and a code, revocable), and
                 now the door: a guard checks a code and is told in one glance
                 whether the person may enter — and every check is recorded
                 (188 backend tests + 45 frontend tests pass)
In Progress:     Nothing. The next unit is showing that record back:
                 the entry history
Blocked:         0 · 2 decisions waiting on Founder (D-005, D-006),
                 neither blocking today
Critical Risk:   None open
Next:            The entry history — who came in, when, and who was refused
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
- Encryption strategy: AES-256 at rest, TLS in transit
- PWA: Yes (for offline read capability)

✅ **Security & Compliance**
- Data minimization rules written
- Never store: IDs, photos, biometrics, addresses
- Encrypt: Emails, phone numbers
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

3. **Backend MVP** (7-10 days)
   - [ ] Node/Express app scaffolded
   - [ ] Firestore queries + mutations
   - [ ] Firebase Auth integration
   - [ ] Security rules written + tested
   - [ ] Encryption middleware (at-rest)
   - [ ] Endpoints: auth, orgs, locations, authorizations, validate, events
   - [ ] Error handling + validation
   - [ ] Logging + monitoring

4. **Frontend MVP** (7-10 days)
   - [ ] Next.js + React scaffolded
   - [ ] Three experiences: Admin, Responsable, Security
   - [ ] Auth flow (signup, login, logout)
   - [ ] Admin: Create org, add locations
   - [ ] Responsable: Create auth, generate QR, revoke
   - [ ] Security: Scan QR, validate, register entry
   - [ ] Basic notifications (email on entry)
   - [ ] PWA setup (offline read cache)

5. **Testing** (2-3 days)
   - [ ] Manual smoke tests (each flow)
   - [ ] Org isolation test (user A can't see user B data)
   - [ ] QR generation + scan flow
   - [ ] Authorization validity checks (date, time, location)
   - [ ] Deployment smoke test (staging environment)

6. **Launch** (0.5 day)
   - [ ] Deploy backend to Cloud Run
   - [ ] Deploy frontend to Vercel
   - [ ] Configure custom domain (optional)
   - [ ] Monitor for errors in production

### Phase 2: Customer Validation (Weeks 5-8)

1. **Recruit Beta Users** (Ongoing)
   - [ ] Contact schools/colegios in Bogotá
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

- 🔴 **Nothing deletes an old check yet.** Every check written at a door is
  stamped with the date it should be removed — 90 days for an entry, 30 for a
  refusal — but the rule in Google that acts on that stamp has not been switched
  on. Until it is, the record grows for ever, which contradicts what
  `docs/security/data-minimization.md` promises and what a privacy policy will
  have to say. One command, in `developer-guide.md`. **This is the same shape of
  mistake as the missing indexes on 2026-08-29:** written down in the repository,
  never actually applied to the live system.
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
  does another.** `mantis/mantis/delivery-framework.md` §2 requires short-lived
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

### D-005 — Nothing stops one person opening many free organizations

```
Decision:       Should one person be limited in how many free organizations
                they can create?

Why it matters: The free plan gives each organization 1 location and 10
                interiors. Nothing stops the same person creating ten free
                organizations and getting ten times the free allowance. The
                paid plans then sell something the free plan already gives
                away. No customer exists yet, so nothing is being abused
                today — but the hole is open the moment we launch.

                This was never decided because the approved plan describes
                limits inside one organization, and separately requires that
                one person can manage several organizations. Both are true;
                nobody joined them up.

Option A:       One free organization per person. Additional organizations
                require a paid plan, or an invitation from someone else who
                already has one.
                → Closes the hole. About half a day. It does slightly narrow
                  what a new user can do on their own.

Option B:       Leave it open for now, revisit after talking to customers.
                → Costs nothing today and keeps signup frictionless while we
                  are trying to get anyone at all to use it. The hole stays.

Option C:       Move the allowance to the person rather than the organization:
                10 interiors in total across everything they manage.
                → Most faithful to "10 interiors free", but it is the biggest
                  change, and it complicates every limit check. ~2 days.

Recommendation: B for now, A before the first paid customer. While the goal is
                to find out whether anyone wants this at all, friction at
                signup costs more than the theoretical abuse. But this must be
                answered before money changes hands, or the paid plans have
                nothing to sell.

Cost impact:    B = none today · A ≈ half a day · C ≈ 2 days
Reversibility:  High for A and B · Medium for C (changes how limits are counted)
Waiting since:  2026-08-25 (1 day)
Blocks:         Nothing today. Blocks launching paid plans.
```

*(When answered, this becomes `docs/decisions/006-...`. The file numbered 005 is
the visitor phone-number decision, already answered on 2026-08-26.)*

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
- **Encryption at Rest** — AES-256 for emails, phones
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
| No market demand | 🔴 Critical | Validate with 5-10 schools ASAP (week 5) | ⏳ Mitigating |
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

MVP is "done" when:

- ✅ Can create org, locations, authorizations in < 5 minutes
- ✅ Can scan QR and register entry in < 2 seconds
- ✅ All user stories pass acceptance criteria
- ✅ No data leaks between orgs
- ✅ 10+ successful authorizations created by test users
- ✅ Security sign-off: encryption + isolation + privacy rules verified
- ✅ Deployed to production (Cloud Run + Vercel)
- ✅ Monitoring + alerts configured
- ✅ Privacy policy & ToS written + approved
- ✅ Ready for 5-10 beta customers

---

## Next Session Checklist

When you restart, check:

- [ ] Read this file first (current state)
- [ ] Check `docs/context-index.md` (know where to find docs)
- [ ] Check Pending decisions above — D-005 is waiting, not blocking
- [ ] Read "Where to pick up" below
- [ ] Update this file when work is done

---

## Where to pick up

**The product now does the whole thing: a resident issues a permit, and a guard
checks it at a door.** What is missing is showing the record back — every check
is being written down from 2026-08-30, and nothing displays it yet.

**The next unit — the entry history:**

1. A resident sees who came to their apartment, when, and who was refused. An
   administrator sees the whole building. A guard sees none of it, for the same
   reason they cannot list permits.
2. Filters that a person actually wants: by date, by apartment, allowed or
   refused.

Already settled, needing no new decision:

- The record's stored shape is in `docs/architecture/data-model.md` under
  `access_events`, and it is what the code actually writes — verified against
  live Firestore on 2026-08-30.
- The `GET /orgs/{id}/events` contract is drafted in `docs/architecture/api.md`
  and is **marked NOT BUILT.** It needs correcting before it is built: a stored
  event has no `visitor_name` (it points at the permit, which holds the name),
  its `auth_id` is stored as `permit_id`, and `action` is always `entry`.
- **This unit will need composite indexes** on `access_events` — most likely
  `permit_id + created_at` and `location_id + created_at`. They are deliberately
  not declared yet because nothing queries the collection. Declare *and deploy*
  them in the same change (see Known issues, and the developer guide).
- A check points at a permit rather than copying the visitor's name, so the
  history screen resolves names from the permits, one read for the whole list —
  the same shape as `displayNames()` and `interiorNumbers()` already use.

**Two things worth doing first, both cheap:**

1. **Switch on the deletion rule in Google** for `access_events`. It is one
   command and it is currently the only 🔴 on the issues list.
2. **Open the screens on a real phone**, and read a real permit's QR with the
   camera. The gate is the one screen that is definitely used on a phone, at a
   gate, in a hurry. It was attempted on 2026-08-29 by resizing the browser and
   the window would not resize, so it is still unchecked.

---

**What a new session needs to know that is not obvious from the code:**

- Since Decision 004, **backend code is the only thing keeping customers
  separate.** Every org-scoped route mounts `requireOrgMember` or
  `requireOrgAdmin` and ships with a test proving another customer gets 404.
- The built code deliberately **stores less** than `data-model.md` originally
  specified — no user email or phone, no organization address or phone, no staff
  names on locations, and no visitor phone on a permit. Each is marked in
  `data-model.md` under "What is actually implemented", with the reason.
- Anything the plan limits is created through `createCounted()` in
  `backend/src/lib/quota.ts`, never by writing the document directly.
- The API returns error **codes**; `frontend/lib/errors.ts` is the only place a
  code becomes Spanish. No English may reach a customer's screen.
- All user-facing text lives in `frontend/lib/strings.ts`. Text written inside a
  component is a bug, because it is what makes a second language expensive.
- **Nothing about a customer goes in browser storage.** Which organization is
  being viewed comes from the web address. A person can be an administrator of
  one building and a plain member of another, so anything kept across a switch
  could put one customer's data on another customer's screen.
- Since Decision 006, an interior's responsable is **an account, never typed
  text**, and the name shown comes from that account. `displayNames()` in
  `backend/src/lib/users.ts` resolves a whole list in one read; do not
  denormalize the name back onto the interior.
- Adding a person answers the same way whether or not the account already
  existed. That is deliberate anti-enumeration, not an oversight — do not
  "improve" it by reporting which happened.
- Every organization-scoped screen goes through `OrgGate` in
  `frontend/components/OrgShell.tsx`. It waits for the sign-in session to be
  restored before asking the API — skipping that gives a false "your session
  ended" on any direct page load — and it turns the API's deliberately vague
  404 into "not found or no access" without revealing which.
- A refusal that is a plan limit and a refusal that is a permission problem are
  both 403. Branch on the error **code**, never the status.
- `docs/architecture/design.md` holds the screen conventions. Two of them look
  cosmetic but are security and must not be softened: sign-in never says which
  half was wrong, and password recovery never reveals whether an account exists.
- A test account exists in Firebase (`prueba.desarrollo@zeker-test.com`) from
  verifying the sign-in flow. Nothing depends on it.
- **A permit's code is a credential.** It is generated with `crypto.randomInt`
  from an alphabet with no I, L, O or U, and is never derived from the permit's
  id — that id is visible in the web address. Do not "simplify" this.
- **A permit's `status` is only `active` or `revoked`.** Whether it has expired
  is worked out from `valid_to` at read time. The three delete guards go
  through `hasLivePermit()` in `backend/src/lib/permits.ts`, which checks both;
  a guard that looked at `status` alone would block an apartment for ever.
- **A check at a door is never edited after it is written**, and there is no
  code path that does. It is evidence. `backend/src/lib/events.ts` says why.
- **The order the refusal reasons are evaluated is load-bearing** — no such
  code, then revoked, then not started, then finished, then wrong entrance. The
  permit's state is settled before the entrance, so a revoked permit can never
  tell a guard to try another gate. There is a test named for exactly this; do
  not "tidy" the order.
- **A refusal is a 200.** Only a broken request is a 4xx on the gate endpoint.
  The guard's screen relies on that to tell "this visitor may not enter" apart
  from "our system is down".
- **A Firestore TTL policy is not in this repository.** Writing `expires_at` on
  a document does not enable deletion; the policy is switched on once per
  collection group in Google Cloud, and nothing in the tests will tell you it is
  off. Same trap as an undeployed index, one level up.
- **A query that combines an equality filter with a range needs a composite
  index in `firestore.indexes.json`, deployed.** The test double does not need
  one and will not warn you. Deploy with
  `firebase deploy --only firestore:indexes`, and wait: a new index says
  `CREATING` for a few minutes and the query fails until it says `READY`.

---

**Owner:** All roles collectively
**Last updated:** 2026-08-30
**Approval:** ⏳ Two cards waiting — D-005 (free organizations per person) and
D-006 (verifying that whoever registers a building actually runs it). Neither
blocks work today; both block opening the product to the public.
