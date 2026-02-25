import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { describe, it, expect } from 'vitest';
import { Select } from './Select';
import { User } from 'lucide-react';
import React from 'react';

describe('Select', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ];

  it('renders correctly', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders options', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
  });

  it('renders label', () => {
    render(<Select label="Choose Option" options={options} id="select-id" />);
    expect(screen.getByLabelText('Choose Option')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    render(<Select options={options} onChange={() => {}} />);
    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'option1' } });
    expect(select).toHaveValue('option1');
  });

  it('shows error message', () => {
    render(<Select options={options} error="Invalid selection" />);
    const errorMessage = screen.getByText('Invalid selection');
    const select = screen.getByRole('combobox');

    expect(errorMessage).toBeInTheDocument();
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', errorMessage.id);
  });

  it('shows helper text', () => {
    render(<Select options={options} helperText="Select one" />);
    const helperText = screen.getByText('Select one');
    const select = screen.getByRole('combobox');

    expect(helperText).toBeInTheDocument();
    expect(select).toHaveAttribute('aria-describedby', helperText.id);
  });

  it('renders with icon', () => {
    render(<Select options={options} icon={<User data-testid="user-icon" />} />);
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLSelectElement>();
    render(<Select options={options} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});
