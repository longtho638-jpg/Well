import { z } from 'zod';

export const GuestProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    ward: z.string().min(1, 'Ward is required'),
    district: z.string().min(1, 'District is required'),
    city: z.string().min(1, 'City is required'),
  }),
  note: z.string().optional(),
});

export const OrderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().nonnegative('Price must be non-negative'),
});

export const OrderPayloadSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  customer: z.object({
    userId: z.string().uuid().optional(),
    guestProfile: GuestProfileSchema.optional(),
  }).refine(data => data.userId || data.guestProfile, {
    message: "Either userId or guestProfile must be provided",
    path: ["customer"],
  }),
  paymentMethod: z.enum(['cod', 'banking', 'payos']),
  totalAmount: z.number().positive('Total amount must be positive'),
  orderCode: z.number().optional(),
});

export const OrderStatusUpdateSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  status: z.enum(['completed', 'cancelled']),
});

export type OrderPayload = z.infer<typeof OrderPayloadSchema>;
export type OrderStatusUpdate = z.infer<typeof OrderStatusUpdateSchema>;
