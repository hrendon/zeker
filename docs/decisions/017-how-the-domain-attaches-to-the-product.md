# Decision 017: How `zeker.com.co` attaches to the product

**Date:** 2026-09-04
**Status:** ✅ Accepted — **decided, and unproven until the domain resolves**
**Deciders:** Software Architect, with FP&A Manager on the cost
**Closes:** step 10 of the ordered list, open since 2026-09-01
**Blocked on:** the Founder's Cloudflare step. Nothing here can be executed
until `zeker.com.co` has nameservers.

---

## What prompted it

`vendors.md` recorded, at purchase, that **the cost this proposal does not
include is how the domain attaches to Cloud Run** — and that the obvious path
costs more than the whole company. It was left open, owned by Software
Architect, and it has been open since.

It became urgent on 2026-09-04, when the Founder ruled out discovery interviews
and chose to let the market decide. A market cannot decide about a product whose
address is `zeker-web-880033266233.us-central1.run.app`.

## The three paths, and their real prices

| Path | Cost | Verdict |
|---|---|---|
| **External Application Load Balancer** | **US$18–25/month ≈ 72,000–100,000 COP** = **3.6×–5× the entire monthly ceiling**, permanently | ❌ **Rejected on cost alone.** It is what a search engine recommends, and it would make the domain the most expensive thing the company owns by a wide margin |
| **Firebase Hosting in front of Cloud Run** | 0 | 🟡 Viable, and not chosen — see below |
| **Cloud Run domain mapping** | 0 | ✅ **Chosen** |

## The decision

**Map both services directly, with Cloud Run domain mappings:**

* `zeker.com.co` → `zeker-web`
* `api.zeker.com.co` → `zeker-api`

Google issues and renews the certificates. There is no second hosting product,
no rewrite layer, and no extra deploy target.

**Checked live on 2026-09-04, not assumed:** `gcloud beta run domain-mappings
list --region us-central1` answers, which means the API accepts this region.
That is evidence the path exists; it is **not** evidence that a mapping
succeeds, and this decision stays unproven until one does.

## Why not Firebase Hosting, which is also free

It has one genuine advantage and it is worth writing down, because it is the
argument for reversing this later: **a Firebase Hosting domain is added to
Firebase Auth's authorized-domain list automatically.** That list is exactly
what R-26 was — the product ran on two addresses, neither was on it, and *no
invitation or password email ever left the application* for anyone. A path where
that list maintains itself removes a whole class of the failure this project has
already had.

It is not chosen because it adds a second hosting product, a second deploy
target and an extra network hop in front of a service that can serve the domain
itself, to solve a problem that is **one line in a script we already own**
(`scripts/autorizar-dominios.sh`).

**The condition to revisit:** if the authorized-domain list is ever wrong again
after this, that is the second occurrence, and the automatic version wins.

## A step nobody had written down, found by running it

**Cloud Run refuses to map a domain that is not verified for the account.**

    ERROR: The provided domain does not appear to be verified for the current
    account. You currently have no verified domains.

Found on 2026-09-04 by running `scripts/conectar-dominio.sh` against the real
project rather than reasoning about it. It appears in no document in this
repository, and it would have appeared for the first time in the middle of the
sitting where the domain was supposed to go live.

It is **the Founder's hands, once, and it lasts forever**: `gcloud domains
verify zeker.com.co` opens a Google page, Google gives a TXT record, the record
goes into Cloudflare, and the page is told to check. **Verifying the root domain
covers its subdomains**, so `api.zeker.com.co` needs nothing of its own.

The script now stops on this with those steps written out, instead of failing
with Google's English error.

**A second thing the same run found, and this one was ours:** the script's own
DNS guard reported "✅ resolves" for a domain that does not exist, because
`nslookup` exits 0 on NXDOMAIN. A guard that passes when the thing it guards is
absent is worse than no guard. Fixed to read the answer instead of the exit
code — **and it is the same shape as R-27**, where a made-up email address made
a broken system report success.

## What has to be true, and what breaks it

**Cloudflare's proxy must be OFF for these records** — the grey cloud, "DNS
only", not the orange one.

This is the one thing that quietly breaks the whole path. With the proxy on,
Cloudflare terminates TLS itself and answers on its own addresses, so Google
cannot validate the domain and **never issues the certificate**. The symptom is
not an error message: it is a mapping that stays "pending certificate" forever
while the site appears to work through Cloudflare on a certificate that is not
ours.

**And the coupling is unavoidable, not a choice:** Cloudflare Registrar requires
the domain's DNS to be hosted at Cloudflare (recorded in `vendors.md` as real
lock-in). So the records live at Cloudflare, and they live there unproxied.

## Consequences

* **The product gets one address, and R-25 finally has an answer.** R-25 has been
  half-open since 2026-09-02: the product answers on two Cloud Run URLs and
  nobody has decided which one *is* the product. From the moment the mapping
  works, **`zeker.com.co` is the address**, and the two Cloud Run URLs become
  what they should always have been — an implementation detail nobody is given.
* **Three things must be updated in the same sitting as the mapping**, or the
  product breaks in exactly the ways it has already broken twice:
  1. `CORS_ORIGINS` in `scripts/desplegar.sh` — a publish replaces the whole
     environment, so an address that is not in that file does not exist (R-28).
  2. The browser API key's allowed referrers (`scripts/arreglar-llave.sh`) —
     R-25's lesson.
  3. Firebase Auth's authorized domains (`scripts/autorizar-dominios.sh`) —
     R-26's lesson, and the one that silently kills every invitation.
* **`firebaseapp.com` comes off the referrer list** once our own `/auth/action`
  page exists, which is a separate item.
* **Cost: zero.** The ceiling is untouched, and the domain's ~5,000 COP/month
  stays the project's only recurring cost.

## Predicted outcome & indicator

**Predicted:** `https://zeker.com.co` serves the product on a Google-issued
certificate, within an hour of the DNS records being created, at no cost.

**Indicator:** the mapping reports a ready certificate, and the site answers
from outside this machine. **Failure looks like** a mapping stuck on
"pending certificate" — and the first thing to check then is whether Cloudflare's
proxy is on.

**Checked by:** whoever runs `scripts/conectar-dominio.sh`, in the same sitting.
Not later.
