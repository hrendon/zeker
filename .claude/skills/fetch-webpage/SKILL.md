---
name: fetch-webpage
description: Fetch an external webpage or API from the operator's own machine (their IP), for when hosted fetch tools are blocked by datacenter-IP filtering. Use whenever a page must be validated, scraped, or checked and the hosted web tools fail or would likely be blocked.
---

# Fetch a webpage from the operator's machine

Hosted web-fetch tools exit from datacenter IPs, which many platforms rate-limit or block. Requests made from the operator's own machine — terminal commands and the browser integration — leave from the operator's residential IP and are treated like a normal visitor. This skill is the standard procedure; it operates inside the Network Access Policy (`README.md`, Agent Framework section), which always applies.

## Procedure

1. **Static pages and APIs — use `curl` in the terminal:**

   ```bash
   curl -sL --max-time 30 "https://example.com/page"
   ```

   Add `-H "Accept-Language: ..."` or an `Accept:` header when the response depends on it. Save to a file in the scratchpad or `docs/working/` if the content needs further processing.

2. **JavaScript-heavy pages** (content loads after the page renders) — use the browser integration instead of `curl`: navigate to the URL and read the page. The browser is a real, local browser; what it sees is what a human visitor sees.

3. **Repeated fetches** (checking many pages of one site): space requests out — one request every few seconds, not bursts. The operator's IP is their identity; getting it rate-limited or flagged harms them directly.

## Hard limits — no task overrides these

* Never bypass CAPTCHAs, bot-detection challenges, or login walls. If a site challenges the request, stop and report it — the operator decides what to do, possibly by visiting the page themselves.
* Respect the site's terms of service and rate limits. Traffic that must disguise itself to be allowed is traffic that must not be sent.
* Never send the operator's credentials, cookies, or session tokens as part of an automated fetch.
* Never put personal data in URLs or query strings.

## When this skill is not enough

If a fetch genuinely requires a different network origin than this machine (e.g. the agent is running in a cloud environment, not on the operator's machine), do not improvise a workaround — surface it. The proxy conditions in the Network Access Policy (authenticated, private-network-only, allowlisted, logged) are the only acceptable path, and setting one up is the operator's decision.
