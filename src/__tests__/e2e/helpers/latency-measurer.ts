/**
 * Latency Measurer Helper
 *
 * Utilities for measuring sync latency and performance metrics
 */

export interface LatencyMeasurement {
  operation: string
  startTime: number
  endTime: number
  latencyMs: number
  success: boolean
  error?: string
}

export interface LatencyReport {
  operation: string
  measurements: LatencyMeasurement[]
  avgLatencyMs: number
  minLatencyMs: number
  maxLatencyMs: number
  p50LatencyMs: number
  p90LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  successRate: number
  totalAttempts: number
  successfulAttempts: number
}

export class LatencyMeasurer {
  private measurements = new Map<string, LatencyMeasurement[]>()
  private slaThresholds = new Map<string, number>()

  constructor() {
    // Default SLA thresholds (in ms)
    this.slaThresholds.set('license_activation', 1000) // 1s
    this.slaThresholds.set('usage_track', 500) // 500ms
    this.slaThresholds.set('gateway_sync', 5000) // 5s
    this.slaThresholds.set('dashboard_update', 10000) // 10s
    this.slaThresholds.set('webhook_process', 1000) // 1s
    this.slaThresholds.set('overage_calc', 100) // 100ms
  }

  /**
   * Start measuring latency for an operation
   */
  start(operation: string): string {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const measurement: Partial<LatencyMeasurement> = {
      operation,
      startTime: Date.now(),
    }

    // Store in pending measurements
    ;(this as any).pendingMeasurements = (this as any).pendingMeasurements || new Map()
    ;(this as any).pendingMeasurements.set(operationId, measurement)

    return operationId
  }

  /**
   * End measuring and record the latency
   */
  end(operationId: string, success: boolean = true, error?: string): LatencyMeasurement | null {
    const pending = (this as any).pendingMeasurements?.get(operationId)
    if (!pending) {
      console.warn(`No pending measurement found for operationId: ${operationId}`)
      return null
    }

    const endTime = Date.now()
    const measurement: LatencyMeasurement = {
      operation: pending.operation,
      startTime: pending.startTime,
      endTime,
      latencyMs: endTime - pending.startTime,
      success,
      ...(error ? { error } : {}),
    }

    // Store measurement
    if (!this.measurements.has(pending.operation)) {
      this.measurements.set(pending.operation, [])
    }
    this.measurements.get(pending.operation)!.push(measurement)

    // Remove from pending
    ;(this as any).pendingMeasurements.delete(operationId)

    return measurement
  }

  /**
   * Measure a promise and record latency
   */
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const operationId = this.start(operation)
    try {
      const result = await fn()
      this.end(operationId, true)
      return result
    } catch (error) {
      this.end(operationId, false, error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Measure a synchronous function and record latency
   */
  measureSync<T>(operation: string, fn: () => T): T {
    const operationId = this.start(operation)
    try {
      const result = fn()
      this.end(operationId, true)
      return result
    } catch (error) {
      this.end(operationId, false, error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Get latency report for an operation
   */
  getReport(operation: string): LatencyReport | null {
    const measurements = this.measurements.get(operation)
    if (!measurements || measurements.length === 0) {
      return null
    }

    const latencies = measurements.map(m => m.latencyMs).sort((a, b) => a - b)
    const successful = measurements.filter(m => m.success)

    return {
      operation,
      measurements,
      avgLatencyMs: this.calculateAverage(latencies),
      minLatencyMs: latencies[0],
      maxLatencyMs: latencies[latencies.length - 1],
      p50LatencyMs: this.calculatePercentile(latencies, 50),
      p90LatencyMs: this.calculatePercentile(latencies, 90),
      p95LatencyMs: this.calculatePercentile(latencies, 95),
      p99LatencyMs: this.calculatePercentile(latencies, 99),
      successRate: successful.length / measurements.length,
      totalAttempts: measurements.length,
      successfulAttempts: successful.length,
    }
  }

  /**
   * Check if operation meets SLA
   */
  checkSla(operation: string): { meetsSla: boolean; thresholdMs: number; currentAvgMs: number } {
    const threshold = this.slaThresholds.get(operation)
    if (!threshold) {
      return { meetsSla: true, thresholdMs: 0, currentAvgMs: 0 }
    }

    const report = this.getReport(operation)
    if (!report) {
      return { meetsSla: true, thresholdMs: threshold, currentAvgMs: 0 }
    }

    return {
      meetsSla: report.avgLatencyMs <= threshold,
      thresholdMs: threshold,
      currentAvgMs: report.avgLatencyMs,
    }
  }

  /**
   * Get all reports
   */
  getAllReports(): Map<string, LatencyReport> {
    const reports = new Map<string, LatencyReport>()
    for (const [operation] of this.measurements) {
      const report = this.getReport(operation)
      if (report) {
        reports.set(operation, report)
      }
    }
    return reports
  }

  /**
   * Print latency report to console
   */
  printReport(operation?: string) {
    if (operation) {
      const report = this.getReport(operation)
      if (report) {
        console.log(`\n=== Latency Report: ${operation} ===`)
        console.log(`Samples: ${report.totalAttempts} | Success Rate: ${(report.successRate * 100).toFixed(1)}%`)
        console.log(`Avg: ${report.avgLatencyMs.toFixed(0)}ms | Min: ${report.minLatencyMs}ms | Max: ${report.maxLatencyMs}ms`)
        console.log(`P50: ${report.p50LatencyMs}ms | P90: ${report.p90LatencyMs}ms | P95: ${report.p95LatencyMs}ms | P99: ${report.p99LatencyMs}ms`)

        const sla = this.checkSla(operation)
        console.log(`SLA: ${sla.meetsSla ? '✅ PASS' : '❌ FAIL'} (threshold: ${sla.thresholdMs}ms, current: ${sla.currentAvgMs.toFixed(0)}ms)`)
      }
    } else {
      console.log('\n=== All Latency Reports ===')
      for (const [operation] of this.measurements) {
        this.printReport(operation)
      }
    }
  }

  /**
   * Clear all measurements
   */
  clear(operation?: string) {
    if (operation) {
      this.measurements.delete(operation)
    } else {
      this.measurements.clear()
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, v) => sum + v, 0) / values.length
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1
    return sortedValues[Math.max(0, index)]
  }
}

/**
 * Async function with timeout and latency tracking
 */
export async function timedAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<{ result: T; latencyMs: number }> {
  const startTime = Date.now()

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
  )

  const result = await Promise.race([fn(), timeout]) as T
  const latencyMs = Date.now() - startTime

  return { result, latencyMs }
}

/**
 * Measure multiple concurrent operations
 */
export async function measureConcurrency<T>(
  operations: Array<() => Promise<T>>
): Promise<{ results: T[]; latencies: number[]; totalDurationMs: number }> {
  const startTime = Date.now()
  const startTimes = operations.map(() => Date.now())

  const wrapped = operations.map((fn, i) => async () => {
    startTimes[i] = Date.now()
    const result = await fn()
    return result
  })

  const results = await Promise.all(wrapped.map(fn => fn()))
  const latencies = operations.map((_, i) => Date.now() - startTimes[i])
  const totalDurationMs = Date.now() - startTime

  return { results, latencies, totalDurationMs }
}
