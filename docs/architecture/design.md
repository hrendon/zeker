# Design — Zeker

How the product looks and behaves on screen, and why.

This document records the conventions the built screens actually follow. It is
not a catalogue of screens that do not exist yet — those get added as they are
designed and built.

**Owner:** UI/UX Designer
**Last updated:** 2026-08-27
**Related:** `architecture.md`, `developer-guide.md`, `../product/requirements.md`

---

## Who uses this, and on what

Three people, three very different situations:

| Who | Where they are | What that demands |
|-----|----------------|-------------------|
| **Administrator** | At a desk, occasionally | Density is fine. They set things up and rarely come back. |
| **Responsable** (resident, parent, office manager) | On a phone, in a hurry | Few taps. One clear action per screen. |
| **Security staff** | Standing at a gate, on a phone, often in daylight or at night | Large targets, high contrast, works with one thumb, no small text. |

**Security staff set the floor for everything.** A layout that works at a gate
works at a desk; the reverse is not true. So every screen is designed for a
phone first and simply gets more breathing room on a larger display.

---

## Language

The interface is Spanish (Colombia). Every word the user reads lives in
`frontend/lib/strings.ts` — no text is written inside a component. This is not
tidiness: it means adding a second language later is one file and a switch, not
a search through the whole application.

The API answers in error **codes**, never in text for the user. `lib/errors.ts`
is the only place where a code becomes a Spanish sentence. This keeps a
developer's English out of a customer's screen.

Tone: formal *usted*, short sentences, no jargon. "Escriba su correo
electrónico", not "Email inválido".

---

## Layout

**Sign-in, create account, password reset** share one shape:

```text
        ┌─────────────────────────┐
        │  Title                  │
        │  One line of context    │
        │                         │
        │  [ error, if any     ]  │
        │                         │
        │  Label                  │
        │  [ input             ]  │
        │  error under the field  │
        │                         │
        │  Label                  │
        │  [ input             ]  │
        │                         │
        │  [   main action     ]  │
        └─────────────────────────┘
             one link out
```

A single centred card, at most 384px wide, vertically centred, with 16px of
breathing room at the edge of the screen. On a phone the card fills the width;
on a desktop it stays the same size rather than stretching. One screen, one
purpose, one main button.

**Screens after sign-in** use a single column up to 672px wide, left-aligned,
with the person's name and the way out at the top.

---

## The building blocks

Five, deliberately. They live in `frontend/components/ui.tsx`.

| Piece | Rules |
|-------|-------|
| `AuthCard` | The centred card above. Title, optional subtitle, body, optional footer link. |
| `Field` | Label above, input, then either an error or a hint below. Never both. |
| `SubmitButton` | Full width, 44px tall, shows its own "working…" text while busy. |
| `Notice` | A message about the whole form. Red for a problem, green for a success. |
| `TextLink` | The way out of a screen — to sign up, to reset, to go back. |

Three more were added on 2026-08-27, when the setup screens needed shapes the
sign-in screens had no equivalent of:

| Piece | Why it exists |
|-------|---------------|
| `UsageMeter` | Plan usage, as a bar **and** in words. Colour is never the only signal: a bar that looks "nearly full" tells a colour-blind person nothing, and tells a screen reader nothing at all. |
| `ConfirmDialog` | Asks before anything irreversible. Retiring and deleting look alike and are not, and the wording in this dialog is what separates them. |
| `ListRow` | One item plus its actions, behind a menu. A phone row is not wide enough for three buttons kept 44px apart, and putting "delete" a thumb-width from "change" is how records get lost. |

Adding a ninth needs a reason. A small, boring set is what keeps three
different experiences feeling like one product.

---

## Size and touch

* Inputs and buttons are **44px tall**. Below that, thumbs miss.
* Body text is **16px**. On iOS anything smaller makes the browser zoom the
  page when a field is focused, which is jarring and hard to undo.
* The main action is always full width — it cannot be missed or mis-tapped.

---

## Colour

| Token | Use |
|-------|-----|
| `--color-brand` | The one action that matters on the screen |
| `--color-ink` / `ink-soft` / `ink-faint` | Text: main, secondary, quiet |
| `--color-canvas` / `surface` | Page background, card background |
| `--color-danger` + `danger-soft` | Something went wrong |
| `--color-ok` + `ok-soft` | Something worked |

One accent colour, one neutral scale. Colour is never the only signal — an
error is red **and** says what is wrong in words, because a red outline alone
means nothing to a colour-blind guard in bright sun.

---

## Waiting, and failing

Every action that leaves the device shows that it is working: the button
changes its own text and both it and the fields stop accepting input. Nothing
in the product may look idle while it is busy.

Failures are shown in three different places, on purpose:

* **A wrong value in one field** → under that field ("Escriba su correo
  electrónico"). The person knows exactly where to look.
* **The whole action failed** → a red box at the top of the form ("Correo o
  contraseña incorrectos").
* **Something succeeded but there is nothing to show yet** → a green box.

Every one of these is announced to screen readers the moment it appears. A
blind user has no other way to learn that signing in failed.

---

## Two rules that look like design but are security

These are not cosmetic and must not be "improved" for friendliness:

1. **Sign-in never says which half was wrong.** "Correo o contraseña
   incorrectos" — never "esa cuenta no existe". A specific answer lets anyone
   with a list of emails find out who is a Zeker customer.
2. **Password reset gives the same answer either way.** "Si existe una cuenta
   con ese correo, le enviamos un enlace." Confirming that an account exists
   turns the page into a customer list.

See `../security/data-minimization.md`.

---

## Accessibility

Aiming at WCAG 2.1 AA, and currently:

* Every input has a real `<label>` tied to it — not a placeholder pretending to
  be one. A placeholder disappears the moment someone starts typing.
* Errors are linked to their field with `aria-describedby` and marked
  `aria-invalid`.
* Whole-form messages use `role="alert"`, so they are read aloud when they
  appear.
* Every focusable element keeps a visible focus ring. It is never removed.
* The page declares `lang="es"`, so a screen reader pronounces Spanish as
  Spanish.

**Not yet checked:** contrast ratios have not been measured, and no screen
reader has actually been run against these screens.

---

## The setup flow

Added 2026-08-27. From a new account to a building with apartments in it:

```text
sign up  →  no organizations  →  create organization
                                      ↓
                              organization: two tabs
                                 Sedes | Interiores
                                      ↓
                        add a site  →  add apartments
```

Rules this flow follows, each for a reason:

* **An empty screen always offers the one next step.** A new account used to
  land on an empty list and stop there. Every empty state now names what is
  missing and carries the button that fixes it.
* **The organization list is the switcher.** There is no separate control and
  nothing remembered between visits — that is a security rule, not a
  simplification (see below).
* **At the plan limit the button disappears.** Letting someone fill in a form
  that will certainly be refused wastes their time and reads as a fault.
* **Retire and delete are told apart by words, not colour.** Retiring keeps the
  record and its plan place; deleting frees the place and cannot be undone.
* **A refusal says what to do.** "That conflicts with something" is not a
  message; "the site still has apartments, remove them first" is.
* **Someone who is not an administrator sees the list and a line saying why the
  actions are missing** — not buttons that fail when pressed.

### Which organization am I looking at

It lives in the web address and nowhere else. Not in browser storage, not
remembered between sessions.

This is a security requirement. One person can administer one building and be a
plain member of another. Anything about an organization that survives a switch
can be painted onto the next organization's screen — which would reopen, in the
browser, exactly the separation that closing the database was meant to
guarantee. The cost is small: someone managing several organizations picks one
each time they sign in.

---

## Not yet designed

The responsable and security experiences, and the screens for permits and the
QR scan at a door. The conventions above apply to them when they are designed.
