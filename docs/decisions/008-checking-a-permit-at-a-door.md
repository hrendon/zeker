# Decision 008 — Checking a permit at a door, and what a check leaves behind

**Status:** ✅ Accepted
**Date:** 2026-08-30
**Deciders:** Founder (scope, and what is recorded), Software Architect + Security Engineer (the order of the checks and the shape of the record), UI/UX Designer + Frontend Developer + QA Engineer (consulted)
**Extends:** Decision 003 (a permit belongs to one interior), Decision 006 (security staff are real accounts), Decision 007 (what a permit is, and that its code is a credential)

---

## Context

Decision 007 built the half of the product that issues a permit. This is the
other half, and the one the product exists for: a guard at a gate is handed a
QR code or eight characters, and has to know in one glance whether the person
in front of them may come in.

Nothing has ever been let through a door until this exists. It is also the
first thing in the product that *writes history* — every check, allowed or
refused, becomes a record. That record is the audit trail the whole product
rests on, and it is the first place the product accumulates data about people
who never signed up for anything.

The endpoint was drafted in `../architecture/api.md` before Decisions 003, 005
and 006. This decision records what was actually built.

---

## Alternatives considered

The Founder answered three scope questions on 2026-08-30. Each is recorded with
what was not chosen.

**1. How the guard reads the QR.** ✅ The phone camera now, with the typed code
always available beside it. Adds one outside library (`jsqr`, ~40KB) that turns
pixels into text and makes no network calls. Building only the typed field first
was cheaper today and was rejected: a guard typing eight characters for every
visitor is the slow experience the product exists to remove, and the guard's
screen would have had to be designed twice. Camera-only was rejected outright —
a cracked lens, a refused permission or an insecure connection would each turn
into a visitor who cannot get in.

**2. Entry only, or entry and exit.** ✅ Entry only. Recording an exit means the
guard finds the visitor again on the way out, which doubles the work at the gate,
and no customer has asked for it — there are no customers yet to ask. The record
keeps an `action` field so adding `exit` later is one line, not a migration.

**3. What each check stores about the guard.** ✅ Not their internet address and
not their device. The original data model kept both for 90 days. They describe
the guard, not the visitor, and across every scan of a shift they become a
location trail of a customer's own staff — something we would then have to
disclose, defend and protect, in exchange for an investigation nobody has asked
for. Who made the check and which request it was are still recorded.

---

## Decision

**1. A refusal is a successful answer, not an error.** "This person may not
enter" is a correct answer to the question the guard asked. The endpoint returns
200 with `result: "denied"` and a reason. Anything other than 200 is a fault of
ours, and the guard's screen says so differently. A guard must be able to tell
"turn this visitor away" from "our system is broken".

**2. The order the reasons are evaluated is fixed, and is not arbitrary:**

```
no such code → revoked → not started → finished → wrong entrance
```

The permit's own state is settled before the entrance is considered, so a
revoked permit can never produce "try the other gate" — which would send a guard
to redirect somebody who must not be let in anywhere.

**3. Each refusal names itself.** A guard who is only told "no" cannot explain
anything to the person in front of them, and an unexplained refusal at a gate
becomes an argument. For a wrong entrance the answer also names the right one,
so the guard can redirect the visitor instead of turning them away.

**4. A refusal still shows who was turned away**, when the code matched a real
permit — the visitor's name and the apartment. A code that matched nothing shows
nothing, because nothing is known.

**5. The code is never handed back.** The guard already has it. Echoing a live
door credential into a second screen only creates another place it can leak.

**6. Who may check.** Security staff, and administrators. An administrator is
included because in a small building the person who runs it is often the person
at the door, and because a gate has to be testable without a second account. A
responsable is refused: a resident checking codes at the entrance is not what the
product describes, and it would let any resident test whether a code they
overheard is real.

**7. The endpoint answers one code and never lists anything.** This keeps
Decision 007's rule true — a guard who could list a building's permits would know
who is expected where, all day.

**8. Every check is recorded, allowed or refused.** One document per check, never
updated afterwards. A log that can be edited is not evidence.

**9. The record points at the permit rather than copying it.** No visitor name is
stored on a check; the permit holds it. The same reason a responsable's name is
not copied onto an interior (Decision 006), and the same rule
`../security/data-minimization.md` exists to enforce.

**10. The characters someone submitted are kept only when they matched no
permit.** Then they are the only evidence of what was attempted. When a permit
*was* found, its identifier is the reference and the code is not copied into a
second collection.

**11. A check is deleted 90 days after it happens**, per the retention table
already in `../architecture/data-model.md`.

**12. The entrance must be real and in use.** A check at an entrance that does
not exist, or that an administrator has retired, is refused before anything is
written — a record has to say truthfully where it happened.

**13. Which entrance the guard is standing at lives in the web address.** A
permit is valid at one entrance, so the answer depends on where the guard is.
Keeping it in the address and nowhere else follows the rule that nothing about a
customer is kept in browser storage, where it could survive a switch onto another
customer's screen. A building with one entrance never has to choose.

**14. The tab bar shows only what a role can open.** A guard sees the gate and
nothing else. This is convenience, never a control — the API refuses each screen
on its own, and that refusal is the real rule — but offering a guard a tab that
answers "not allowed" teaches them the product is broken.

---

## Rationale

Points 1, 2 and 3 are all the same idea: the person using this screen is
standing in front of another human being who wants to come in, and every
ambiguity in the answer is resolved at that gate, out loud. The order in point 2
is the only place where getting it wrong is a safety failure rather than a
usability one.

Points 8 to 11 are where this unit differs from everything built so far. Until
now the product stored only what a customer typed about themselves. A check is
the first record it *generates* about a person — including a visitor who never
agreed to anything. The answer is to store the minimum that still constitutes
evidence: what happened, where, when, who checked, and which permit. Everything
else is either already held elsewhere or is not ours to keep.

Point 6 admits administrators deliberately. The strict reading is that only a
`security` role should check codes, but the smallest customers in the target
market are buildings where one person is administrator, resident and porter on
different days, and a rule that forces them to hold two accounts is a rule they
will work around.

---

## Consequences

**One new frontend dependency**, `jsqr`. It turns pixel data into text and makes
no network calls; the video never leaves the device and no frame is stored — the
same promise the permit screen already makes when it *draws* a QR.

**No new Firestore index.** The code is found by a single-field equality match,
which Firestore indexes on its own. The history screen will need indexes on
`access_events`, and they are not declared yet because nothing reads them yet.

**A Firestore TTL policy must be switched on in Google Cloud** for
`access_events.expires_at`. Every record already carries the field, but writing
the field is not the same as enabling the policy — the same trap as declaring an
index without deploying it (Decision 007). **Until that policy is enabled,
nothing deletes an old check.** Recorded as a known issue, and in
`../architecture/developer-guide.md`.

**The camera has not been proved against a real camera.** `jsqr` was proved to
decode exactly the QR the permit screen draws, and the screen falls back to the
typed code cleanly, but no phone camera has yet read a real permit. This must
happen before a guard uses it.

**Entry-notification email stays unbuilt** (US-005), for the reason recorded in
Decision 007. The resident sees the entry in the app instead — once the entry
history screen exists, which is the next unit.

**What we give up:** the product cannot yet answer "who came in yesterday". Every
check is being recorded from today, so the history exists before the screen that
shows it does.
