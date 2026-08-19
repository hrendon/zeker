# Product Brief — Zeker

## Problem

Organizations (residences, schools, daycares, offices) struggle to manage access control:
- Who is authorized to enter?
- During what dates and times?
- For what purpose?
- What can they do once inside?
- Did they actually enter, and when did they leave?

Current solutions: manual lists, paper registers, fragmented systems, no audit trail.

## Users

1. **Admin** (e.g., building administrator, school director)
   - Creates org, defines locations, manages users, views reports
   
2. **Responsable/Authorizer** (e.g., parent, resident, manager)
   - Creates access permits for others
   - Generates QR codes
   - Revokes permits
   - Views entry logs
   
3. **Security Personnel** (e.g., guard, receptionist)
   - Scans QR code
   - Verifies authorization is valid
   - Registers entry/exit

## Market & Opportunity

**Initial segment (validation):** Schools & daycares (Colombian market)
- High pain point: parent pickup authorization = security + liability
- Clear decision-maker: school director
- Willingness to pay: high (safety of children)
- Market size: ~3,500 schools in Colombia, expandable to Latin America

**Adjacent segments (Phase 2):** Residences, offices, enterprises

**Geographic expansion:** Colombia (validation) → 1-2 countries → regional Latin America

## Value Proposition

Not "QR generator for visitors." Instead: **digital authorization & access management platform**

A parent creates a permit: "John can pick up Maria on Fridays 3-5pm." The system generates a code, John scans it, the system verifies:
- Is the authorization active?
- Is John entering the right location?
- Is the time within allowed range?
- Is John authorized for this action (pickup)?

If all checks pass: entry is registered, parent notified. Complete audit trail.

## MVP Scope

**What we build:**

- [x] Create organization (name, type)
- [x] Add access points/locations
- [x] Create time-bound authorizations (person → location → date range)
- [x] Generate QR codes (locally, client-side)
- [x] Validate authorization (scan, verify, register entry)
- [x] Revoke authorization
- [x] View access logs (simple history)
- [x] Basic notifications (email to parent when child checked in)

**What we explicitly do NOT build in MVP:**

- ❌ Recurring authorizations (Phase 2)
- ❌ Complex notifications/alerts
- ❌ Advanced reportingß (Phase 2)
- ❌ Hardware integrations (turnstiles, doors, cameras — Phase 2)
- ❌ Authorization rules engine (Phase 2)
- ❌ Biometric/facial recognition
- ❌ Automatic billing/invoicing
- ❌ Mobile native apps (web + PWA only)

## Success Criteria (MVP)

- Can create org, locations, authorizations in <5 minutes
- Can scan QR and register entry in <2 seconds
- No QR/code rejected that should be valid
- Complete audit trail of all access events
- Multi-org admin pattern works (one user manages multiple orgs)
- System stays under GCP free tier during development/early users

## Monetization (MVP)

**Freemium:**
- FREE: 1 org, 10 active authorizations, 100 events/month
- PAID: Unlimited (price TBD after validation: ~$25-50/month)

Trigger upgrade: Hit limit

## Not in scope

- Facial recognition / biometrics
- Hardware readers (Phase 2)
- Advanced analytics
- Custom integrations
- Mobile-native apps
- Real-time notifications (email only)
- Recurring permits (Phase 2)

## Next Steps

1. **Finalize architecture & data model** (Architect)
2. **Confirm security & privacy rules** (Security Engineer)
3. **Build MVP backend** (Backend)
4. **Build MVP frontend** (Frontend)
5. **Deploy on GCP + Vercel**
6. **Test with real users** (schools, residences)
7. **Measure retention & usage**
8. **Iterate based on feedback**

---

**Owner:** Product Owner
**Last updated:** 2026-08-18
**Status:** In development (Camino B)
