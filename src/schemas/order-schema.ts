import { z } from 'zod';

export const GuestProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    ward: z.string().min(1, 'Ward is required'),
    district: z.string().min(1, 'District is required'),
    city: z.string().min(1, 'City is required'),
  }),
  note: z.string().optional(),
});

export const PaymentMethodSchema = z.enum(['cod', 'banking', 'payos']);

export const OrderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().nonnegative('Price cannot be negative'),
});

export const OrderPayloadSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  customer: z.object({
    userId: z.string().uuid().optional(),
    guestProfile: GuestProfileSchema.optional(),
  }).refine(data => data.userId || data.guestProfile, {
    message: 'Either userId or guestProfile must be provided',
    path: ['customer'],
  }),
  paymentMethod: PaymentMethodSchema,
  totalAmount: z.number().nonnegative('Total amount cannot be negative'),
  orderCode: z.number().optional(),
});

export const PendingOrderSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  amount: z.number(),
  created_at: z.string(),
  payment_proof_url: z.string().url().optional().nullable(),
  currency: z.string(),
  status: z.string(),
  type: z.string(),
  user: z.object({
    name: z.string(),
    email: z.string(),
  }),
  metadata: z.record(z.any()).optional(),
});

export type OrderPayload = z.infer<typeof OrderPayloadSchema>;
export type PendingOrder = z.infer<typeof PendingOrderSchema>;
