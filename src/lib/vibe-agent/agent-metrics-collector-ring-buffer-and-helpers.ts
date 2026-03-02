/**
 * Agent Metrics Collector — Ring Buffer Chart Storage + Pure Helper Functions
 *
 * Contains:
 * - MetricChart: time-series ring buffer for storing data points
 * - evaluateThreshold: operator-based alarm threshold check
 * - downsample: average-group downsampling (Netdata: group=average)
 */

import type { MetricChartConfig, MetricDataPoint, MetricAlarmDefinition } from './agent-metrics-collector-types';

// ─── Chart Storage (Ring Buffer) ─────────────────────────────

export class MetricChart {
  readonly config: MetricChartConfig;
  private buffer: MetricDataPoint[] = [];

  constructor(config: MetricChartConfig) {
    this.config = config;
  }

  /** Record a data point (Netdata: chart.update()) */
  record(value: number, dimensions?: Record<string, number>): void {
    const point: MetricDataPoint = {
      timestamp: Date.now(),
      value,
      dimensions,
    };

    this.buffer.push(point);

    // Ring buffer — trim to history size
    if (this.buffer.length > this.config.historySize) {
      this.buffer = this.buffer.slice(-this.config.historySize);
    }
  }

  /** Query data by time range (Netdata: /api/v1/data) */
  query(after?: number, before?: number): MetricDataPoint[] {
    const now = Date.now();
    const start = after ?? (now - this.config.historySize * 1000);
    const end = before ?? now;

    return this.buffer.filter(
      (p) => p.timestamp >= start && p.timestamp <= end,
    );
  }

  /** Get latest data point */
  latest(): MetricDataPoint | null {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null;
  }

  /** Get total data points stored */
  size(): number {
    return this.buffer.length;
  }

  /** Clear all data (for testing) */
  clear(): void {
    this.buffer = [];
  }
}

// ─── Utility Functions ───────────────────────────────────────

export function evaluateThreshold(
  value: number,
  operator: MetricAlarmDefinition['operator'],
  threshold: number,
): boolean {
  switch (operator) {
    case 'gt': return value > threshold;
    case 'lt': return value < threshold;
    case 'gte': return value >= threshold;
    case 'lte': return value <= threshold;
    case 'eq': return value === threshold;
  }
}

/** Downsample data points by averaging groups (Netdata: group=average) */
export function downsample(data: MetricDataPoint[], targetPoints: number): MetricDataPoint[] {
  if (data.length <= targetPoints) return data;

  const groupSize = Math.ceil(data.length / targetPoints);
  const result: MetricDataPoint[] = [];

  for (let i = 0; i < data.length; i += groupSize) {
    const group = data.slice(i, i + groupSize);
    const avgValue = group.reduce((s, p) => s + p.value, 0) / group.length;
    const midTimestamp = group[Math.floor(group.length / 2)].timestamp;

    // Average dimensions if present
    let avgDimensions: Record<string, number> | undefined;
    if (group[0].dimensions) {
      avgDimensions = {};
      const keys = Object.keys(group[0].dimensions);
      for (const key of keys) {
        const sum = group.reduce((s, p) => s + (p.dimensions?.[key] ?? 0), 0);
        avgDimensions[key] = sum / group.length;
      }
    }

    result.push({
      timestamp: midTimestamp,
      value: Math.round(avgValue * 100) / 100,
      dimensions: avgDimensions,
    });
  }

  return result;
}
