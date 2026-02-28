export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  requested_at: string;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
  notes?: string;
  user?: {
    name: string;
    email: string;
  };
}

// Interface matching DB schema
export interface SupabaseWithdrawalRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  // Join fields
  user?: {
    name: string;
    email: string;
  } | null;
}
