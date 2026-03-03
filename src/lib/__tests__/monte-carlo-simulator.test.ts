import { describe, it, expect } from 'vitest';
import {
  runSimulation,
  runMonteCarloSimulation,
  DEFAULT_SIMULATION_PARAMS,
} from '../simulation/monte-carlo-partner-growth-and-profit-simulator';

describe('monte-carlo-partner-growth-and-profit-simulator', () => {
  describe('DEFAULT_SIMULATION_PARAMS', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_SIMULATION_PARAMS.months).toBeGreaterThan(0);
      expect(DEFAULT_SIMULATION_PARAMS.currentPartners).toBeGreaterThan(0);
      expect(DEFAULT_SIMULATION_PARAMS.avgOrderValue).toBeGreaterThan(0);
    });
  });

  describe('runSimulation', () => {
    it('produces correct number of monthly projections', () => {
      const result = runSimulation({ ...DEFAULT_SIMULATION_PARAMS, months: 6 });
      expect(result.projections).toHaveLength(6);
    });

    it('projections have required fields', () => {
      const result = runSimulation(DEFAULT_SIMULATION_PARAMS);
      const first = result.projections[0];
      expect(first).toHaveProperty('month');
      expect(first).toHaveProperty('activePartners');
      expect(first).toHaveProperty('gmv');
      expect(first).toHaveProperty('totalCommission');
      expect(first).toHaveProperty('fixedCost');
      expect(first).toHaveProperty('netProfit');
    });

    it('summary has required metrics', () => {
      const result = runSimulation(DEFAULT_SIMULATION_PARAMS);
      expect(result.summary).toHaveProperty('totalGMV');
      expect(result.summary).toHaveProperty('totalProfit');
      expect(result.summary).toHaveProperty('avgProfitMargin');
      expect(result.summary).toHaveProperty('breakEvenMonth');
      expect(result.summary).toHaveProperty('finalPartnerCount');
    });

    it('totalGMV is positive', () => {
      const result = runSimulation(DEFAULT_SIMULATION_PARAMS);
      expect(result.summary.totalGMV).toBeGreaterThan(0);
    });

    it('partner count grows over time with net positive growth', () => {
      const result = runSimulation(DEFAULT_SIMULATION_PARAMS);
      const first = result.projections[0].activePartners;
      const last = result.projections[result.projections.length - 1].activePartners;
      expect(last).toBeGreaterThanOrEqual(first);
    });
  });

  describe('runMonteCarloSimulation', () => {
    it('returns best, worst, median, average', () => {
      const result = runMonteCarloSimulation(DEFAULT_SIMULATION_PARAMS, 10, 0.1);
      expect(result).toHaveProperty('median');
      expect(result).toHaveProperty('best');
      expect(result).toHaveProperty('worst');
      expect(result).toHaveProperty('average');
    });

    it('best >= median >= worst for totalGMV', () => {
      const result = runMonteCarloSimulation(DEFAULT_SIMULATION_PARAMS, 20, 0.1);
      expect(result.best.summary.totalGMV).toBeGreaterThanOrEqual(result.median.summary.totalGMV);
      expect(result.median.summary.totalGMV).toBeGreaterThanOrEqual(result.worst.summary.totalGMV);
    });
  });
});
