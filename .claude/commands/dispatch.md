---
description: General-purpose role dispatcher for any request. Decomposes the request into its constituent concerns, matches each to its active owning role (roles.md), consults each one as a real role-agent subagent, then implements — instead of relying on a single pass to remember every relevant role.
---

Request: $ARGUMENTS

This exists because a single model pass silently defaults to the most obvious interpretation of a request and skips roles whose scope is real but less visible — even when `roles/role-registry.md` correctly lists them as active. `mantis.md` §7.1 and §31 already say this shouldn't happen; this command makes it not happen structurally, by forcing separate, real subagent calls instead of hoping one pass remembers all of them.

Use this for any request where more than one active role's scope might be touched. For a request that's clearly single-role (a local bug fix, a one-line copy edit), just do the work directly — this command is for the cases the framework keeps losing, not every interaction.

## Steps

1. **Bootstrap check.** If the role registry does not exist (`docs/roles/role-registry.md` in the standard layout, or `roles/role-registry.md`), stop and run the Bootstrapping Protocol (`roles.md` §9) first — do not guess which roles are active.

2. **Decompose.** Break the request into its constituent concerns (`mantis.md` §7.1). Do not treat it as one indivisible unit — a request can span design, copy, security, data, pricing, and more at once. Name each concern separately, in plain language.

3. **Match.** For each concern, find its owning role in `roles.md` §3/§4, then confirm that role is listed as active in `roles/role-registry.md`. Skip concerns whose owning role isn't active — do not invent activation on the spot (`roles.md` §5, §9). If a concern is clearly real but its owning role isn't active (e.g. the request needs a pricing call and no commercial role is active), say so explicitly rather than silently dropping it or silently answering without it. A concern whose decision-maker is a Human-Held role (Founder/CEO, Board/Investors — `roles.md` §2) is never sent to `role-agent`: have the other roles assemble the evidence and options, then put the decision itself to the human.

4. **Consult — and route each call to the cheapest capable model.** For every active role matched in step 3, call the Agent tool with `subagent_type: role-agent`, telling it exactly which role to embody (the exact name from `roles.md` §4) and the specific concern-scoped task — not the whole original request verbatim. Run roles that don't depend on each other in parallel, in a single message. Run roles that depend on another's output (e.g. copy needing a strategy brief first) sequentially, passing the earlier role's output forward explicitly.

   Model routing follows `execution.md` §5's Model Tier: the agent file's default (`haiku`) fits bounded 🟢 briefs, which is most consultations. Override per call with the Agent tool's `model` parameter only when the task warrants it — step up (`sonnet`, or inherit the session model by passing nothing stronger than needed) for a consultation whose judgment quality directly shapes a 🟡/🔴 decision, e.g. a security review or an architecture assessment feeding a gate. Never route a routine brief to the strongest model because it's "safer" — that judgment call is exactly what the tier table exists to replace.

5. **Reconcile, don't pick a favorite.** If two roles' outputs conflict (e.g. a security constraint the design pass didn't account for), surface the conflict explicitly and resolve it — using the Inter-Role Communication & Debate Protocol (`roles.md` §7) when it's a genuine cross-role disagreement, not by silently keeping whichever came back first.

6. **Implement**, using every consulted role's output — not just the most obvious one.

7. **Record what happened.** If the project has `PROJECT_STATE.md` or `roles/role-registry.md`, note which roles were consulted for this request and when, so a later session or Definition of Done check (`mantis.md` §31) can see it actually happened rather than inferring it from the output alone.

8. **Report in the managerial register.** The final response to the user follows `preferences.md`: lead with what happened and what it means for the project, in business language a non-technical founder reads in seconds — no artifact names, gate codes, or internal IDs in the summary. Technical detail goes below it or waits to be asked for. The consulted roles' full outputs are working material, not the deliverable.

Do not skip straight to implementation because the request "only really needs" one role. That judgment is exactly what steps 2–3 exist to make explicit instead of assumed.
