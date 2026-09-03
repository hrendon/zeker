# Risk Register — Zeker

**Created:** 2026-09-01, from the first weekly review and the first MBR.
**Shape:** `mantis/meetings.md` §6. Each role owns its own entries; **nobody owns the
file as a whole.**

A **risk** has not happened, could, and would cost something if it did. That is
different from a **finding** (already true) and a **blocker** (already stopping
work). An **accepted** risk stays here with its acceptance recorded — accepting a
risk is a decision (the Founder's authority), not a deletion.

This register closes a gap the Founder-Facing Audit Duty already assumed existed:
several roles are obliged to raise *"what exposure is accumulating that no one has
decided to accept"*, and until today there was no register for that answer to
accumulate in. Everything below had been raised in prose somewhere and had nowhere
durable to land.

**Status key:** 🔴 open, unmitigated · 🟡 open, partly mitigated · 🟢 mitigated ·
⚪ accepted, recorded

---

## Security & privacy

| # | Risk | Impact | Owner | Mitigation / status |
|---|---|---|---|---|
| R-01 | **Nobody checks that whoever registers a building actually runs it.** Held together, our records say where a named individual lives. If the creator is not the administration, the whole legal justification for storing "apartment 302 = María García" is gone | Company-ending if discovered by a journalist rather than by us | Security Engineer / Founder | 🔴 **D-006 unanswered since 2026-08-27.** Sole control today is that the URL is unpublicised — which is security by obscurity on a public Cloud Run deployment |
| R-02 | **Any organization admin can create Firebase accounts for arbitrary email addresses, unmetered**, each triggering a Google-sent email naming the recipient. Chained with one throwaway signup, this is a spam/phishing relay wearing our identity | Discovery by Google's abuse desk rather than by us | Security Engineer | 🔴 Flagged by Decision 006 as unmitigated. **Decision 012 makes it worse** by concentrating every free user into one organization. A blunt cap is needed before the URL is publicised |
| R-03 | **Our own action-handler page can become an account-enumeration surface** if it renders the address `verifyPasswordResetCode` returns — the obvious, friendly thing to do | Undoes protection the recovery screen went out of its way to build | Software Architect | 🟡 Known before the code exists. Security Engineer signs off before merge |
| R-04 | **Isolation between organizations depends entirely on backend code** and has **never been proven live** against two real organizations on the deployed system | One customer sees another's residents | Security Engineer | 🟡 16 tests. Standing rule, not a finished task: every new org-scoped route ships with a test proving another customer gets 404 |
| R-05 | **Privacy policy and terms do not exist.** Ley 1581/2016 requires the privacy policy before the first real customer | Legally cannot launch | Regulatory & Data Privacy Counsel — **not active, flagged since 2026-08-26** | 🔴 Carried across three sessions |

## Product & onboarding

| # | Risk | Impact | Owner | Mitigation / status |
|---|---|---|---|---|
| R-06 | **Every account in the product depends on one email channel with no fallback and no alerting.** Spam is one instance; an outage, a corporate filter or a typo are others with the same silence. The administrator is never told a person did not get in | Ten people per building who cannot use what was set up for them, invisibly | Software Architect (mechanism) / Product Owner (flow) | 🟡 Language fixed and a way back added 2026-09-01. Deliverability needs a domain (D-007) |
| R-07 | **A5 — residents may simply keep calling the portería or using the building's WhatsApp group** instead of issuing permits in the app | The adoption assumption the entire model rests on | Product Owner / Customer Discovery Advisor | 🔴 **Nothing tests it.** Zero discovery conversations |
| R-08 | **A6 — the permit model has no recurrence, and a conjunto's most frequent visitor is arguably the recurring one** — the domestic worker three days a week, the daily delivery. Decision 007 deliberately removed recurrence | Decision 010 chose this segment partly because the product already fits it; this is the specific way that reasoning could be wrong | Product Owner | 🔴 First thing to test in discovery. **Do not build it on speculation** |
| R-09 | **The second-organization block pushes people toward being invited**, in a product that never checks who runs a building | Moves the D-006 exposure rather than closing it | Product Owner / Security Engineer | 🟡 Recorded in Decision 012 |

## Money & vendors

| # | Risk | Impact | Owner | Mitigation / status |
|---|---|---|---|---|
| R-10 | ~~A GCP free-trial credit **may** be masking real spend, expiring on a date nobody knows~~ — **CONFIRMED 2026-09-01, and it is worse than the risk as written.** The US$300 credit **is active** and **expires 2026-11-17**. It is **shared with the Founder's other projects**, which this register had not considered at all | Two separate failures, both dated. (1) On **2026-11-17** whatever is silently being charged today starts hitting the card, with no prior signal. (2) The credit can be **exhausted before that date by an unrelated project**, and Zeker would give no warning because nothing here watches it | FP&A Manager | 🔴 **No longer a risk of the unknown — a known event with a date.** The billing alert must exist and be proved to fire **well before 2026-11-17**, not on it. See R-21 |
| R-11 | **Domain lapse.** Redemption costs US$80–150 ≈ **320,000–600,000 COP, 1.3×–2.5× the project's entire annual budget.** DKIM/SPF stop validating, onboarding dies silently, and a third party who re-registers the name can stand up a mail server and receive address-based recovery mail | A security incident, not a billing lapse | Procurement / Vendor Manager | 🟡 Five controls specified in `vendors.md`, to be applied **at purchase, not later** |
| R-12 | **Attaching the domain to Cloud Run via a load balancer costs 3.6×–5× the entire ceiling**, permanently | A 3,480 COP/month decision silently becomes 100,000 COP/month | Software Architect | 🟡 Must be settled **before** the domain is paid for |
| R-13 | **The email sender's free tier has no affordable step above it** — the next tier is 1.8×–4× the whole ceiling. Free-tier headroom is itself a budget constraint | Email volume growth becomes a budget event, not just a product event | FP&A Manager | 🟡 Recorded in `vendors.md` |
| R-14 | **Artifact Registry grows monotonically with every deploy** — **measured twice on 2026-09-01: 107.4 MB, then 133.2 MB after a single deploy — ~26 MB, about 5% of the ~500 MB allowance, per deploy.** No cleanup policy anywhere | The line most likely to go non-zero first, independently of customers. At the measured rate ~14 more deploys fill the free tier, with no customer involved | Software Architect | 🟡 Measured, and now measurable any time with `npm run costs` |
| R-21 | **The 20,000 COP ceiling is measured on the wrong thing while the credit lasts.** Everything billable is being paid by a shared trial credit, so a "US$0.00" reading proves nothing about whether this stack is inside the Always Free tier or merely credited to zero. **The two look identical today and diverge completely on 2026-11-17** | The project could believe it has been under its ceiling for three months and discover on one day that it never was | FP&A Manager | 🔴 **The distinguishing evidence exists and takes minutes:** the billing report grouped by SKU, with the credits column shown. Until someone reads it, `budget.md`'s central claim stays UNVERIFIED |
| R-22 | **Zeker's cost headroom depends on projects nobody here is watching.** The credit pool is shared; another project's spike consumes Zeker's cushion, and no artifact in this repository knows those projects exist | Silent loss of headroom, attributed to Zeker when the alert finally fires | Founder / FP&A Manager | 🟡 Mitigated by setting the budget alert **per billing account**, not only per project — otherwise it watches the wrong pool |
| R-15 | **The ceiling is doing the work of financial control without providing any.** At US$5/month no purchase can ever be large enough to hurt, so the budget cannot fail loudly. Meanwhile **founder-months are unpriced, unbudgeted and untracked** | An unbounded number of unpriced founder-months on an unvalidated bet, with a cash meter set too low to ever trigger a stop | Founder / FP&A Manager | 🔴 Raised 2026-09-01. **Not actionable by any AI role — the Founder's call whether to accept** |

## Process

| # | Risk | Impact | Owner | Mitigation / status |
|---|---|---|---|---|
| R-16 | **"Declared in the repository, never deployed."** Three occurrences: composite indexes (08-29), TTL policy (08-30), billing alert (08-19, never verified). **Every time with a fully green test suite** | The entry-history unit needs two new composite indexes — the fourth opportunity is already scheduled | Software Architect (verifier: QA Engineer) | 🟡 The guard is currently a sentence in a developer guide. A process indicator now exists; **nothing mechanical prevents it** |
| R-17 | **Running the phone test before sign-in is restored** produces a partial result that reads like a pass | Three of its four questions cannot be answered | QA Engineer | 🟢 Sequenced: reset protocol first, same sitting |
| R-18 | **Delivery rules say one thing, the repository does another.** `delivery-framework.md` requires short-lived branches merged by pull request and a security sign-off; every commit has gone straight to `master` | Costs nothing today with one person; matters before anyone else commits | Founder | ⚪ **Accepted 2026-08-29** — the Founder chose to merge directly and declined to change the rule. Recorded as accepted, not closed |

---

## How this file is kept

Each role updates its own rows. A risk is not deleted when it stops being
interesting — it is marked mitigated, or accepted with the acceptance recorded and
dated. Reviewed at every weekly review, every MBR, and every gate.

---

## Added 2026-09-01, after the root cause of the lockout was proved

| # | Risk | Impact | Owner | Mitigation / status |
|---|---|---|---|---|
| R-19 | **Hardening a control can silently close a door, and no test in this project can see it.** The browser API key was restricted to the deployed domain on 2026-08-31 — a correct, real security improvement. It also broke every password link the product will ever send, because Firebase's reset page lives on a different domain. **188 backend and 48 frontend tests stayed green, and always will: no test leaves the app's own origin.** | Password recovery has never once worked. Under Decision 006 that is the only door for every resident and every guard | Security Engineer / Software Architect | 🟢 **Closed 2026-09-02**, by hand: the Founder received the email, set a password, signed in and issued a permit from a phone. Root cause proved 2026-09-01 by comparing the same API call from two referrers; **two further locks behind it were found and fixed on 2026-09-02** (R-25, R-26). **The general lesson is not the referrer list** — it is that every change to an access control needs a hand-run check of the flows that cross an origin boundary, because the suite structurally cannot |
| R-20 | **Domain renewal has an owner but no mechanism.** Procurement / Vendor Manager is active and owns renewal tracking. **A role recorded in a document does not watch a calendar.** Until a real reminder exists outside this repository, the control is a note | Lapse costs 1.3×–2.5× the annual budget and kills onboarding silently — R-11 | Procurement / Vendor Manager | 🔴 **Open by construction until the domain is bought.** The reminder is set in the same sitting as the purchase, never "later" |

---

## Added 2026-09-03, after a routine publish took the product down

| # | Risk | Impact | Owner | Mitigation / status |
|---|---|---|---|---|
| R-28 | **A publish erases every API setting that is not written in the deploy script.** `scripts/desplegar.sh` uses `gcloud run deploy --set-env-vars`, which replaces the service's whole environment rather than adding to it. On 2026-09-03 the API's `CORS_ORIGINS` had been set by hand in the console and existed nowhere in the repository, so a normal publish wiped it. `LOG_LEVEL` went with it | **The entire product went down for several minutes**, and the message it showed was *"revise su conexión a internet"* — which sends a person to look for the fault in their own network. A customer seeing this would conclude the product is broken and be unable to say why | DevOps Engineer / Software Architect | 🟡 **Mitigated for the known case, open in general.** `CORS_ORIGINS` is now declared in the script with a comment saying what it broke. **Nothing checks that the script's list is complete** — the next setting somebody types into a console will disappear at the next publish, silently. **This is the fourth instance in three days of the same shape** (R-25, R-26, R-16): a value that lives in exactly one place no process respects. The durable fix is that the deploy script is the only place any of it is set, and that is a convention, not a mechanism |

---

## Added 2026-09-02, after auditing what this development machine actually holds

| # | Risk | Impact | Owner | Mitigation / status |
|---|---|---|---|---|
| R-23 | **The whole company's infrastructure is reachable from one unlocked laptop.** `~/AppData/Roaming/gcloud/application_default_credentials.json` holds an `authorized_user` **refresh token for the Founder's own Google account** — not a service-account key, a standing grant that renews itself. `~/.config/configstore/firebase-tools.json` holds a second one for the Firebase CLI. Anyone who opens a session on this machine acts as the Founder in `zeker-505918`: read and write Firestore, redeploy or delete Cloud Run, rewrite the security rules, change the API key, delete the project. **Verified today, not assumed:** production configuration was read and modified from this machine with no re-authentication. Disk encryption could not be confirmed — the check needs administrator rights, and this is Windows 11 Home, where BitLocker is not manageable | **The loss of the machine is the loss of control of the company**, and today the only thing standing in the way is whoever can log into Windows. The blast radius grows the day real resident data exists | Security Engineer / CISO (execution: Founder) | 🔴 **Open.** Separate what is lost from what is exposed: **losing the data is not the risk** — the repository is fully pushed to GitHub with no unpushed commits, there are zero downloadable service-account keys in GCP (checked for all three accounts), and no customer data lives on this disk. The only local-only files are `backend/.env` and `frontend/.env.local`. **The exposure is the risk**, and its controls are: (1) 2FA on the Founder's Google account, (2) a Windows sign-in password with automatic lock, (3) device encryption on, (4) an encrypted copy of the two `.env` files, (5) a written revocation procedure. **None is confirmed in place. All five are the Founder's hands, not an AI role's** |
| R-26 | **Firebase keeps a second permission list, and the product was on neither.** Separate from the browser key's referrers, Firebase Auth holds *authorized domains* — the addresses a person may be sent back to after setting a password. On 2026-09-02 it contained only `localhost`, `zeker-505918.firebaseapp.com` and `zeker-505918.web.app`: **neither address the product actually runs on.** Every screen that asks Firebase for a password email passes a return address built from the current one, so Firebase refused the whole request — `UNAUTHORIZED_DOMAIN : Domain not allowlisted by project` | **No invitation and no recovery has ever left the application.** Not the Founder's, and under Decision 006 not a single resident's or guard's either. `residente.prueba@zeker-test.com`, created 2026-08-28, has never signed in | Software Architect / Security Engineer | 🔴 **Open.** Proved by sending the browser's exact request from a terminal, with and without the return address: without it Google accepts, with it Google refuses. **Two look-alike permissions were mistaken for one all day** — the key decides who may *call* Google, this list decides where a person may be *returned to*. Fix scripted in `scripts/autorizar-dominios.sh`. 🟢 **Closed 2026-09-02**: both addresses added and proved by sending the browser's exact request again — it succeeded where it had refused with `UNAUTHORIZED_DOMAIN` minutes earlier. The Founder then received the email and signed in |
| R-27 | **A test with an address that has no account passes against a completely broken system.** Firebase answers "done" to a password request for an unknown email without checking anything else, so as not to reveal who has an account. Correct behaviour — and it means the obvious smoke test is worthless here. **The diagnostic run at 11:20 on 2026-09-02 reported success while nothing worked** | Any check of this flow that uses a made-up address proves nothing, and reads exactly like a pass | QA Engineer | 🟡 The rule is now written where it will be read: at the top of `scripts/autorizar-dominios.sh`. **This is R-19's lesson a second time in two days** — the suite is not the problem, the test's own blind spot is |
| R-25 | **The product answers on two addresses and only one of them works.** Cloud Run serves this frontend at both `zeker-web-krsxkgch7q-uc.a.run.app` (the canonical one, the one the console shows and a person bookmarks) and `zeker-web-880033266233.us-central1.run.app`. Only the second was ever on the API key's allow-list. **From the first, every sign-in and every password request fails** | The Founder set a new password successfully and still could not get in, then retried a request that could never succeed. Any resident or guard who bookmarks the address they were given hits the same wall | Software Architect / Security Engineer | 🔴 **Open.** Reproduced in a browser 2026-09-02 and proved with the same call from both origins (`400` vs `403`). Two parts: allow the canonical address on the key, and **decide which single address is the product's** — two front doors is the condition that produced this. The wrong-message half is fixed in code. 🟡 **Half closed.** The key now allows both addresses (re-read live 2026-09-03), so neither is broken. **The product question is still open, and it bit again on 2026-09-03**: the deploy script was printing the non-canonical address as the one to visit, now corrected to name one. Until a single address is chosen — and after the domain resolves, that address is `zeker.com.co` — this stays open |
| R-24 | **There is no way to revoke access to a machine that is gone.** The credential above is a Google OAuth grant, so revoking it is not a `gcloud` command run on a laptop nobody has any more — it is done from the Google account (third-party access → remove the Google Cloud SDK and Firebase CLI, plus a password change and sign-out of all sessions). Nobody has written that down, and it would be needed on the worst possible day | Hours of improvisation while an attacker holds a live grant to production | Security Engineer / CISO | 🔴 Open. The procedure is short and costs nothing to write; it has not been written. **Also unwritten: how to tell whether anything was actually done with the credential** — GCP audit logs exist and nobody has ever read them |

