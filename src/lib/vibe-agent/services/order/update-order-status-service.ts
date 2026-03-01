import { z } from 'zod';
import { BaseService } from '../base-service';
import { supabase } from '@/lib/supabase';
import { domainEventDispatcher } from '../../domain-event-dispatcher';

export const UpdateOrderStatusInputSchema = z.object({
  orderId: z.string(),
  status: z.enum(['completed', 'cancelled']),
});

export const UpdateOrderStatusOutputSchema = z.object({
  success: z.boolean(),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusInputSchema>;
export type UpdateOrderStatusOutput = z.infer<typeof UpdateOrderStatusOutputSchema>;

export class UpdateOrderStatusService extends BaseService<typeof UpdateOrderStatusInputSchema, typeof UpdateOrderStatusOutputSchema> {
  protected inputSchema = UpdateOrderStatusInputSchema;
  protected outputSchema = UpdateOrderStatusOutputSchema;

  protected async implementation(input: UpdateOrderStatusInput): Promise<UpdateOrderStatusOutput> {
    const { orderId, status } = input;

    // First fetch the order to get details for the event
    const { data: orderData, error: fetchError } = await supabase
      .from('transactions')
      .select('user_id, amount')
      .eq('id', orderId)
      .single();

    if (fetchError) {
        throw fetchError;
    }

    const { error, data } = await supabase
      .from('transactions')
      .update({ status })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`Order ${orderId} is not in pending state and cannot be transitioned to ${status}`);
    }

    // Dispatch domain event
    await domainEventDispatcher.dispatch(status === 'completed' ? 'order:completed' : 'order:cancelled', {
      orderId,
      userId: orderData.user_id || 'unknown',
      amount: orderData.amount,
      products: [], // We could fetch products if needed, but keeping it simple for now
      status: status
    }, 'UpdateOrderStatusService');

    return { success: true };
  }
}

export const updateOrderStatusService = new UpdateOrderStatusService();
