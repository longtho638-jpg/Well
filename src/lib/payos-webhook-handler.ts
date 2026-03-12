/**
 * PayOS Webhook Handler - Client-Side Utility
 *
 * Handles PayOS webhook payload parsing, signature verification,
 * and tier-based license provisioning integration.
 *
 * Designed for use in API routes or client-side webhook validation.
 * Works with existing license-service.ts for license provisioning.
 *
 * @module PayOSWebhookHandler
 */

import type { LicenseTier } from '../services/license-types';

// ─── Types ──────────────────────────────────────────────────────

/**
 * PayOS webhook event types
 * Maps PayOS status codes to normalized event types
 */
export type PayOSWebhookEventType =
  | 'payment.completed'
  | 'payment.refunded'
  | 'subscription.created'
  | 'subscription.cancelled';

/**
 * PayOS webhook payload structure
 */
export interface PayOSWebhookPayload {
  data: PayOSWebhookData;
  signature: string;
}

/**
 * PayOS webhook data fields
 */
export interface PayOSWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;         // PayOS status code: '00' = success, '01' = cancelled
  desc: string;         // PayOS status description
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
  items?: PayOSWebhookItem[];
  metadata?: Record<string, unknown>;
}

/**
 * PayOS webhook line item
 */
export interface PayOSWebhookItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

/**
 * Result of webhook handling
 */
export interface HandleWebhookResult {
  success: boolean;
  eventType?: PayOSWebhookEventType;
  tier?: LicenseTier;
  orderCode?: number;
  amount?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Product to tier mapping configuration
 */
export interface ProductTierMapping {
  productId: string;
  tier: LicenseTier;
  billingCycle: 'monthly' | 'yearly';
}

// ─── Constants ──────────────────────────────────────────────────

/**
 * Default product to tier mapping
 * Customize this based on your PayOS product configuration
 */
export const DEFAULT_PRODUCT_TIER_MAP: ProductTierMapping[] = [
  // Monthly plans
  { productId: 'basic-monthly', tier: 'basic', billingCycle: 'monthly' },
  { productId: 'premium-monthly', tier: 'premium', billingCycle: 'monthly' },
  { productId: 'enterprise-monthly', tier: 'enterprise', billingCycle: 'monthly' },
  { productId: 'master-monthly', tier: 'master', billingCycle: 'monthly' },

  // Yearly plans
  { productId: 'basic-yearly', tier: 'basic', billingCycle: 'yearly' },
  { productId: 'premium-yearly', tier: 'premium', billingCycle: 'yearly' },
  { productId: 'enterprise-yearly', tier: 'enterprise', billingCycle: 'yearly' },
  { productId: 'master-yearly', tier: 'master', billingCycle: 'yearly' },
];

// ─── Webhook Handler Class ──────────────────────────────────────

export class PayOSWebhookHandler {
  private readonly productTierMap: Map<string, ProductTierMapping>;

  constructor(productTierMap: ProductTierMapping[] = DEFAULT_PRODUCT_TIER_MAP) {
    this.productTierMap = new Map(
      productTierMap.map((mapping) => [mapping.productId.toLowerCase(), mapping])
    );
  }

  /**
   * Handle incoming PayOS webhook
   *
   * @param payload - Raw webhook payload string
   * @param signature - Webhook signature for verification
   * @param checksumKey - PayOS checksum key for signature verification
   * @returns HandleWebhookResult with event details or error
   */
  async handleWebhook(
    payload: string,
    signature: string,
    checksumKey?: string
  ): Promise<HandleWebhookResult> {
    try {
      // Step 1: Parse payload
      const parsedPayload: PayOSWebhookPayload = JSON.parse(payload);
      const data = parsedPayload.data;

      // Step 2: Validate required fields
      if (!this.validatePayload(data)) {
        return {
          success: false,
          error: 'Invalid webhook payload: missing required fields',
        };
      }

      // Step 3: Verify signature (if checksum key provided)
      if (checksumKey && signature) {
        const isValid = await this.verifySignature(data, signature, checksumKey);
        if (!isValid) {
          return {
            success: false,
            error: 'Invalid webhook signature',
          };
        }
      }

      // Step 4: Determine event type from PayOS code
      const eventType = this.determineEventType(data);

      // Step 5: Map product to tier (if items present)
      let tier: LicenseTier | undefined;
      if (data.items && data.items.length > 0) {
        tier = this.extractTierFromItems(data.items);
      }

      // Step 6: Build result
      return {
        success: true,
        eventType,
        tier,
        orderCode: data.orderCode,
        amount: data.amount,
        metadata: {
          paymentLinkId: data.paymentLinkId,
          transactionDateTime: data.transactionDateTime,
          code: data.code,
          desc: data.desc,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Webhook handling failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Map PayOS product ID to license tier
   *
   * @param productId - PayOS product identifier
   * @returns LicenseTier or 'basic' as fallback
   */
  mapProductToTier(productId: string): LicenseTier {
    const normalizedId = productId.toLowerCase();
    const mapping = this.productTierMap.get(normalizedId);

    if (mapping) {
      return mapping.tier;
    }

    // Fallback: Try to extract tier from product ID patterns
    const tierPatterns: Array<{ pattern: RegExp; tier: LicenseTier }> = [
      { pattern: /master/, tier: 'master' },
      { pattern: /enterprise/, tier: 'enterprise' },
      { pattern: /premium/, tier: 'premium' },
      { pattern: /basic/, tier: 'basic' },
    ];

    for (const { pattern, tier } of tierPatterns) {
      if (pattern.test(normalizedId)) {
        return tier;
      }
    }

    // Default fallback
    return 'basic';
  }

  /**
   * Determine webhook event type from PayOS status code
   *
   * PayOS codes:
   * - '00' = Payment successful/completed
   * - '01' = Payment cancelled/failed
   *
   * @param data - Webhook data
   * @returns Normalized event type
   */
  determineEventType(data: PayOSWebhookData): PayOSWebhookEventType {
    const code = data.code;

    // Check description for subscription-related keywords
    const desc = (data.description || '').toLowerCase();
    const isSubscription = desc.includes('subscription') || desc.includes('recurring');

    if (code === '00') {
      return isSubscription ? 'subscription.created' : 'payment.completed';
    }

    if (code === '01') {
      return isSubscription ? 'subscription.cancelled' : 'payment.refunded';
    }

    // Unknown code - default to payment.completed for safety
    return 'payment.completed';
  }

  // ─── Private Helpers ──────────────────────────────────────────

  /**
   * Validate webhook payload has required fields
   */
  private validatePayload(data: PayOSWebhookData): boolean {
    if (!data || typeof data !== 'object') return false;

    // Required fields per PayOS spec
    const requiredFields: Array<keyof PayOSWebhookData> = [
      'orderCode',
      'amount',
      'description',
      'accountNumber',
      'reference',
      'transactionDateTime',
      'currency',
      'paymentLinkId',
      'code',
      'desc',
    ];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        return false;
      }
    }

    // Validate types
    if (typeof data.orderCode !== 'number' || data.orderCode <= 0) return false;
    if (typeof data.amount !== 'number' || data.amount <= 0) return false;
    if (!/^\d{2}$/.test(data.code)) return false;

    return true;
  }

  /**
   * Verify HMAC-SHA256 signature
   *
   * PayOS signature algorithm:
   * 1. Sort all data keys alphabetically
   * 2. Join key=value pairs with '&'
   * 3. HMAC-SHA256 with checksum key
   *
   * @param data - Webhook data
   * @param signature - Provided signature
   * @param checksumKey - Secret key for verification
   * @returns true if signature is valid
   */
  private async verifySignature(
    data: PayOSWebhookData,
    signature: string,
    checksumKey: string
  ): Promise<boolean> {
    try {
      // Step 1: Sort keys alphabetically
      const sortedKeys = Object.keys(data).sort();

      // Step 2: Build signature string (key=value&key=value...)
      const signatureString = sortedKeys
        .map((key) => {
          const value = data[key as keyof PayOSWebhookData];
          return `${key}=${value}`;
        })
        .join('&');

      // Step 3: Compute HMAC-SHA256
      const computedSignature = await this.computeHmacSha256(
        checksumKey,
        signatureString
      );

      // Step 4: Constant-time comparison
      return this.secureCompare(signature, computedSignature);
    } catch {
      return false;
    }
  }

  /**
   * Compute HMAC-SHA256 hash
   */
  private async computeHmacSha256(key: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
    return Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Extract tier from webhook items
   * Uses first item's product name to determine tier
   */
  private extractTierFromItems(items: PayOSWebhookItem[]): LicenseTier | undefined {
    if (!items || items.length === 0) return undefined;

    const firstItem = items[0];
    const productName = firstItem.product_name || '';

    // Try product ID mapping first
    const tier = this.mapProductToTier(productName);

    return tier;
  }
}

// ─── Exported Utility Functions ─────────────────────────────────

/**
 * Create a new PayOS webhook handler with default configuration
 */
export function createPayOSWebhookHandler(
  productTierMap?: ProductTierMapping[]
): PayOSWebhookHandler {
  return new PayOSWebhookHandler(productTierMap);
}

/**
 * Verify PayOS webhook signature (standalone function)
 */
export async function verifyPayOSWebhookSignature(
  data: PayOSWebhookData,
  signature: string,
  checksumKey: string
): Promise<boolean> {
  const handler = new PayOSWebhookHandler();
  return handler['verifySignature'](data, signature, checksumKey);
}

/**
 * Map product ID to tier (standalone function)
 */
export function mapProductToTier(productId: string): LicenseTier {
  const handler = new PayOSWebhookHandler();
  return handler.mapProductToTier(productId);
}

/**
 * Determine event type from PayOS code (standalone function)
 */
export function determinePayOSEventType(data: PayOSWebhookData): PayOSWebhookEventType {
  const handler = new PayOSWebhookHandler();
  return handler.determineEventType(data);
}

// ─── Integration Helpers for License Service ────────────────────

/**
 * Prepare license activation data from PayOS webhook
 * Compatible with license-service.ts activateLicenseViaPayOS
 */
export function prepareLicenseActivationData(
  webhookData: PayOSWebhookData,
  userId: string,
  tier: LicenseTier
): { licenseKey: string; userId: string; paymentReference: string } {
  const timestamp = Math.floor(Date.now() / 1000);
  const paymentRef = `${webhookData.paymentLinkId}-${webhookData.orderCode}`;

  // Generate license key format: raas_(tier)_(timestamp)_(hash)
  const hashInput = `${userId}-${tier}-${timestamp}-${paymentRef}`;
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36).toUpperCase().padStart(6, '0');

  return {
    licenseKey: `raas_${tier}_${timestamp}_${hashStr}`,
    userId,
    paymentReference: paymentRef,
  };
}

export default PayOSWebhookHandler;
