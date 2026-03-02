/**
 * Agent Metrics Collector — Types (extracted from agent-metrics-collector-netdata-pattern.ts)
 *
 * Interfaces and enums for Netdata-inspired monitoring:
 * MetricDataPoint, MetricChartConfig, MetricAlarmDefinition, MetricAlarmState,
 * MetricQuery, MetricQueryResult.
 */

// ─── Metric Types ────────────────────────────────────────────

/** A single data point (Netdata: one row in the database) */
export interface MetricDataPoint {
  timestamp: number; // Unix ms
  value: number;
  dimensions?: Record<string, number>; // Netdata dimensions
}

/** Chart configuration (Netdata: chart definition in collector) */
export interface MetricChartConfig {
  id: string;
  name: string;
  /** Unit for display (ms, %, count, bytes) */
  units: string;
  /** Chart type (Netdata: line, area, stacked) */
  type: 'line' | 'area' | 'stacked';
  /** Max data points to retain (ring buffer size, default: 300 = 5 min @ 1s) */
  historySize: number;
  /** Dimension names (sub-metrics within chart) */
  dimensions: string[];
}

/** Alarm definition (Netdata: health.d/*.conf pattern) */
export interface MetricAlarmDefinition {
  id: string;
  chartId: string;
  /** Which dimension to check (or 'value' for main) */
  dimension: string;
  /** Operator for threshold check */
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  /** Threshold value */
  threshold: number;
  /** How many consecutive breaches before firing (Netdata: lookup) */
  lookback: number;
  /** Severity level */
  severity: 'warning' | 'critical';
  /** Human-readable description */
  description: string;
}

/** Alarm state (Netdata: alarm status) */
export interface MetricAlarmState {
  alarm: MetricAlarmDefinition;
  status: 'clear' | 'warning' | 'critical';
  consecutiveBreaches: number;
  lastCheckedAt: number;
  lastTriggeredAt: number | null;
  currentValue: number | null;
}

/** Time-range query params (Netdata: /api/v1/data) */
export interface MetricQuery {
  chartId: string;
  /** Start time (Unix ms, default: historySize ago) */
  after?: number;
  /** End time (Unix ms, default: now) */
  before?: number;
  /** Aggregation points (downsample to N points) */
  points?: number;
  /** Dimensions to include (default: all) */
  dimensions?: string[];
}

/** Query result (Netdata: /api/v1/data response format) */
export interface MetricQueryResult {
  chartId: string;
  chartName: string;
  units: string;
  dimensions: string[];
  data: MetricDataPoint[];
  pointCount: number;
  timeRange: { after: number; before: number };
}
