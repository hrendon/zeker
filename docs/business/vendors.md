# Vendors — Zeker

**Created:** 2026-09-01 by Procurement / Vendor Manager, on its activation.
**Owner:** Procurement / Vendor Manager. Cost figures are reported from here to
FP&A Manager against `budget.md`.

**The standing rule this file expresses:** every recurring cost is recorded here
with its renewal date and its exit terms **before the card is charged**, not after.
A subscription nobody recorded is a subscription nobody cancels.

---

## Currently paying

### 1. `zeker.com.co` — Cloudflare Registrar ✅ BOUGHT 2026-09-01

**The project's first recurring cost.** The spend committee had deferred this
pending two preconditions; the Founder overrode the deferral and bought. That is
recorded here as what it is — **a purchase made ahead of the control, not one that
passed it** — and the override was reasonable: a name someone else takes cannot be
recovered, and `zeker.com` and every `.com` fallback were already gone.

| Field | Value |
|---|---|
| Domain | `zeker.com.co` |
| Registrar | Cloudflare Registrar |
| Cost | **US$15/year ≈ 60,000 COP/year ≈ 5,000 COP/month** |
| Share of ceiling | **25%** of 20,000 COP/month |
| Bought | 2026-09-01 |
| **Renews** | **2026-09-01 (annually) — set the reminder for 2026-07-18, 45 days ahead** |
| Registrant of record | ⬜ **to verify in WHOIS** |
| Account email | ⬜ **to record — and it must NOT be an address on this domain** |
| Auto-renew | ⬜ **to verify ON, and that the card expires later than the renewal** |
| 2FA + registrar lock | ⬜ to verify |
| WHOIS privacy | ⬜ to verify (included free at Cloudflare — never pay separately) |
| Status | 🟡 **Registered but not resolving.** See below |

**Why `.com.co` and not the recommendation.** Procurement recommended `zeker.com`
at US$10.44 (17% of the ceiling). It was not available, and neither were the
`.com` fallbacks. `.com.co` at US$15 was the recorded next choice, and it carries a
real advantage the recommendation already noted: it is unambiguously Colombian and
keeps the clean name rather than an invented compound. **It costs 8 more percentage
points of the ceiling than `.com` would have.** That is the whole delta.

**Open right now: "Invalid nameservers."** Verified from outside on 2026-09-01 —
`zeker.com.co` returns NXDOMAIN from both Google and Cloudflare public resolvers,
which means the `.com.co` registry has no nameserver delegation for it yet. That is
consistent with the message and is a **setup step, not a fault in the purchase.**
Cloudflare Registrar requires the domain's DNS to be hosted at Cloudflare, so the
zone has to exist and be active before the delegation is valid. See the steps in
`PROJECT_STATE.md`.

**Still unresolved and still blocking, unchanged by the purchase:** how the domain
attaches to Cloud Run. The load-balancer path costs **3.6×–5× the entire ceiling**.
Owner: Software Architect. Nothing should be pointed anywhere until that is settled.

### 2. Everything else

Inside a free tier — a claim that is **asserted, not verified**; see `budget.md`
and `risks.md` R-10. `npm run costs` now measures how full each free tier is.

---

## The purchase record that produced decision 1 above

All prices below are **approximate market figures from knowledge, not checked
quotes.** FX: 4,000 COP/USD, taken from `budget.md`'s own US$5 ≈ 20,000 COP.

### Which domain — recommended: `zeker.com`

| Option | Renewal (aprox.) | COP/year | COP/month | % of ceiling | Verdict |
|---|---|---|---|---|---|
| **`.com`** | US$10.44 (Cloudflare, at cost) | ~41,760 | ~3,480 | **17.4%** | **Recommended** |
| `.com.co` | US$15 | ~60,000 | ~5,000 | 25% | Fallback |
| `.co` | US$28 | ~112,000 | ~9,333 | **46.7%** | **Rejected** |

**Why `.com`:** the buyer is a 45–60-year-old administrator of a horizontal-property
complex, not a startup founder. `.com` is the reflex; browsers and phone keyboards
autocomplete toward it, and a person told *"zeker punto co"* on a phone call will
type `.com` a meaningful share of the time and land nowhere. `.co` is Colombia's
ccTLD but is priced as a global premium startup TLD — nearly half the company's
entire monthly budget, permanently, for a name, buying zero delivery capability.

**Availability is not claimed.** `zeker` is a common Dutch word, which materially
raises the odds it is registered, parked, or priced as a **premium** domain (hundreds
to thousands of USD — treat that outcome as "taken"). Check in this order:

> ### ✅ Checked independently 2026-09-03, and the fallback was right
>
> The Founder asked whether buying a Colombian domain was a mistake for a
> product that might one day be sold across LATAM. It was not, and this is the
> evidence rather than the reassurance. Every obvious global name **already had
> an owner before the purchase** — each one resolves to real nameservers:
>
> | Name | 2026-09-03 |
> |---|---|
> | `zeker.com` | taken |
> | `zeker.app` | taken |
> | `zeker.io` | taken |
> | `zeker.co` | taken |
> | `zekerapp.com` | taken |
> | `zeker.cl` | taken |
>
> `zeker.com.co` was not a consolation prize: it was the last surviving step of
> a fallback pattern agreed **before** the search, which is exactly how this
> ought to go.
>
> **Not delegated, so probably free** — a strong signal, not proof; only the
> registrar's own search proves it: `usezeker.com`, `zeker.lat`, `zeker.mx`.
>
> **And a domain is not a market commitment.** The product runs at any address.
> Selling in Mexico needs a customer in Mexico, not a `.com` — a second domain
> is an addition, and nothing already built changes. **Recommendation: buy
> nothing until a customer outside Colombia exists.** Each domain takes another
> ~20% of a 20,000 COP ceiling, permanently, to serve nobody.


1. `zeker.com` — available at standard price / premium / taken
2. `zeker.com.co` — price, and confirm it is not premium either
3. `zeker.co` — check only to know the number; the answer is still no
4. **Before paying:** confirm the name is not a registered trademark or operating
   company in Colombia (SIC, RUES). **Not Procurement's call — General Counsel, not
   active.**

**Fallback pattern, agreed before the search so it is not chosen under pressure:**
`zekerapp.com` → `zekeracceso.com` → `zekeringreso.com` → `zeker.com.co`.
No hyphens. No `.app`/`.io` — both force the administrator to learn a TLD they have
never typed, and the point of this purchase is to *reduce* friction.

*Naming caveat, outside Procurement's scope:* "Zeker" is Dutch, and `k` is rare in
Spanish. Expect "zequer", "seker". That is a naming problem, not a TLD problem.

### Which registrar — recommended: Cloudflare Registrar

| Provider | .com renewal (aprox.) | First-year teaser? | WHOIS privacy | Payment from Colombia | Exit / transfer |
|---|---|---|---|---|---|
| **Cloudflare** | US$10.44 — **at cost, no margin** | **No** — year 1 = year 5 | **Included, free, always** | Int'l card, USD | **Clean.** No fee; unlock + auth code in the panel instantly |
| Namecheap | US$17.16 | **Yes** — yr 1 ~US$6, then ~3× | Included on .com | Int'l card or PayPal | Clean, standard |
| Squarespace (ex-Google) | US$20 | No | Included | Int'l card | **Avoid — see below** |
| Local `.co` registrar | COP 90,000–140,000 + IVA | Often | **Often not offered** | COP, no friction | **The weak point** — manual, by ticket, sometimes chargeable |

**Renewal margin.** Cloudflare sells at registry cost with no year-two step-up.
Namecheap's US$6 first year is the classic teaser; the real number is ~US$17 =
**28.6% of the ceiling** versus Cloudflare's 17.4%. Buying on a teaser price is
exactly the accidental buying this role exists to prevent.

**Transfer-out — the dimension people ignore, and squarely this role's scope.** The
domain is the durable asset; the registrar is a replaceable service. A registrar is
acceptable only if leaving it is cheap and self-service. ⚠️ **Local resellers
frequently register the domain in the reseller's own name**, listing the customer as
a "user". If that happens you do not own the domain — you rent it, and you cannot
leave without their cooperation. If a local registrar is chosen for payment
convenience, the non-negotiable precondition is that **the Founder is the registrant
of record, verified in WHOIS after purchase.**

**Vendor continuity — why Squarespace is out, and not on price.** Google sold its
entire Domains customer book to Squarespace in 2023 and customers had no say; their
registrar changed hands underneath them. That is a demonstrated continuity risk, not
a hypothetical one.

**Cloudflare's real lock-in, stated honestly:** Cloudflare Registrar requires the
domain's DNS to be hosted at Cloudflare. You cannot buy there and point nameservers
elsewhere. That is genuine coupling. Acceptable because Cloudflare DNS is free and
the transfer-out path stays open — but it **is** coupling, not "no lock-in."

**To verify before committing** (cannot be checked from here): whether Cloudflare
supports **new registrations** for the chosen TLD rather than transfers-in only, and
whether `.co`/`.com.co` are on its supported list at all. If the fallback is
`.com.co`, Cloudflare may not be an option and the comparison shifts to Namecheap or
Porkbun (~US$11/yr aprox., same at-near-cost, privacy-included, clean-exit profile).

**Payment friction from Colombia:** a Colombian card on a USD charge picks up the
issuer's international fee and FX spread, ~2–3%, plus GMF (4×1000) on a debit card.
Budget ~COP 45,100/year all-in rather than 41,760. *Tax treatment is Tax Advisor's,
not active.*

### The cost line, for the Budget Gate

| Item | Cost | COP/month | % of 20,000 COP ceiling |
|---|---|---|---|
| `zeker.com`, Cloudflare, renewal | ~US$10.44/yr ≈ COP 41,760 | ~3,480 | 17.4% |
| + card/FX/GMF friction (aprox.) | ≈ COP 45,100/yr | ~3,758 | 18.8% |
| Verified email sender (free tier) | **COP 0** | 0 | 0% |
| **Total new recurring spend** | **≈ COP 45,100/yr** | **~3,758** | **~19%** |

**It fits** on an amortized basis, leaving ~16,250 COP/month of headroom. It would be
the project's **first recurring cost.** On a cash basis it is 2–3× the monthly
ceiling in the month it is paid — the convention question the Founder must settle.

### ⚠️ The cost this proposal does NOT include, and must be settled first

**How the domain attaches to Cloud Run.** A Google Cloud external Application Load
Balancer runs roughly **US$18–25/month = 72,000–100,000 COP/month = 3.6×–5× the
entire ceiling**, permanently. The free paths are Cloud Run **domain mapping**
(region-limited — confirm for `us-central1`) or **Firebase Hosting** in front (free
Spark tier, free managed SSL, free custom domain). **Owner: Software Architect,
before purchase.**

### The email sender — a separate proposal, at COP 0

**Owning a domain does not fix the spam issue.** The fix is a verified sender *on*
that domain — SPF, DKIM and DMARC published, with Firebase Auth sending through it
instead of `noreply@zeker-505918.firebaseapp.com`. The domain is the prerequisite,
not the fix.

- **Resend** — ~3,000 emails/month, 100/day, 1 domain, guided DKIM/SPF, SMTP
  compatible with Firebase Auth's custom-SMTP setting. **COP 0.**
- **Brevo** — ~300 emails/day free, unlimited contacts, SMTP. **COP 0.**
- **SendGrid** — its free plan changed and may no longer exist for new accounts.
  *Uncertain — verify before choosing.*
- **Amazon SES** — cheaper at volume but requires leaving the GCP stack. Not
  recommended at this size.

**Does free hold?** Yes, by a wide margin. A ten-apartment building's full onboarding
is 10–20 emails, once. Fifty buildings at twenty people each is ~1,000 emails, once —
inside Resend's monthly free tier with 3× headroom.

⚠️ **But record the cliff now: there is no affordable step above free.** Resend's
first paid tier is ~US$20/month = ~80,000 COP = **4× the whole ceiling**; Brevo's is
~US$9/month = ~36,000 COP = **1.8× the ceiling**. Free-tier headroom is therefore
itself a budget constraint to be monitored, not assumed.

### Controls that must be in place **at purchase**, not later

1. **Auto-renew ON**, and verify the card's expiry is later than the renewal date.
   An expired Colombian card is the single most common cause of an accidental lapse.
2. **The registrar account's contact email must NOT be on the domain being
   purchased.** Use the existing Gmail. If the recovery email lives on the domain and
   the domain lapses, the recovery path is circular and gone.
3. 2FA on the registrar account; registrar lock ON; WHOIS privacy ON — and never pay
   separately for it.
4. Renewal date, registrant of record and account email recorded in this file, with
   a calendar reminder 45 days ahead.
5. Registrant is the Founder — **verified in WHOIS after purchase.**

### If we stop paying

Renewal grace ~30–45 days at normal price → redemption ~30 days at a **redemption
fee of US$80–150 ≈ COP 320,000–600,000, which is 1.3×–2.5× this project's entire
annual budget** → pending delete ~5 days → dropped, and anyone may register it.

**The Zeker-specific failure is worse than losing a website:** DKIM and SPF stop
validating, Firebase Auth's password emails fail or return to spam, the Cloud Run
domain mapping breaks, and **the product's entire onboarding path dies silently.**
A third party who re-registers the lapsed domain can stand up a mail server on it
and receive address-based recovery mail. That is a security incident.

**What this really locks us in to is the name, not the registrar.** A domain moves
between registrars in ~5 days for one year's renewal — which is exactly why
transfer-out terms decided the recommendation. What is *not* portable is the string
once it is on printed QR material, in administrators' bookmarks, in the Firebase
action-link domain, and — most bindingly — **in the DKIM/SPF records that give the
sender its reputation. Email sender reputation is built on a domain over months and
does not transfer.** Changing the domain after the spam fix means starting reputation
from zero and reliving the current 🔴 issue.
