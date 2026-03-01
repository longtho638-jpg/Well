import { z } from 'zod';
import { BaseService } from '../base-service';
import { supabase } from '@/lib/supabase';
import { domainEventDispatcher } from '../../domain-event-dispatcher';

export const CreateOrderInputSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
  customer: z.object({
    userId: z.string().nullable().optional(),
    guestProfile: z.any().optional(),
  }),
  paymentMethod: z.string(),
  totalAmount: z.number(),
  orderCode: z.string().optional(),
});

export const CreateOrderOutputSchema = z.object({
  orderId: z.string(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
export type CreateOrderOutput = z.infer<typeof CreateOrderOutputSchema>;

export class CreateOrderService extends BaseService<typeof CreateOrderInputSchema, typeof CreateOrderOutputSchema> {
  protected inputSchema = CreateOrderInputSchema;
  protected outputSchema = CreateOrderOutputSchema;

  protected async implementation(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const { items, customer, paymentMethod, totalAmount, orderCode } = input;

    const transactionData = {
      user_id: customer.userId || null,
      amount: totalAmount,
      type: 'sale',
      status: 'pending',
      currency: 'VND',
      created_at: new Date().toISOString(),
      metadata: {
        guest_profile: customer.guestProfile,
        items: items,
        payment_method: paymentMethod,
        is_guest: !customer.userId,
        order_code: orderCode
      }
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const orderId = data.id;

    // Dispatch domain event
    await domainEventDispatcher.dispatch('order:created', {
      orderId,
      userId: customer.userId || 'guest',
      amount: totalAmount,
      products: items.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })),
      status: 'created'
    }, 'CreateOrderService');

    return { orderId };
  }
}

export const createOrderService = new CreateOrderService();
