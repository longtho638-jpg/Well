import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';
import { Mail } from 'lucide-react';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles user input', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'Hello');
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('Hello');
  });

  it('renders with icon', () => {
    render(<Input icon={<Mail data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    // Check if padding class is added (implementation detail check)
    expect(screen.getByRole('textbox')).toHaveClass('pl-10');
  });

  it('renders error state', () => {
    render(<Input error />);
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('forwards refs', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
