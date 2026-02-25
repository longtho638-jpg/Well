import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { describe, it, expect } from 'vitest';
import { Select } from './Select';
import { Mail } from 'lucide-react';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

describe('Select', () => {
  it('renders correctly', () => {
    render(<Select options={options} defaultValue="" />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders label', () => {
    render(<Select label="Choose an option" options={options} />);
    expect(screen.getByLabelText('Choose an option')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    render(<Select options={options} defaultValue="" />);
    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'option1' } });
    expect(select).toHaveValue('option1');
  });

  it('shows error message', () => {
    render(<Select options={options} error="Invalid selection" />);
    expect(screen.getByText('Invalid selection')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows helper text', () => {
    render(<Select options={options} helperText="Helpful tip" />);
    expect(screen.getByText('Helpful tip')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(<Select options={options} icon={<Mail data-testid="mail-icon" />} />);
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('renders required asterisk', () => {
    render(<Select label="Required Field" options={options} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
