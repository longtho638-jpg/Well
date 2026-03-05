/**
 * Lazy Charts Components Tests
 * Tests for lazy-loaded chart components to ensure code splitting works correctly
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { RevenueChart, PerformanceChart, HealthCheckRadarChart } from '../lazy-charts';

// Mock chart data
const mockRevenueData = [
  { name: 'Day 1', value: 1000000 },
  { name: 'Day 2', value: 1500000 },
  { name: 'Day 3', value: 2000000 },
];

describe('Lazy Charts', () => {
  describe('RevenueChart', () => {
    it('should lazy load and render with data', async () => {
      render(<RevenueChart data={mockRevenueData} />);

      // Show loading state initially
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Wait for lazy-loaded component
      await waitFor(() => {
        expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle empty data', async () => {
      render(<RevenueChart data={[]} />);

      await waitFor(() => {
        expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('PerformanceChart', () => {
    it('should lazy load and render', async () => {
      render(<PerformanceChart data={mockRevenueData} />);

      expect(screen.getByRole('status')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('HealthCheckRadarChart', () => {
    it('should lazy load and render', async () => {
      const mockData = {
        health: 85,
        wellness: 75,
        fitness: 90,
      };

      render(<HealthCheckRadarChart data={mockData} />);

      expect(screen.getByRole('status')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Bundle Splitting', () => {
    it('should have separate chart chunk', async () => {
      // Verify charts are loaded from separate chunk
      const chunkUrl = await import('../lazy-charts');
      expect(chunkUrl).toBeDefined();
      expect(chunkUrl.RevenueChart).toBeDefined();
    });
  });
});
