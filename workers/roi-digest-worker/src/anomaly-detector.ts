/**
 * Anomaly Detection Module - Phase 6
 *
 * Lightweight statistical anomaly detection for RaaS usage metering.
 * Uses Z-score and IQR methods on rolling 1h/24h windows.
 */

import { AnomalyDetectorCore } from './anomaly-detector-core'

// Re-export for backward compatibility
export const AnomalyDetector = AnomalyDetectorCore
export type { AnomalyResult, AlertPayload, RollingStats } from './anomaly-detector-core'
