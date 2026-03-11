/**
 * Dunning Service - Phase 7
 *
 * Manages payment failure recovery, dunning email sequences, and subscription suspension.
 * Orchestrates dunning stage progression via modular services.
 *
 * Usage:
 *   import { dunningService } from '@/lib/dunning-service'
 *
 *   await dunningService.handlePaymentFailed({ orgId, userId, subscriptionId, amount, stripeInvoiceId })
 *   await dunningService.sendDunningEmail(dunningId, 'reminder')
 *   await dunningService.resolveDunning(dunningId, 'payment_success')
 */

import type { DunningConfig } from './dunning-types'
import {
  sendDunningEmail as _sendEmail,
  getPendingDunningEmails as _getPending,
  getDunningConfig as _getConfig,
} from './dunning-email-service'
import {
  resolveDunning as _resolve,
  processDunningStages as _processStages,
} from './dunning-state-machine'
import {
  handlePaymentFailed as _handlePayment,
  getActiveDunningEvents as _getActive,
  getDunningStatistics as _getStats,
} from './dunning-payment-service'
import {
  logFailedWebhook as _logWebhook,
  getFailedWebhooksForRetry as _getFailed,
  resolveFailedWebhook as _resolveWebhook,
} from './dunning-webhook-service'
import {
  suspendOverdueSubscriptions as _suspend,
} from './dunning-suspension-service'

// Re-export types
export type {
  DunningEvent,
  DunningConfig,
  PaymentFailedEvent,
  DunningEmailResult,
  DunningResolutionResult,
  DunningStage,
  ResolutionMethod,
} from './dunning-types'

// Re-export all for backward compatibility
export {
  sendDunningEmail,
  getPendingDunningEmails,
  getDunningConfig,
} from './dunning-email-service'

export {
  resolveDunning,
  processDunningStages,
} from './dunning-state-machine'

export {
  handlePaymentFailed,
  getActiveDunningEvents,
  getDunningStatistics,
} from './dunning-payment-service'

export {
  logFailedWebhook,
  getFailedWebhooksForRetry,
  resolveFailedWebhook,
} from './dunning-webhook-service'

export {
  suspendOverdueSubscriptions,
} from './dunning-suspension-service'

/**
 * Dunning Service
 */
export const dunningService = {
  handlePaymentFailed: _handlePayment,
  getDunningConfig: _getConfig,
  getPendingDunningEmails: _getPending,
  sendDunningEmail: _sendEmail,
  resolveDunning: _resolve,
  processDunningStages: _processStages,
  getActiveDunningEvents: _getActive,
  getDunningStatistics: _getStats,
  logFailedWebhook: _logWebhook,
  getFailedWebhooksForRetry: _getFailed,
  resolveFailedWebhook: _resolveWebhook,
  suspendOverdueSubscriptions: _suspend,
}

export default dunningService
