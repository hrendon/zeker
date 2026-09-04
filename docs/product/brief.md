# Product Brief — Zeker

**Owner:** Product Owner
**Last updated:** 2026-09-04
**Supersedes:** the version dated 2026-08-18, which argued schools and daycares as
the segment to validate. Decision 010 (2026-08-31) replaced that market. This
rewrite moves the business case to match the decision — a decision that supersedes
a document does not change the document, and for four days it did not.

---

## How to read this document

This brief describes a product that is **built and working**, sold to a market that
has **never been spoken to**. Those two sentences are both true, and the second one
is the more important of the two.

Everything below is labelled. **Fact** is something observed in the repository, the
running product, or a recorded decision. **Consultant judgement** is field knowledge
supplied by an AI-embodied domain role, which is informed opinion and not evidence.
**Assumption** is something we believe and have not tested — the ten of them are
listed in their own section, and two could invalidate everything built.

There is no fourth label, because there is no customer evidence to label.

---

## The problem

**Fact (product design):** a building or complex has to decide, at a door, whether a
person who is not a resident may come in — and afterwards, be able to say who came
in, when, and who authorised it.

**Consultant judgement (Residential Property Administration Consultant, Colombia):**
what actually happens today at the gate of a Colombian conjunto residencial is one
of three things, depending on size:

- **A handwritten book** at the portería (the *minuta*), with the visitor's name and
  the time. No copy, no way to search it, no way to withdraw permission once given.
- **A phone call or intercom** to the apartment, at the moment the visitor arrives.
- **A WhatsApp group** — the de facto system in many buildings. The resident writes
  *"mi primo llega a las 3"* so the guard expects someone.

What goes wrong with all three, in that consultant's account:

- Permission cannot be withdrawn once given, and cannot be proved afterwards.
- There is no record of **who authorised** an entry — only that someone did.
- The guard rotates. In most medium buildings the guard is not an employee of the
  building at all but staff of a contracted security firm, on shifts, often new.
  The context of yesterday's authorisation leaves with the previous shift.
- After an incident — a theft, a dispute — nobody can reconstruct the afternoon.

**Consultant judgement (Physical Security Consultant, corporate side):** in a
Colombian office building the standard is a visitor logbook, retention of the
visitor's *cédula*, a phone call upstairs to confirm, and sometimes a temporary
badge. Sign-out is written by hand and frequently skipped. It produces no record a
facility manager can actually query.

---

## Who this is for

**Decision 010 (Fact):** the market is **residential complexes and business
complexes** — gated communities, apartment buildings, condominiums, and office or
corporate parks. Schools are out of scope, not deferred: if they return it is as a
new decision with its own reasoning.

Three people touch the product, and only one of them buys it.

| Who | What they do in the product | Their relationship to the sale |
|---|---|---|
| **Administrator** — the building's *administrador*, or a corporate facility manager | Creates the organization, its entrances and its interiors (apartments, offices); creates the accounts of the people in charge; sees the whole organization's entry history | **The buyer, or the person who proposes the purchase.** Not necessarily the person who approves the money |
| **Responsable** — a resident, an owner, a tenant company | Issues permits for their own interior; sees only their own entries | **Adoption lives or dies here.** They do not pay and cannot be compelled |
| **Guard / portero** | Scans or types a code at the entrance, gets a green or red answer, taps a reason when nobody comes in | **Can veto the whole thing in practice.** Usually not an employee of the buyer |

**Consultant judgement (residential):** in a Colombian conjunto under the
horizontal-property regime, the administrador executes but does not decide spending
alone. A purchase of this kind is proposed to the **consejo de administración**, and
above a threshold set in the building's own budget it goes to the **asamblea de
propietarios**, which meets rarely. *(The specific approval thresholds vary by
building and are not recorded here, because we have not read one.)*

**Consultant judgement (corporate):** the facility manager decides access policy,
but the **contracted security firm staffs the gate and determines what is actually
feasible**. A facility manager cannot adopt a tool the security firm refuses to
operate, and switching security firms is a rare decision that takes months.

**Both consultants independently named the same wall:** the person who benefits
(the administrator) is not the person who has to change their behaviour (the
resident and the guard), and the guard usually works for somebody else.

---

## What the product does today

**Fact.** Everything in this list is built, deployed, and — except where noted —
has been driven by hand by a person against the live system.

- An **organization** with its entrances and its interiors (apartments, offices).
  One person can run several organizations.
- The administrator **creates the accounts** of the people in charge and assigns
  each to an interior (Decision 006).
- A responsable **issues an entry permit**: a named visitor, valid between two
  moments, for one interior, **either one entry or many** — chosen at the moment of
  issuing (Decision 014). The permit counts its own entries.
- The permit is shown as a **QR code and as a typed code**. The code is random
  (Decision 007).
- At the entrance the guard **scans or types**, and gets a green or red answer with
  the reason. Entries only (Decision 008).
- When nobody comes in, the guard taps **one of four fixed reasons**, never free
  text. "El visitante no entró" **gives a one-entry permit back** within ten minutes
  (Decision 015).
- An **entry history**: what happened at the doors, filtered by date range and by
  refusals only. The administrator sees the organization; a responsable sees only
  their own interiors; **a guard cannot open it at all**.
- A permit can be **revoked** before it is used.
- **Isolation between organizations** is enforced on every org-scoped route, and one
  customer cannot reach another's data.

**Fact — what the previous version of this brief claimed and does not exist:**

- ❌ **Offline validation / installable app (PWA).** Listed as MVP scope since
  2026-08-18. Not built.
- ❌ **A reports dashboard with entry counts and a chart.** Not built. What exists is
  the entry history list.
- ❌ **An email to anyone when a visitor enters.** Deliberately removed by Decision
  007. Zeker sends no email of its own at all.
- ❌ **A home screen of their own for the responsable.** They currently arrive
  through the administrator's navigation.

---

## What the product deliberately does not do, and what that costs

These were decisions, taken for reasons that are still good reasons. This section
exists so that the cost of each one is written down next to it, instead of being
discovered in a sales conversation.

| What we gave up | Why (Fact) | What it costs us (Consultant judgement) |
|---|---|---|
| **Recurring permits.** A permit covers one visit or one period, not "every Tuesday" | Decision 007 removed the daily time window; it was built for school pickup, which is no longer the market | **This is the largest gap in the product.** The residential consultant's account: the most frequent visitor to a Colombian building is the recurring one — the domestic worker three days a week, the daily *domicilio*, the gardener, the pool service. Without recurrence the resident would issue a fresh permit every visit, and will not. The building will keep handling those people the way it does today, on a separate list at the portería. **The product then covers the occasional visitor, not the bulk of the traffic** |
| **Exit times.** Entries are recorded, exits never are | Decision 008: the product records what a guard actually does reliably, and sign-out is the step that gets skipped | For a small building, acceptable. For the corporate end, the security consultant is explicit that it breaks three real things: **who is still inside during an evacuation**, **how long a contractor was on site** for liability, and **after-hours incident investigation**. This is a conversation to have with every facility manager, not a detail |
| **The visitor's ID document, photo, or biometrics** | Data minimization, from day one — and Decision 005 removed the phone number too. We store less than the law allows us to | Colombian office receptions routinely ask for and retain the *cédula*. The security consultant's read: **refusing to do so is a friction point, not a selling point**, for a traditional security buyer, who may read it as "you don't even know who came in". It reads as an advantage only to a buyer who has their own privacy policy to satisfy |
| **Any integration with turnstiles, doors, cameras or existing badge systems** | Out of MVP scope since 2026-08-19 | A building that already has electronic access control for its employees sees a second, separate system |

---

## What we are actually offering, stated honestly

**Not:** "a QR generator for visitors."

**Not, yet:** "the building's access-control system." The recurring-visitor gap
above means that in a real building this does not replace the portería's book — it
sits beside it.

**What it is, on today's evidence:** a way for the person who authorises a visit to
do it themselves, in writing, before the visitor arrives — so that the guard is not
deciding, the permission can be withdrawn, and afterwards there is a record of who
authorised what, that the neighbour cannot read.

Whether that is worth paying for is **Assumption A2 and A7 below**. Nobody has been
asked.

---

## The eight assumptions

Produced by the Customer Discovery & Validation Advisor, 2026-09-04. Named in the
weekly review of 2026-09-01 and never written down until now. **A5 and A6 are the
same two already carried as R-07 and R-08 in the risk register.**

| # | The assumption | Considered validated when | If it is false |
|---|---|---|---|
| **A1** | The buyer is the building's administrator or the corporate facility manager | An administrator tells us who actually decides — themselves, or someone above them | The whole go-to-market is aimed at the wrong person. Nothing else on this list matters |
| **A2** | That buyer has money for access control and believes it is worth paying for | An administrator names a problem that costs them time or money today, and accepts that a solution costs something | We have a free-only market and freemium cannot work |
| **A3** | The resident should be the one issuing permits for their own space — not the administration issuing everything | An administrator says residents decide who enters their own apartment | The permission model is backwards and has to be rebuilt |
| **A4** | Scanning or typing a code at the gate is a real enforcement point | An administrator describes a gate where someone physically checks visitors and has the seconds to do it | The enforcement surface is theatre; entry happens some other way, or the guard refuses to use it |
| **A5** | **Residents will use the app rather than call the portería or write in the WhatsApp group** *(= R-07)* | An administrator says a resident would rather do it on their phone than call the office | **Adoption fails.** Residents keep the channel that works today and the app is abandoned |
| **A6** | **A permit model with no recurrence is enough** *(= R-08)* | An administrator describes their access problem **without** raising recurring visitors unprompted | **Decision 007's removal of recurrence was wrong for this segment**, and the permit model has to be rebuilt. Both domain consultants raised this independently, before any customer did |
| **A7** | The record of who entered which interior and when is valuable enough to change a working process for | An administrator says they need that record — for security, for liability, for a dispute they have actually had | The product is a convenience for letting guests in, and is dropped the first time it adds friction |
| **A8** | Someone who hits the free limits will pay rather than leave | An administrator confirms a second site, or more than ten interiors, is real and not hypothetical | The freemium model has no upgrade path and there is no revenue |

**Two more, raised by the domain consultants and not on the original list of eight.**
They are recorded here rather than renumbered, because the eight were named in a
meeting record and renumbering them would break that trail:

- **A9 — the guard will actually operate it.** In both segments the guard usually
  works for a contracted security firm, not for the buyer. That firm has its own
  procedures across many sites and gains nothing from ours. The security consultant
  named this as the single hardest wall in the corporate segment: *"my security
  company won't use it."*
- **A10 — the building's existing security contract does not already own the entry
  log.** Where a security firm is contracted to keep the record, a second record
  raises the question of who owns it.

---

## What evidence Zeker has for its market

**None.**

Zero customer conversations, zero customers, zero revenue, in a product that is
built and deployed. The market was chosen by the Founder on 2026-08-31 (Decision
010) on the reasoning that the product already fits this segment. **Both domain
consultants have now qualified that reasoning in the same place** — the product fits
the occasional visitor, and the segment's most frequent visitor is the recurring
one.

That is the honest state, and stating it is the point of this rewrite.

---

## How this stops being an assumption

**Owner:** Customer Discovery & Validation Advisor, with the Founder.

1. **Test A1 and A3 first**, together. If we have the wrong buyer or the wrong
   permission model, A5 and A6 do not matter yet.
2. **The first question**, phrased so politeness cannot answer it:

   > *"Cuénteme la última vez que un residente le avisó que alguien iba a llegar a
   > su apartamento — un invitado, un técnico, quien sea — y esa persona llegó de
   > verdad. Empiece desde el momento en que el residente le avisó, y dígame
   > exactamente qué pasó después."*

   It forces one real example, and it surfaces whether residents notify at all, who
   really decides, what channel is already working, and how much friction there is.
3. **Five to eight conversations** with administrators of different buildings.
4. **What a "no" looks like**, decided in advance so it cannot be argued away later:
   - **A5 fails** if, in four of five conversations, the administrator says
     unprompted that residents will not use an app and will call or write instead.
   - **A6 fails** if, in four of five conversations, the administrator raises
     recurring visitors **without being asked** — the domestic worker, the daily
     delivery, the regular contractor.
   - **If both fail, Decision 010 needs revisiting** by the Founder. That is a
     Founder decision, and this document does not make it.
5. **Nothing gets built on the strength of this section.** Recurrence in particular
   is not to be built on speculation — R-08 says so, and it is still right.

**There is nowhere to record these conversations yet.** `docs/product/customer-discovery.md`
is named in the context index as needed *now* and does not exist. It is written
before the first call, not after.

---

## Monetization

**Fact (Decisions 001, 003, 012):**

- **Free:** one organization per person, one site, ten interiors.
- **Paid:** not defined. Price, contents and billing mechanism are all open.
  Decision 011 requires billing to exist before going to market.
- **The upgrade trigger** is hitting a limit. Whether anyone upgrades is A8.

**Unknown, and load-bearing:** what a paid plan contains and what it costs. Its
owner is the CCO / VP of Sales, a role that is not active. **A price nobody has
tested against a real buyer is not a price.**

---

## Explicitly not in scope

Facial recognition and biometrics · storing an ID document or a photo · hardware
readers, turnstiles and camera integrations · an authorization rules engine ·
native mobile apps · automatic invoicing · exits · recurrence *(until A6 is tested,
and then as a decision, not as a reflex)*.

---

## What happens next, for this document

- This brief is rewritten again **after the first five conversations**, and the
  assumptions section is where the changes will land.
- ✅ `docs/product/requirements.md` carried the same school framing in every "As:"
  line. Reframed the same day, actors only — no acceptance criterion changed.
- `docs/security/data-minimization.md` still frames its examples around a child
  being picked up — "relationship: nanny / parent", "purpose: school_pickup",
  "Child's school name/class". It is a Security Engineer artifact and is **not
  changed here**: its rules are right, only its examples belong to the old market,
  and one of the fields it describes (`purpose`) has a known contract mismatch with
  the code that is already recorded elsewhere. Raised, not touched.
- The two domain consultations that produced this document are summarised here and
  are not yet in their own artifacts (`docs/product/segment-residential.md`,
  `docs/product/physical-security-advisory.md`), which those roles own and which do
  not exist.
