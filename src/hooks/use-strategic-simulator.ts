import { useState, useCallback, useMemo } from 'react';
import {
  runSimulation,
  runMonteCarloSimulation,
  DEFAULT_SIMULATION_PARAMS,
} from '@/lib/simulation/monte-carlo-partner-growth-and-profit-simulator';
import type {
  SimulationParams,
  SimulationResult,
  ScenarioComparison,
} from '@/lib/simulation/monte-carlo-partner-growth-and-profit-simulator';

interface SimulatorState {
  params: SimulationParams;
  result: SimulationResult | null;
  monteCarloResult: ReturnType<typeof runMonteCarloSimulation> | null;
  scenarios: ScenarioComparison[];
  isRunning: boolean;
}

/**
 * Strategic Simulator Hook
 * Provides simulation controls and scenario comparison for Admin dashboard.
 */
export function useStrategicSimulator() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_SIMULATION_PARAMS);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [monteCarloResult, setMonteCarloResult] = useState<SimulatorState['monteCarloResult']>(null);
  const [scenarios, setScenarios] = useState<ScenarioComparison[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateParam = useCallback(<K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    setParams((prev: SimulationParams) => ({ ...prev, [key]: value }));
  }, []);

  const runBasicSimulation = useCallback(() => {
    setIsRunning(true);
    const simResult = runSimulation(params);
    setResult(simResult);
    setIsRunning(false);
    return simResult;
  }, [params]);

  const runMonteCarlo = useCallback((iterations = 100, variance = 0.2) => {
    setIsRunning(true);
    const mcResult = runMonteCarloSimulation(params, iterations, variance);
    setMonteCarloResult(mcResult);
    setResult(mcResult.median);
    setIsRunning(false);
    return mcResult;
  }, [params]);

  const saveScenario = useCallback((name: string) => {
    if (!result) return;
    setScenarios(prev => [
      ...prev,
      { name, params: { ...params }, result },
    ]);
  }, [params, result]);

  const removeScenario = useCallback((index: number) => {
    setScenarios(prev => prev.filter((_, i) => i !== index));
  }, []);

  const loadScenario = useCallback((scenario: ScenarioComparison) => {
    setParams(scenario.params);
    setResult(scenario.result);
  }, []);

  const resetParams = useCallback(() => {
    setParams(DEFAULT_SIMULATION_PARAMS);
    setResult(null);
    setMonteCarloResult(null);
  }, []);

  const summaryMetrics = useMemo(() => {
    if (!result) return null;
    const { summary } = result;
    return {
      totalGMV: summary.totalGMV,
      totalProfit: summary.totalProfit,
      avgProfitMargin: summary.avgProfitMargin,
      breakEvenMonth: summary.breakEvenMonth,
      finalPartnerCount: summary.finalPartnerCount,
      roiPercent: params.fixedMonthlyCost * params.months > 0
        ? (summary.totalProfit / (params.fixedMonthlyCost * params.months)) * 100
        : 0,
    };
  }, [result, params]);

  return {
    params,
    updateParam,
    result,
    monteCarloResult,
    scenarios,
    isRunning,
    summaryMetrics,
    runBasicSimulation,
    runMonteCarlo,
    saveScenario,
    removeScenario,
    loadScenario,
    resetParams,
  };
}
