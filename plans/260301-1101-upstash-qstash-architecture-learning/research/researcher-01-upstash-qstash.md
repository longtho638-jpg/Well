# Upstash QStash Architecture Research

## 1. HTTP-Based Message Queue
**Problem:** Traditional message queues (RabbitMQ, SQS) require infrastructure, SDKs, connections.
**Solution:** QStash = HTTP-based messaging. Send message = POST to URL. Receive = webhook to your endpoint. No persistent connections. Serverless-native. Works with any HTTP endpoint.
**Key decisions:** HTTP as transport (universal, no SDK lock-in). Fire-and-forget publishing. Guaranteed delivery via retry. Dead Letter Queue for failed deliveries.
**Well lesson:** Order processing, commission calculation, notification dispatch — all as HTTP-triggered async jobs. No need for WebSocket workers. Edge Function → QStash → Edge Function chain.

## 2. Scheduled Jobs (CRON)
**Problem:** Serverless functions can't run cron jobs natively. External scheduler needed.
**Solution:** QStash Schedules = managed CRON. Define schedule + target URL. QStash calls your endpoint on schedule. Timezone support. Pause/resume. History tracking.
**Key decisions:** Schedule = CRON expression + HTTP endpoint. Managed (no infra). Automatic retry on failure. Dashboard for monitoring.
**Well lesson:** Daily commission aggregation, weekly reports, monthly cleanup — all as scheduled HTTP calls. Distributor engagement reminders. Automated report generation.

## 3. Fanout & Batch Processing
**Problem:** One event needs to notify multiple services (commission calc + notification + analytics + webhook).
**Solution:** Topics + Subscriptions. Publish to topic → QStash delivers to all subscribers. Each subscriber independent (one failure doesn't block others). Batch API for bulk publishing.
**Key decisions:** Pub/Sub model. Subscribers = HTTP endpoints. At-least-once delivery. Ordering not guaranteed (design for idempotency).
**Well lesson:** Order placed → fanout to: commission service, notification service, analytics tracker, webhook dispatch. Single publish, multiple consumers. Each consumer independently retries.

## 4. Retry & DLQ (Dead Letter Queue)
**Problem:** Downstream services fail. Messages lost without retry. No visibility into failures.
**Solution:** Configurable retry: max retries, backoff schedule. Failed after all retries → DLQ. DLQ browsable, replayable. Retry headers in request for downstream awareness.
**Key decisions:** Exponential backoff by default. Custom retry schedules. DLQ inspection API. Manual replay from DLQ. Retry count header (`Upstash-Retried`).
**Well lesson:** Failed commission calculations retry automatically. DLQ for investigation. Failed notifications don't block order processing. Admin dashboard shows DLQ items.

## 5. Idempotency & Deduplication
**Problem:** At-least-once delivery means duplicates possible. Handlers must be safe to replay.
**Solution:** `Upstash-Deduplication-Id` header prevents duplicate processing. Idempotency keys per message. Content-based deduplication option.
**Key decisions:** Producer sets dedup ID. QStash enforces uniqueness within window. Consumer should ALSO be idempotent (belt + suspenders).
**Well lesson:** Order processing idempotent (check if order already exists before creating). Commission calculation idempotent (upsert, not insert). All event handlers safe to replay.
