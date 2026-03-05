export interface DeadLetterQueueRecord {
  event_type: string;
  order_code: number;
  raw_payload: Record<string, unknown>;
  signature?: string;
  error_message: string;
  error_details?: Record<string, unknown>;
  failure_count?: number;
  max_retries?: number;
}

export interface OrderRecord {
  id: string;
  userId: string | null;
  orderCode: number;
  orgId?: string;
  status: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionIntentRecord {
  id: string;
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  status: string;
  orderCode: number;
  orgId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookHandlerDeps {
  /** Find order by orderCode */
  findOrder: (orderCode: number) => Promise<OrderRecord | null>;
  /** Find subscription intent by orderCode */
  findSubscriptionIntent: (orderCode: number) => Promise<SubscriptionIntentRecord | null>;
  /** Atomically update order status (only if current status matches) */
  updateOrderStatus: (
    orderId: string,
    fromStatus: string,
    toStatus: string,
    paymentData: Record<string, unknown>
  ) => Promise<boolean>;
  /** Update subscription intent status */
  updateSubscriptionIntent: (intentId: string, status: string) => Promise<void>;
  /** Activate a subscription after payment */
  activateSubscription: (intent: SubscriptionIntentRecord) => Promise<void>;
  /** Log to audit table */
  logAudit: (
    userId: string | null,
    action: string,
    payload: Record<string, unknown>,
    severity: string
  ) => Promise<void>;
  /** Queue failed event to dead letter queue */
  queueToDeadLetterQueue: (record: DeadLetterQueueRecord) => Promise<string>;
}

// Subscription webhook processor type
export type ProcessSubscriptionWebhookFn = (
  event: { type: string; orderCode: number;
  orgId?: string; amount: number; raw: Record<string, unknown> },
  intent: SubscriptionIntentRecord,
  config: { onSubscriptionPaid?: (intent: SubscriptionIntentRecord, data: Record<string, unknown>) => Promise<void> },
  deps: WebhookHandlerDeps
) => Promise<{ status: string; message?: string; subscriptionStatus?: string }>;
