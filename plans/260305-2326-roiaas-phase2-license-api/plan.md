## ROIaaS Phase 2 - License Validation API & PayOS Webhook

### Phase 2 Goals (HIẾN PHÁP ROIAAS)
1. **Engineering ROI**: Server-side license validation API
2. **Operational ROI**: PayOS subscription webhook → auto license activation

### Components
| Component | Location | Purpose |
|-----------|----------|---------|
| License Validation API | `src/api/license/validate.ts` | Server-side license check |
| PayOS Webhook Handler | `src/api/webhooks/payos-subscription.ts` | Handle subscription events |
| License Service | `src/services/license-service.ts` | License CRUD operations |
| Security Tests | `src/lib/__tests__/raas-gate-security.test.ts` | Bypass vulnerability tests |

### Features Gated
- `adminDashboard` - Admin access
- `payosWebhook` - PayOS production webhook handling
- `commissionDistribution` - MLM commission logic
- `policyEngine` - Policy configuration

### Implementation Steps
1. Create license validation API endpoint (Edge Function)
2. Implement PayOS subscription webhook handler
3. Add license service for DB operations
4. Write security audit tests
5. Update documentation

### Security Considerations
- HMAC signature verification for webhooks
- Rate limiting on validation endpoint
- Server-side validation (never trust client)
- Audit logging for all license events
