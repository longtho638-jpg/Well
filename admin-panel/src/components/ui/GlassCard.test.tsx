import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('renders correctly', () => {
    render(<GlassCard>Content</GlassCard>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies gradient class', () => {
    render(<GlassCard gradient data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-gradient-to-br');
  });

  it('applies hover effect class', () => {
    render(<GlassCard hoverEffect data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('hover:shadow-xl');
  });

  it('forwards refs', () => {
    const ref = { current: null };
    render(<GlassCard ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
