import { z } from 'zod';

// ─── Webhook (PayOS callback) ────────────────────────────────────

export const PayOSWebhookSchema = z.object({
  code: z.string(),
  desc: z.string(),
  success: z.boolean(),
  data: z.object({
    orderCode: z.number().int().positive(),
    amount: z.number().positive(),
    description: z.string().max(500),
    reference: z.string().min(1),
    transactionDateTime: z.string(),
    currency: z.string().length(3),
    paymentLinkId: z.string().min(1),
    code: z.string(),
    desc: z.string(),
    counterAccountBankId: z.string().optional(),
    counterAccountBankName: z.string().optional(),
    counterAccountName: z.string().optional(),
    counterAccountNumber: z.string().optional(),
    virtualAccountName: z.string().optional(),
    virtualAccountNumber: z.string().optional(),
  }),
  signature: z.string().min(1),
});

export type PayOSWebhook = z.infer<typeof PayOSWebhookSchema>;

// ─── Wallet operations ───────────────────────────────────────────

const VND_MIN = 10_000;
const VND_MAX = 500_000_000;

export const PayoutRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z
    .number()
    .int('Amount must be whole VND')
    .min(VND_MIN, `Minimum payout is ${VND_MIN.toLocaleString()} VND`)
    .max(VND_MAX, `Maximum payout is ${VND_MAX.toLocaleString()} VND`),
});

export const WithdrawalRequestSchema = z.object({
  amount: z
    .number()
    .int('Amount must be whole VND')
    .min(VND_MIN, `Minimum withdrawal is ${VND_MIN.toLocaleString()} VND`)
    .max(VND_MAX, `Maximum withdrawal is ${VND_MAX.toLocaleString()} VND`),
  bankName: z.string().min(2, 'Bank name is required').max(100),
  accountNumber: z
    .string()
    .min(6, 'Account number too short')
    .max(20, 'Account number too long')
    .regex(/^\d+$/, 'Account number must contain only digits'),
  accountName: z.string().min(2, 'Account holder name is required').max(100),
});

export type PayoutRequest = z.infer<typeof PayoutRequestSchema>;
export type WithdrawalRequestInput = z.infer<typeof WithdrawalRequestSchema>;

// ─── Re-export existing schemas for a single import point ────────

export {
  // Order schemas (src/schemas/order.ts)
  OrderItemSchema,
  OrderPayloadSchema,
  OrderStatusUpdateSchema,
  GuestProfileSchema,
  type OrderPayload,
  type OrderStatusUpdate,
} from './order';

export {
  // Auth schemas (src/lib/schemas/auth.ts)
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginFormValues,
  type SignupFormValues,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from '../lib/schemas/auth';
