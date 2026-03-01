# Formbricks Core Architecture Research

## 1. Survey Engine (JSON Schema)
**Problem:** Hard-coded surveys = inflexible. Non-technical users can't create/modify surveys.
**Solution:** Survey defined as JSON: questions array, each with type, logic, validation, piping. Question types: open-text, multiple-choice, rating, NPS, CTA, consent, matrix. Conditional logic = branching rules per question. Survey versioning tracks schema changes.
**Key decisions:** Survey = data (JSON), not code. Questions composable. Logic separate from presentation. Piping enables dynamic content (`{{respondent.name}}`). Versioning enables A/B testing.
**Well lesson:** Distributor onboarding flows, training quizzes, satisfaction surveys — all definable as JSON schemas. Commission rule configurations as structured JSON. Agent conversation flows as survey-like decision trees.

## 2. Targeting & Triggers
**Problem:** Showing surveys to ALL users = low response, high annoyance. Need precision targeting.
**Solution:** Event-based triggers (page visit, button click, custom event). User attribute targeting (role, plan, signup_date). Segment targeting (power users, churning users). Display rules: frequency caps, delay, percentage sampling.
**Key decisions:** Triggers = decoupled from survey. One survey, multiple trigger configs. Segment = saved filter. Sampling prevents over-surveying. Cool-down periods.
**Well lesson:** Show contextual prompts/surveys to distributors based on behavior. Trigger agent coaching when sales drop. Target training content to new distributors. Commission achievement celebrations triggered by milestone events.

## 3. Widget SDK & Embed
**Problem:** Survey tool must integrate into ANY website with minimal effort.
**Solution:** Lightweight JS SDK (~15KB). Single script tag to load. `formbricks.init({ environmentId })` configures. SDK listens for triggers, renders survey widget. Works with React, Vue, vanilla JS. Multi-environment (dev/staging/prod).
**Key decisions:** SDK is framework-agnostic. Async loading (non-blocking). Environment isolation. Widget styles encapsulated (Shadow DOM). SDK auto-updates.
**Well lesson:** Agent widgets could be SDK-based — embed Sales Copilot in external partner sites. Widget SDK pattern for distributor tools. Environment-based config for dev/staging/prod agent behavior.

## 4. Response Pipeline
**Problem:** Responses need validation, storage, real-time updates, and integrations.
**Solution:** Response → validate → store → notify. Real-time response streaming to dashboard. Webhook dispatch on new response. Integration pipeline (Slack notification, CRM update, spreadsheet append).
**Key decisions:** Pipeline is event-driven. Each step independent (fail doesn't block others). Webhooks for extensibility. Response data immutable once stored.
**Well lesson:** Order pipeline should follow same pattern: Order → validate → store → notify (distributor + admin) → integration (commission calc, inventory update). Event-driven architecture with webhook dispatch for external systems.

## 5. Multi-Environment Architecture
**Problem:** Dev surveys polluting production data. No safe testing environment.
**Solution:** Each project has environments (dev, prod). Environment = separate API key, separate data store, separate survey configs. Switch environments without affecting production. Environment-scoped everything.
**Key decisions:** Environment ID in every API call. Data completely isolated. Survey can be "promoted" from dev → prod. API keys scoped per environment.
**Well lesson:** Agent configs should be environment-scoped. Test new agent prompts in dev without affecting production users. Environment-based feature flags. Promote agent configs through environments.
