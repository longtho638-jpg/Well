# SaaS Billing System Patterns & Best Practices (2026)

**Research Date:** March 1, 2026 | **Report Scope:** Invoice generation, metering, multi-currency, tax compliance, revenue recognition

---

## 1. INVOICE GENERATION PATTERNS

### Stripe Billing Model
- Invoices auto-generated per billing cycle; finalized ~1h after webhook success
- Supports metered usage aggregation across multiple meters during generation
- Prorated invoices auto-created between subscription creation and first full cycle

**TypeScript Example:**
```typescript
// Async invoice generation with metering
const invoice = await stripe.invoices.create({
  customer: 'cus_xxx',
  subscription: 'sub_xxx',
  collection_method: 'charge_automatically',
  auto_advance: false, // Finalize manually after 1hr
});

// Meter usage aggregation
const usage = await stripe.billing.meterEventAdjustments.create({
  event_name: 'tokens_used',
  timestamp: Math.floor(Date.now() / 1000),
  customer_id: 'cus_xxx',
  value: 5000,
});
```

### Polar.sh Events → Meters → Metered Pricing
- Event-driven: send usage → meters aggregate → auto-invoice monthly
- Events ingested via API, stored, filtered by Meters
- Metered Prices charge based on aggregated event data
- Handles renewals, proration, dunning, trials automatically

**Decision:** Stripe for hybrid; Polar for usage-first

---

## 2. BILLING CYCLE & PRORATION

### Billing Anchors (Stripe, Lago, Orb)
```typescript
interface BillingCycle {
  anchor_day?: number;        // Normalize renewal to specific date
  billing_cycle_anchor?: Date; // Reset each cycle
  proration_behavior: 'create_prorations' | 'none' | 'always_invoice';
}

// Example: $99/mo on 15th, upgrade day 20 → prorate 5 days
const prorated = calculateProration(
  cycleStart: 2026-03-15,
  changeDate: 2026-03-20,
  oldPrice: 99,
  newPrice: 299,
  daysInCycle: 31
) // Returns: 99 + (200 * 5/31) = $131.33
```

### Lago Flexibility
- Supports complex plan hierarchies + billable metrics
- Automizes proration on plan changes, adds, removals
- Handles tax calculation, digital delivery per jurisdiction

---

## 3. USAGE-BASED BILLING ARCHITECTURE

### Orb Pattern (Multi-meter, Multi-segment)
```typescript
interface MeterConfig {
  id: string;
  name: string;
  aggregation_type: 'sum' | 'max' | 'unique' | 'count_distinct';
  grouping_keys?: string[]; // e.g., ['region', 'tier']
}

interface PricingModel {
  meter_id: string;
  tier_type: 'flat' | 'per_unit' | 'tiered' | 'package';
  tiers: [{
    first_unit: number;
    last_unit?: number;
    unit_price: number; // in cents
  }];
  minimum?: number;
  maximum?: number;
}

// Invoice = base_fee + sum(meter_usage * pricing_model) + taxes
```

### Lago Event Processing
- Processes 15,000 events/sec
- Real-time usage aggregation
- Supports pay-as-you-go + prepaid credits + progressive billing
- Event filters: `sum`, `max`, `unique_count`, `latest`

---

## 4. MULTI-CURRENCY & TAX COMPLIANCE

### Stripe Tax + Avalara Integration (2025 Enhanced)
```typescript
// Native Stripe Tax (simple SaaS)
const invoice = await stripe.invoices.create({
  customer: 'cus_xxx',
  automatic_tax: { enabled: true },
  currency: 'usd',
});

// Avalara (complex multi-jurisdiction)
const tax = await avalara.transactions.create({
  customerCode: 'cus_xxx',
  date: new Date(),
  lines: [{
    number: '1',
    amount: 99,
    itemCode: 'SAAS_SUBSCRIPTION', // Digital goods
  }],
  addresses: {
    shipFrom: { latitude, longitude },
    shipTo: { latitude, longitude },
  },
});
```

### Multi-Currency Strategy
1. **Customer Presentment Currency** — store subscription in customer currency
2. **Settlement Currency** — convert to business home currency for reporting
3. **Automatic Exchange Rates** — Stripe applies current rate on invoice finalization
4. **Zero Decimal Amounts** — Stripe Tax handles currency properly

---

## 5. CREDIT & DEBIT SYSTEMS

### Account Balance Pattern (Lago, Orb)
```typescript
interface CustomerAccount {
  id: string;
  balance: number; // cents; negative = credit due
  currency: string;
}

interface CreditTransaction {
  type: 'debit' | 'credit' | 'refund' | 'adjustment';
  amount: number;
  reason: string;
  invoice_id?: string;
  created_at: Date;
}

// Top-up wallet
const topup = await billing.credits.add({
  customer_id: 'cus_xxx',
  amount: 10000, // $100
  type: 'prepaid',
});

// Auto-debit on invoice
const invoice = await billing.invoices.create({
  customer_id: 'cus_xxx',
  use_available_credits: true, // Auto-apply balance first
});
```

### Refund Workflow
- Credit Note issued on refund (not immediate reversal)
- Balance tracking per subscription/account
- Partial refunds support prorated credits

---

## 6. BILLING DISPUTE & CHARGEBACK RESOLUTION

### Chargeback Workflow
```typescript
enum DisputeStatus {
  UNDER_REVIEW = 'under_review',
  EVIDENCE_SUBMITTED = 'evidence_submitted',
  WON = 'won',
  LOST = 'lost',
}

interface DisputeRecord {
  id: string;
  charge_id: string;
  reason_code: string; // e.g., 'fraudulent', 'unrecognized', 'product_unacceptable'
  amount: number;
  evidence: string[]; // URLs to docs, emails, logs
  status: DisputeStatus;
  response_deadline: Date;
}

// Dunning: auto-retry failed charges
const dunning = {
  max_retries: 3,
  retry_schedule: [0, 3, 5], // days after failure
  webhook_on_final_failure: true,
};
```

---

## 7. REVENUE RECOGNITION (ASC 606)

### Deferred Revenue Tracking
```typescript
interface RevenueSchedule {
  customer_id: string;
  subscription_id: string;
  total_contract_value: number;
  billing_period_start: Date;
  billing_period_end: Date;
  performance_obligation_fulfilled: number; // 0-100 %
  recognized_revenue: number; // = total * fulfilled %
  deferred_revenue: number;   // = total * (1 - fulfilled %)
}

// Day 1: Customer pays $1,200 for annual subscription
const deferred = {
  recognized: 0,
  deferred: 1200,
};

// After 1 month (30 days)
const month1 = {
  recognized: 1200 * (30 / 365), // ~$98.63
  deferred: 1200 * (335 / 365),  // ~$1,101.37
};
```

### Key Rules
- Recognize revenue when performance obligation fulfilled (service delivered)
- Handle variable consideration (usage overages, discounts) separately
- Track bundled features, implementation services, onboarding delays
- Monthly SaaS = linear recognition over service period

---

## 8. BILLING DATABASE SCHEMA

### Core Tables (Postgres)
```sql
-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  plan_id UUID REFERENCES plans(id),
  status TEXT, -- active, canceled, paused
  started_at TIMESTAMP,
  ends_at TIMESTAMP,
  billing_cycle_anchor DATE,
  current_period_start DATE,
  current_period_end DATE,
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  subscription_id UUID REFERENCES subscriptions(id),
  invoice_number TEXT UNIQUE,
  status TEXT, -- draft, finalized, paid, failed
  period_start DATE,
  period_end DATE,
  subtotal_cents BIGINT,
  tax_cents BIGINT,
  total_cents BIGINT,
  currency TEXT,
  pdf_url TEXT,
  paid_at TIMESTAMP,
  due_date DATE,
  created_at TIMESTAMP
);

-- Usage & Metering
CREATE TABLE usage_events (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  meter_id UUID,
  value NUMERIC(18,6),
  properties JSONB, -- e.g., { "region": "us-east" }
  timestamp TIMESTAMP,
  ingested_at TIMESTAMP,
  INDEX (customer_id, meter_id, timestamp)
);

-- Credits & Balance
CREATE TABLE account_credits (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  balance_cents BIGINT, -- 0 = no credit, negative = owed
  currency TEXT,
  updated_at TIMESTAMP
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  account_credit_id UUID REFERENCES account_credits(id),
  type TEXT, -- debit, credit, refund, adjustment
  amount_cents BIGINT,
  reason TEXT,
  invoice_id UUID,
  created_at TIMESTAMP
);

-- Revenue Recognition
CREATE TABLE revenue_schedules (
  id UUID PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id),
  total_amount_cents BIGINT,
  performance_obligation_pct DECIMAL(5,2),
  recognized_amount_cents BIGINT,
  deferred_amount_cents BIGINT,
  fiscal_month DATE,
  created_at TIMESTAMP
);
```

---

## 9. BILLING UI PATTERNS (React/TypeScript)

### Invoice Table Component
```typescript
interface InvoiceTableProps {
  invoices: Invoice[];
  onDownload: (invoiceId: string) => void;
  onRetryPayment?: (invoiceId: string) => void;
}

export function InvoiceTable({ invoices, onDownload, onRetryPayment }: InvoiceTableProps) {
  return (
    <table className="min-w-full border">
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Period</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map(inv => (
          <tr key={inv.id}>
            <td>{inv.invoice_number}</td>
            <td>{format(inv.period_start, 'MMM d')} - {format(inv.period_end, 'MMM d, yyyy')}</td>
            <td>{formatCurrency(inv.total_cents, inv.currency)}</td>
            <td><Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>{inv.status}</Badge></td>
            <td>
              <Button onClick={() => onDownload(inv.id)}>Download PDF</Button>
              {inv.status === 'failed' && onRetryPayment && (
                <Button variant="secondary" onClick={() => onRetryPayment(inv.id)}>Retry</Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Payment Method Manager
```typescript
interface PaymentMethodManagerProps {
  methods: PaymentMethod[];
  onUpdate: (methodId: string, newDefault: boolean) => void;
  onDelete: (methodId: string) => void;
  onAdd: () => void;
}

export function PaymentMethodManager({ methods, onUpdate, onDelete, onAdd }: PaymentMethodManagerProps) {
  return (
    <div className="space-y-4">
      {methods.map(method => (
        <Card key={method.id}>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <CardBrand brand={method.brand} />
                <p className="text-sm text-gray-600">
                  •••• {method.last_four} • Expires {method.expiry_month}/{method.expiry_year}
                </p>
              </div>
              <div className="flex gap-2">
                <Checkbox
                  checked={method.is_default}
                  onCheckedChange={() => onUpdate(method.id, !method.is_default)}
                />
                <Button variant="ghost" size="sm" onClick={() => onDelete(method.id)}>Delete</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={onAdd} variant="outline">Add Payment Method</Button>
    </div>
  );
}
```

---

## 10. DECISION MATRIX: Which Platform?

| Requirement | Stripe Billing | Polar.sh | Lago | Orb |
|---|---|---|---|---|
| **Metered Usage** | ✓ | ✓✓ | ✓✓✓ | ✓✓✓ |
| **Simple Subscription** | ✓✓✓ | ✓✓ | ✓✓ | ✓ |
| **Custom Tax Logic** | ✓ (Avalara) | ✓ (limited) | ✓ | ✓ (via API) |
| **Multi-Currency** | ✓✓ | ✓ | ✓ | ✓✓ |
| **Revenue Recognition** | ✗ | ✗ | ✗ | ✗ (use external) |
| **Self-Hosted** | ✗ | ✗ | ✓ | ✗ |
| **Pricing Model Flexibility** | ✓✓ | ✓✓ | ✓✓✓ | ✓✓✓ |
| **Cost Scale** | $500-2K/mo | $499/mo+ | FREE (self) + ops | $500-5K/mo |

**Recommendation:**
- **Hybrid SaaS (fixed + usage)** → Stripe Billing + Orb
- **Usage-first (e.g., API calls)** → Polar.sh or Lago
- **Complex B2B (discounts, custom cycles)** → Lago (self-hosted) or Orb
- **Simple Subscriptions** → Stripe Billing (cost-effective)

---

## KEY INSIGHTS

1. **Event-First Architecture** — Modern billing treats usage events as primary; invoices derived from aggregated events
2. **Async Invoice Finalization** — Stripe finalizes ~1hr after webhook success; allows manual adjustments before payment
3. **Proration Complexity** — Handle mid-cycle changes, downgrades, cancellations with explicit proration rules
4. **Tax as Middleware** — Stripe Tax or Avalara should be called at invoice creation, not manually calculated
5. **Deferred Revenue Tracking** — Essential for revenue recognition; track monthly fulfillment %
6. **Credit Balance Atomicity** — Use database transactions to prevent over-crediting; always lock rows when adjusting balance
7. **Webhook Reliability** → Invoice status changes via webhooks; implement idempotent handlers

---

## UNRESOLVED QUESTIONS

1. **Partial Credit Allocation** — When customer has $10 credit and $15 invoice, should system refund $5 or leave $5 debit?
2. **Currency Conversion Timing** — When should conversion occur: invoice creation or payment settlement? Forex arbitrage risk?
3. **Tax Nexus Logic** — How to handle B2B (no tax) vs B2C (tax required) in multi-jurisdiction scenario?
4. **Chargeback Reserve** — Should system auto-suspend account on chargeback or only after dispute lost?
5. **Annual Upfront + Monthly Overage** — Proration complexity when base is pre-paid but overages charged monthly?

---

**Report Generated:** 2026-03-01 | **Token Efficiency:** Concise with code examples | **Sources:** Stripe, Polar, Lago, Orb, Avalara, Orb blogs
