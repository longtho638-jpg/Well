# Formbricks Frontend & Platform Research

## 1. Turborepo Monorepo Structure
**Problem:** Multiple apps (web, widget, docs) + shared packages need coordinated builds.
**Solution:** Turborepo with `apps/` (web dashboard, docs) + `packages/` (@formbricks/api, @formbricks/js, @formbricks/ui, @formbricks/types, @formbricks/lib, @formbricks/database). Each package independently versioned and testable.
**Key decisions:** Types package shared everywhere. UI package for consistent components. API package = typed client. Database package isolates Prisma. Strict dependency direction: apps → packages, never reverse.
**Well lesson:** Even without monorepo, organize src/ like packages: types/, ui/, services/, lib/. Clear dependency direction. Shared types prevent interface mismatches between portal and admin panel.

## 2. Survey Builder UI
**Problem:** Non-technical users need to create complex surveys visually.
**Solution:** Drag-and-drop question editor. Question type palette (sidebar). Live preview pane. Logic builder with visual flow. Undo/redo stack. Auto-save.
**Key decisions:** Builder state = React state mapping to survey JSON. Every UI change = JSON mutation. Preview renders same component used in production widget. Undo/redo via state history stack.
**Well lesson:** Agent workflow builder could use similar pattern — visual editor for agent conversation flows. Dashboard layout builder (drag widgets). Commission rule builder with visual logic. State = JSON, UI = renderer.

## 3. Analytics & Reporting
**Problem:** Raw responses = useless. Need aggregation, trends, filtering, export.
**Solution:** Summary view (aggregated per question — bar charts, averages, NPS score). Individual response browser (table with filters). Date range filtering. CSV/PDF export. Response tagging.
**Key decisions:** Pre-computed summaries for performance (not real-time aggregation). Filter by date, question, attribute. Export respects filters. Charts use Recharts (same as Well admin).
**Well lesson:** Commission analytics should have summary + detail views. Pre-computed aggregations for dashboard performance. Export functionality for reports. Filter by period, team, product. Recharts already in admin — extend patterns.

## 4. Integration System
**Problem:** Survey responses need to flow to other tools (Slack, CRM, sheets).
**Solution:** Integration config: select trigger (new response, completed survey) → select destination (Slack, webhook, Notion, Airtable) → configure mapping (which fields go where). OAuth for authenticated integrations. Test before activate.
**Key decisions:** Integration = trigger + destination + mapping. Each integration independent. Test mode validates config. Failed deliveries retried. Integration logs for debugging.
**Well lesson:** Order/commission events should integrate with external systems. Webhook dispatch for partner notifications. Integration config UI in admin panel. Event → destination → mapping pattern for any business event.

## 5. Action-Based Feedback Loops
**Problem:** Static surveys miss context. Need to capture feedback at the right moment.
**Solution:** "Actions" = trackable user behaviors (click, page view, custom event). Define action classes (code actions via SDK, no-code via CSS selector/page URL). Survey triggers based on action count/sequence. User identification links actions to profiles.
**Key decisions:** Actions are first-class entities, not just events. Action history per user enables sequencing ("show survey after 3rd purchase"). Session tracking groups actions. No-code actions = point-and-click definition.
**Well lesson:** Track distributor actions (viewed dashboard, made purchase, contacted team, used agent). Trigger contextual help/surveys based on behavior patterns. "After 5th purchase, show upgrade prompt." "After 3 days inactive, trigger re-engagement."
