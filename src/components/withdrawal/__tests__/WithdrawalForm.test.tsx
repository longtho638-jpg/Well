import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WithdrawalForm } from '../withdrawal-form';
import { withdrawalService } from '@/services/withdrawal-service';
import * as storeModule from '@/store';
import { useToast } from '@/components/ui/Toast';

// Mock dependencies
vi.mock('@/services/withdrawal-service', () => ({
  withdrawalService: {
    createWithdrawalRequest: vi.fn(),
  },
}));

vi.mock('@/store', () => ({
  useStore: vi.fn(),
}));

vi.mock('@/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: vi.fn(),
}));

// Mock BankSelect component to avoid complexity with Select component
vi.mock('../bank-select', () => ({
  BankSelect: ({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) => (
    <div>
      <input
        data-testid="bank-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span>{error}</span>}
    </div>
  ),
}));

describe('WithdrawalForm', () => {
  const mockShowToast = vi.fn();
  const mockFetchUserFromDB = vi.fn();
  const mockUser = {
    name: 'Test User',
    shopBalance: 5000000, // 5M VND
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ showToast: mockShowToast });
    (storeModule.useStore as any).mockReturnValue({
      user: mockUser,
      fetchUserFromDB: mockFetchUserFromDB,
    });
  });

  it('renders correctly with default values', () => {
    render(<WithdrawalForm />);

    expect(screen.getByText('withdrawal.requestTitle')).toBeInTheDocument();
    // Check initial amount (MIN_WITHDRAWAL)
    const amountInput = screen.getByLabelText(/withdrawal.amount/);
    expect((amountInput as HTMLInputElement).value).toBe('2000000');
    // Check account name auto-fill
    const nameInput = screen.getByLabelText('withdrawal.accountName');
    expect((nameInput as HTMLInputElement).value).toBe('TEST USER');
  });

  it('shows error when amount is below minimum', async () => {
    render(<WithdrawalForm />);

    const amountInput = screen.getByLabelText(/withdrawal.amount/);
    fireEvent.change(amountInput, { target: { value: '100000' } }); // 100k

    const submitBtn = screen.getByRole('button', { name: /withdrawal.submitButton/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
        // Look for validation message (zod validation might be async/delayed or standard text)
        // Based on component code: minAmountError
        expect(screen.getByText(/withdrawal.minAmountError/)).toBeInTheDocument();
    });
  });

  it('shows error when amount exceeds balance', async () => {
    render(<WithdrawalForm />);

    const amountInput = screen.getByLabelText(/withdrawal.amount/);
    fireEvent.change(amountInput, { target: { value: '6000000' } }); // 6M > 5M balance

    const submitBtn = screen.getByRole('button', { name: /withdrawal.submitButton/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/withdrawal.insufficientBalance/)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<WithdrawalForm />);

    // Clear account name
    const nameInput = screen.getByLabelText('withdrawal.accountName');
    fireEvent.change(nameInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /withdrawal.submitButton/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('withdrawal.bankRequired')).toBeInTheDocument();
      expect(screen.getByText('withdrawal.accountNumberRequired')).toBeInTheDocument();
      expect(screen.getByText('withdrawal.accountNameRequired')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    render(<WithdrawalForm onSuccess={vi.fn()} />);

    // Fill form
    const amountInput = screen.getByLabelText(/withdrawal.amount/);
    fireEvent.change(amountInput, { target: { value: '3000000' } });

    const bankInput = screen.getByTestId('bank-select');
    fireEvent.change(bankInput, { target: { value: 'Vietcombank' } });

    const accountInput = screen.getByLabelText('withdrawal.accountNumber');
    fireEvent.change(accountInput, { target: { value: '123456789' } });

    const submitBtn = screen.getByRole('button', { name: /withdrawal.submitButton/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(withdrawalService.createWithdrawalRequest).toHaveBeenCalledWith(3000000, {
        bankName: 'Vietcombank',
        accountNumber: '123456789',
        accountName: 'TEST USER',
      });
      expect(mockShowToast).toHaveBeenCalledWith('withdrawal.successMessage', 'success');
      expect(mockFetchUserFromDB).toHaveBeenCalled();
    });
  });

  it('sets max amount when MAX button clicked', () => {
    render(<WithdrawalForm />);

    const maxBtn = screen.getByText('MAX');
    fireEvent.click(maxBtn);

    const amountInput = screen.getByLabelText(/withdrawal.amount/);
    expect((amountInput as HTMLInputElement).value).toBe('5000000');
  });
});
