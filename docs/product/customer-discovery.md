# Customer Discovery — Zeker

**Owner:** Customer Discovery & Validation Advisor, with the Founder.
**Created:** 2026-09-04, **before the first conversation**, which is the only
time this file can be written honestly.

---

## Why this file exists, and why it exists today

Zeker has a working product, deployed, hand-verified, in a market chosen on
2026-08-31 — and **zero conversations with anyone in that market**, on day
seventeen.

That is not the problem this file fixes. The problem it fixes is smaller and
more concrete: **there was nowhere to write down what an administrator says.**
A conversation that lands nowhere is a conversation that has to happen again.

**Written before the first call on purpose.** The questions, the sample size and
what counts as a "no" are all decided here, in advance. Deciding them afterwards
— once there is a real answer sitting in front of us — is how a "no" gets read
as a "not quite yet".

## The rule this file runs on

> **Write what they said, not what it means.** The transcript column is for
> their words. The interpretation goes in its own column, and it is allowed to
> change later. Their words are not.

A second rule, from the same place: **a conversation with somebody who cannot
buy is not discovery.** It is practice, it is useful, and it is recorded
separately so it never gets counted toward the five.

---

## What is being tested

The ten assumptions live in `product/brief.md` and are not copied here — one
copy drifts from the other. What is copied here is the **order** and the **stop
condition**, because those are what a conversation is run against.

### Test first, together: A1 and A3

* **A1** — the buyer is the building's administrator or the corporate facility
  manager.
* **A3** — the resident is the one who should issue permits for their own space.

If A1 is wrong we are talking to the wrong person, and nothing below matters. If
A3 is wrong the permission model is backwards and the product needs rebuilding
before anything else is worth asking.

### Then: A5 and A6, which can invalidate everything built

* **A5** (= R-07) — residents will use the app rather than call the portería or
  write in the WhatsApp group.
* **A6** (= R-08) — a permit model without recurrence is enough.

**A6 changed on 2026-09-04 and the change must be said out loud in the
conversation, or the answer is worthless.** Decision 016 built a weekly
schedule: a permit can now say *"lunes, miércoles y viernes, de 7 a 4"*, on a
permit that can run up to a year with free entries. So A6 is no longer "can the
product express a recurring visitor" — it can. It is now: **is that the shape a
building actually wants?**

### Also live, and not on the original list

* **A9** (= R-29) — the guard will actually operate it, and the guard usually
  works for a contracted security firm rather than for the buyer.
* **A10** (= R-30) — the building's security contract does not already own the
  entry log.

Both came from the domain consultants on 2026-09-04, not from a customer.

---

## The opening question

Asked first, before anything about Zeker is described. It is phrased so
politeness cannot answer it:

> *"Cuénteme la última vez que un residente le avisó que alguien iba a llegar a
> su apartamento — un invitado, un técnico, quien sea — y esa persona llegó de
> verdad. Empiece desde el momento en que el residente le avisó, y dígame
> exactamente qué pasó después."*

It forces one real example, and it surfaces four things without asking for any
of them: whether residents notify at all, who actually decides, which channel
already works, and how much friction there is.

**Do not describe the product before this question is answered.** Once a person
has seen a solution, they answer about the solution.

### The three follow-ups, in this order

1. **On the buyer (A1):** *"Si usted quisiera cambiar cómo se maneja eso,
   ¿quién tiene que decir que sí?"*
2. **On the guard (A9):** *"¿Quién está en la portería? ¿Es empleado del
   conjunto o de una empresa de vigilancia?"* — and then: *"¿Ellos tendrían que
   estar de acuerdo?"*
3. **On the record (A10):** *"¿Hoy quién lleva el registro de quién entró, y de
   quién es ese registro?"*

### Only after all of that: show the schedule

The one thing Decision 016 predicts. Show a permit restricted to three days and
a range of hours, and ask what they would use it for. **Do not ask whether they
like it.** Ask what it would replace.

---

## What a "no" looks like, decided in advance

**Sample: five to eight conversations**, with administrators of different
buildings. Fewer than five is an anecdote.

| | Fails when | And then |
|---|---|---|
| **A5** | In **4 of 5**, the administrator says unprompted that residents will not use an app — they will call, or write in the WhatsApp group | Adoption is the problem, not features. Nothing built solves it, and Decision 010 needs the Founder again |
| **A6** | In **4 of 5**, the schedule shown is not the shape they want — they ask for different hours on different days, a night shift, or a visitor with no fixed day | Decision 016 solved the wrong half. Cheap to learn, expensive to have assumed |
| **A1** | The administrator says the decision is not theirs and names somebody we have never considered | The whole go-to-market is aimed at the wrong person |
| **A9** | In **4 of 5**, the security firm would have to agree and the administrator doubts it would | The hardest wall, and no feature moves it |

**If A5 and A6 both fail, Decision 010 goes back to the Founder.** That is a
Founder decision. This file does not make it, and neither does any AI role.

---

## The conversations

Nothing here yet. **Zero conversations held.** This table is the whole point of
the file, and it being empty is the current state of the company's market
evidence.

| # | Date | Who (role, not name) | Building type & rough size | What they said, in their words | What we read into it | Which assumption it touches |
|---|---|---|---|---|---|---|
| | | | | | | |

### Conversations that do not count toward the five

For people who cannot buy — a friend who lives in a conjunto, a guard, a
relative on a consejo. Useful, and kept separate so they are never counted.

| # | Date | Who | What they said | Why it does not count |
|---|---|---|---|---|
| | | | | |

---

## What we already believe, so we can tell learning from confirmation

Recorded before the first call so that afterwards it is possible to say whether
we learned anything or only heard ourselves. **Both of these come from AI-
embodied domain consultants on 2026-09-04, not from a customer.**

1. The recurring visitor is the bulk of a building's traffic.
2. The person at the gate usually works for a contracted security firm, not for
   the buyer, and can close the sale without ever evaluating the product.

**If the first five conversations only repeat these two, we have confirmed our
consultants and learned nothing about the market.** That outcome is worth
naming in advance, because it will feel like validation.

---

## Data protection, because this is real people's information

Discovery notes are **not** stored in the product and **not** in Firestore.
Names are not recorded here — a role and a building type are enough for every
question above. If a conversation produces a follow-up commitment, the contact
detail lives with the Founder, not in this repository, which is public to
everyone who can read the repo.
