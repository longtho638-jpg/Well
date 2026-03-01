import { supabase } from '@/lib/supabase';
import { adminLogger } from '@/utils/logger';
import { BaseService } from '@/lib/vibe-agent/services/base-service';
import {
  OrderPayloadSchema,
  OrderStatusUpdateSchema,
  OrderPayload,
  OrderStatusUpdate
} from '@/schemas/order';
import { z } from 'zod';
import { eventBus } from '@/lib/vibe-agent/event-bus';

// Re-export PendingOrder type for consumers
export type { PendingOrder } from '@/schemas/order-schema';

/**
 * Order Creation Service
 */
export class CreateOrderService extends BaseService<typeof OrderPayloadSchema, z.ZodString> {
  protected inputSchema = OrderPayloadSchema;
  protected outputSchema = z.string();

  protected async implementation(payload: OrderPayload): Promise<string> {
    const { items, customer, paymentMethod, totalAmount } = payload;

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
        order_code: payload.orderCode
      }
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      adminLogger.error('Create order failed', error);
      throw error;
    }

    eventBus.publish('well:order.created', { orderId: data.id, payload });

    return data.id;
  }
}

/**
 * Order Status Update Service
 */
export class UpdateOrderStatusService extends BaseService<typeof OrderStatusUpdateSchema, z.ZodVoid> {
  protected inputSchema = OrderStatusUpdateSchema;
  protected outputSchema = z.void();

  protected async implementation(input: OrderStatusUpdate): Promise<void> {
    const { orderId, status } = input;

    const { error, data } = await supabase
      .from('transactions')
      .update({ status })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) {
      adminLogger.error(`Failed to update order ${orderId} status to ${status}`, error);
      throw error;
    }

    if (!data) {
      throw new Error(`Order ${orderId} is not in pending state and cannot be transitioned to ${status}`);
    }

    if (status === 'completed') {
      eventBus.publish('well:order.completed', { orderId });
    } else if (status === 'cancelled') {
      eventBus.publish('well:order.cancelled', { orderId });
    }
  }
}

// Legacy wrapper for compatibility
export const orderService = {
  createOrder: (payload: OrderPayload) => new CreateOrderService().execute(payload),
  updateOrderStatus: (orderId: string, status: 'completed' | 'cancelled') =>
    new UpdateOrderStatusService().execute({ orderId, status }),

  async getPendingOrders() {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, user_id, amount, created_at, payment_proof_url, currency, status, type, user:users(name, email)')
      .eq('status', 'pending')
      .eq('type', 'sale')
      .order('created_at', { ascending: false });

    if (error) {
      adminLogger.error('Failed to fetch pending orders', error);
      throw error;
    }

    return (data || []).map((order: any) => {
      const userRaw = order.user;
      const user = Array.isArray(userRaw)
        ? (userRaw[0] as { name: string; email: string } | undefined) ?? { name: 'Unknown', email: '' }
        : (userRaw as unknown as { name: string; email: string } | null) ?? { name: 'Unknown', email: '' };
      return { ...order, user };
    });
  }
};
