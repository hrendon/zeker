---
description: Build or redesign a user-facing interface by explicitly consulting the UI/UX Designer, Advertising Strategist, and Advertising Copywriter subagents before implementing — so hierarchy, positioning, and real copy are actually in the output, not skipped.
---

Build the following interface: $ARGUMENTS

This exists because a single model pass, asked to "build an interface," defaults to writing code directly and skips design hierarchy, audience strategy, and real copy — even when those roles are documented as active in `roles/role-registry.md`. Recording a role as active does not make it apply itself. This command makes the consultation happen structurally instead of relying on the model to remember it.

## Steps

1. **Phase 1 — parallel, independent research.** In a single message, call the Agent tool twice in parallel:
   - `ui-ux-designer`, with the interface description above, to produce the information hierarchy, layout structure, and usability requirements.
   - `advertising-strategist`, with the same interface description, to produce the target audience, core angle, and what should make them act.

   Do not skip this step because the interface "seems simple" or "is just a form." That's the exact failure this command exists to prevent.

2. **Phase 2 — grounded copy.** Once Phase 1 returns, call the Agent tool once for `advertising-copywriter`, passing it the Advertising Strategist's brief from Phase 1 (and the UI/UX Designer's hierarchy, if it helps structure the copy). Do not let the copywriter invent its own angle when a strategist brief already exists.

3. **Implement.** Build the interface using all three outputs together:
   - the designer's hierarchy and layout govern structure;
   - the copywriter's actual text is used verbatim, not paraphrased into placeholder copy;
   - the strategist's angle should be visibly reflected in what's emphasized (what's first, what's biggest, what's repeated).

4. **Surface conflicts, don't silently drop them.** If the copywriter's text doesn't fit the designer's layout, or the designer's hierarchy buries what the strategist says is the strongest argument, say so explicitly and resolve it — don't quietly pick one side and discard the other.

5. **Record what happened.** If a project has `roles/role-registry.md` or `PROJECT_STATE.md`, note that this interface was built through this three-role consultation, so a later session (or a later Definition of Done check, `mantis.md` §31) can see it actually happened rather than having to infer it from the output.
