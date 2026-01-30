import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from './KPICard';
import { DollarSign } from 'lucide-react';

describe('KPICard', () => {
  it('renders title and value', () => {
    render(
      <KPICard
        title="Test Metric"
        value="1,000"
        icon={DollarSign}
        trend={10}
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('renders positive trend correctly', () => {
    render(
      <KPICard
        title="Test Metric"
        value="1,000"
        icon={DollarSign}
        trend={5.5}
      />
    );
    expect(screen.getByText('5.5%')).toBeInTheDocument();
  });
});
