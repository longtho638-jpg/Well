export interface SimulationParams {
  currentPartners: number;
  monthlyGrowthRate: number;        // % per month
  churnRate: number;                // % per month
  avgOrderValue: number;            // VND
  ordersPerPartnerPerMonth: number;
  commissionRate: number;           // %
  fixedMonthlyCost: number;         // VND
  months: number;                   // simulation duration
}

export interface MonthlyProjection {
  month: number;
  activePartners: number;
  newPartners: number;
  churned: number;
  gmv: number;
  totalCommission: number;
  fixedCost: number;
  netProfit: number;
  cumulativeProfit: number;
  profitMargin: number;
}

export interface SimulationResult {
  projections: MonthlyProjection[];
  summary: {
    totalGMV: number;
    totalProfit: number;
    avgProfitMargin: number;
    breakEvenMonth: number | null;
    finalPartnerCount: number;
    peakPartners: number;
  };
}

export interface ScenarioComparison {
  name: string;
  params: SimulationParams;
  result: SimulationResult;
}

export interface MonteCarloOutput {
  best: SimulationResult;
  worst: SimulationResult;
  median: SimulationResult;
  average: SimulationResult;
}

export function runSimulation(params: SimulationParams): SimulationResult {
  const projections: MonthlyProjection[] = [];
  let activePartners = params.currentPartners;
  let cumulativeProfit = 0;
  let breakEvenMonth: number | null = null;
  let peakPartners = activePartners;

  for (let month = 1; month <= params.months; month++) {
    const newPartners = Math.floor(activePartners * (params.monthlyGrowthRate / 100));
    const churned = Math.floor(activePartners * (params.churnRate / 100));
    activePartners = Math.max(0, activePartners + newPartners - churned);
    if (activePartners > peakPartners) peakPartners = activePartners;

    const gmv = activePartners * params.avgOrderValue * params.ordersPerPartnerPerMonth;
    const totalCommission = gmv * (params.commissionRate / 100);
    const netProfit = gmv - totalCommission - params.fixedMonthlyCost;
    cumulativeProfit += netProfit;

    if (breakEvenMonth === null && cumulativeProfit > 0) {
      breakEvenMonth = month;
    }

    projections.push({
      month,
      activePartners,
      newPartners,
      churned,
      gmv,
      totalCommission,
      fixedCost: params.fixedMonthlyCost,
      netProfit,
      cumulativeProfit,
      profitMargin: gmv > 0 ? (netProfit / gmv) * 100 : 0,
    });
  }

  const totalGMV = projections.reduce((sum, p) => sum + p.gmv, 0);
  const totalProfit = projections.reduce((sum, p) => sum + p.netProfit, 0);

  return {
    projections,
    summary: {
      totalGMV,
      totalProfit,
      avgProfitMargin: totalGMV > 0 ? (totalProfit / totalGMV) * 100 : 0,
      breakEvenMonth,
      finalPartnerCount: activePartners,
      peakPartners,
    },
  };
}

export function runMonteCarloSimulation(
  baseParams: SimulationParams,
  iterations: number = 100,
  variance: number = 0.2
): MonteCarloOutput {
  const results: SimulationResult[] = [];

  for (let i = 0; i < iterations; i++) {
    const spread = (Math.random() - 0.5) * 2 * variance;
    const variedParams: SimulationParams = {
      ...baseParams,
      monthlyGrowthRate: baseParams.monthlyGrowthRate * (1 + spread),
      churnRate: baseParams.churnRate * (1 + spread),
      avgOrderValue: baseParams.avgOrderValue * (1 + spread * 0.5),
    };
    results.push(runSimulation(variedParams));
  }

  results.sort((a, b) => a.summary.totalProfit - b.summary.totalProfit);

  const count = results.length;
  const avgTotalGMV = results.reduce((s, r) => s + r.summary.totalGMV, 0) / count;
  const avgTotalProfit = results.reduce((s, r) => s + r.summary.totalProfit, 0) / count;
  const avgMargin = results.reduce((s, r) => s + r.summary.avgProfitMargin, 0) / count;
  const avgPartners = results.reduce((s, r) => s + r.summary.finalPartnerCount, 0) / count;
  const avgPeakPartners = results.reduce((s, r) => s + r.summary.peakPartners, 0) / count;
  const medianResult = results[Math.floor(count / 2)];

  return {
    worst: results[0],
    best: results[count - 1],
    median: medianResult,
    average: {
      projections: medianResult.projections,
      summary: {
        totalGMV: avgTotalGMV,
        totalProfit: avgTotalProfit,
        avgProfitMargin: avgMargin,
        breakEvenMonth: medianResult.summary.breakEvenMonth,
        finalPartnerCount: Math.floor(avgPartners),
        peakPartners: Math.floor(avgPeakPartners),
      },
    },
  };
}

export const DEFAULT_SIMULATION_PARAMS: SimulationParams = {
  currentPartners: 100,
  monthlyGrowthRate: 15,
  churnRate: 5,
  avgOrderValue: 1500000,
  ordersPerPartnerPerMonth: 2,
  commissionRate: 25,
  fixedMonthlyCost: 200000000,
  months: 12,
};
