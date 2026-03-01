import { z } from 'zod';

export const OrderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  image: z.string().optional(),
});

export const GuestProfileSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string().optional(),
});

export const CreateOrderInputSchema = z.object({
  items: z.array(OrderItemSchema),
  customer: z.object({
    userId: z.string().nullable().optional(),
    guestProfile: GuestProfileSchema.optional(),
  }),
  paymentMethod: z.string(),
  totalAmount: z.number().positive(),
  orderCode: z.string(),
});

export const CreateOrderOutputSchema = z.object({
  orderId: z.string(),
  status: z.string(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
export type CreateOrderOutput = z.infer<typeof CreateOrderOutputSchema>;
