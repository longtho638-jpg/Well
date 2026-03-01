# Cal.com Backend Architecture Research

## 1. Monorepo Structure (Turborepo)
**Problem:** Large codebase with 50+ packages needs fast builds, clear boundaries.
**Solution:** Turborepo with apps/ (web, api, swagger) + packages/ (core, prisma, lib, features, trpc, ui, emails, embeds). Each package = npm workspace with own tsconfig, own exports.
**Key decisions:** Feature-based packages (`@calcom/features/bookings`), shared types via `@calcom/types`, DB layer isolated in `@calcom/prisma`. Turborepo caches builds — only rebuilds changed packages.
**Extensibility:** New features = new package. Zero coupling if boundaries respected.
**Well lesson:** Extract shared logic into packages/ (e.g., `@well/types`, `@well/services`, `@well/ui`). Even without monorepo, package-thinking improves modularity.

## 2. tRPC API Layer
**Problem:** REST APIs lose type safety between client-server. Manual validation.
**Solution:** tRPC routers with Zod input schemas. Procedures grouped by domain: `viewer.bookings.get`, `viewer.teams.list`. Middleware chain: auth → rate-limit → logging → procedure.
**Key decisions:** Merged routers pattern — each feature exports a router, merged at top level. Context injection (user, prisma, session). Protected vs public procedures.
**Extensibility:** Add new router = add new file, merge into root. Full end-to-end type safety.
**Well lesson:** Supabase Edge Functions can adopt router-like pattern. Group functions by domain. Zod validation on all inputs. Middleware chain concept for auth/logging.

## 3. Event Type System (Core Domain)
**Problem:** Scheduling has complex domain: availability, time zones, conflicts, recurring, team scheduling.
**Solution:** EventType model as core entity. Links to Schedule (availability rules), User (host), Location (where), Workflow (automations). Booking = instance of EventType. Round-robin and collective scheduling via assignment strategies.
**Key decisions:** EventType is highly configurable (duration, buffer, limits, questions, payments). Strategy pattern for host assignment. Slots calculation engine.
**Well lesson:** Product catalog should be rich domain model like EventType. Commission rules, tier configs, bonus structures = configurable entities. Strategy pattern for commission calculation.

## 4. Webhook & App Store Architecture
**Problem:** 40+ integrations (Google, Zoom, Stripe, HubSpot) each with different auth, API, webhooks.
**Solution:** App Store model — each integration = "App" with metadata, credentials, API adapter. Apps installed per user/team. Webhook manager dispatches events to subscriber URLs. OAuth flow abstracted per app.
**Key decisions:** `AppCategoryType` enum (calendar, video, payment, messaging, crm). Each app implements standard interface (`createMeeting`, `deleteMeeting`, `getAvailability`). Credential storage per user.
**Extensibility:** New integration = new app package implementing interface. No core code changes.
**Well lesson:** Agent system should work like App Store. Each agent = installable app with metadata + standard interface. Integration layer for PayOS, Gemini, Supabase = app adapters. Webhook dispatch for order events.

## 5. Multi-Tenancy & Teams
**Problem:** Users belong to teams, orgs need data isolation, role-based access.
**Solution:** Organization → Team → Member hierarchy. Roles: OWNER, ADMIN, MEMBER. Org-level settings override team settings. Managed users (org provisions accounts).
**Key decisions:** `membership` table with role enum. Org slug for routing. Team-level event types. Profile delegation. Impersonation for support.
**Well lesson:** Distributor network = natural org hierarchy. Upline = team owner. Downline = members. Commission visibility scoped by role. Team-level dashboards. Network-based data isolation.
