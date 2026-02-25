import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { describe, it, expect } from 'vitest';
import { Input } from './Input';
import { Mail } from 'lucide-react';
import React from 'react';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders label', () => {
    render(<Input label="Username" id="username" />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText('Type here');

    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(input).toHaveValue('Hello');
  });

  it('shows error message', () => {
    render(<Input error="Invalid input" />);
    const errorMessage = screen.getByText('Invalid input');
    const input = screen.getByRole('textbox');

    expect(errorMessage).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', errorMessage.id);
  });

  it('shows helper text', () => {
    render(<Input helperText="Helpful tip" />);
    const helperText = screen.getByText('Helpful tip');
    const input = screen.getByRole('textbox');

    expect(helperText).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby', helperText.id);
  });

  it('prioritizes error over helper text', () => {
    render(<Input error="Error" helperText="Helper" />);
    const errorMessage = screen.getByText('Error');
    const input = screen.getByRole('textbox');

    expect(errorMessage).toBeInTheDocument();
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby', errorMessage.id);
  });

  it('renders with icon', () => {
    render(<Input icon={<Mail data-testid="mail-icon" />} />);
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('renders required asterisk', () => {
    render(<Input label="Required Field" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
