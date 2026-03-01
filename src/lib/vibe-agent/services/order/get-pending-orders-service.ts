import { z } from 'zod';
import { BaseService } from '../base-service';
import { supabase } from '@/lib/supabase';

export const GetPendingOrdersInputSchema = z.void();

export const GetPendingOrdersOutputSchema = z.array(z.object({
  id: z.string(),
  user_id: z.string().nullable(),
  amount: z.number(),
  created_at: z.string(),
  payment_proof_url: z.string().nullable().optional(),
  currency: z.string(),
  status: z.string(),
  type: z.string(),
  user: z.object({
    name: z.string(),
    email: z.string(),
  }),
  metadata: z.record(z.any()).optional(),
}));

export type GetPendingOrdersOutput = z.infer<typeof GetPendingOrdersOutputSchema>;

export class GetPendingOrdersService extends BaseService<typeof GetPendingOrdersInputSchema, typeof GetPendingOrdersOutputSchema> {
  protected inputSchema = GetPendingOrdersInputSchema;
  protected outputSchema = GetPendingOrdersOutputSchema;

  protected async implementation(): Promise<GetPendingOrdersOutput> {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, user_id, amount, created_at, payment_proof_url, currency, status, type, metadata, user:users(name, email)')
      .eq('status', 'pending')
      .eq('type', 'sale')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((order) => {
      const userRaw = order.user;
      const user = Array.isArray(userRaw)
        ? (userRaw[0] as { name: string; email: string } | undefined) ?? { name: 'Unknown', email: '' }
        : (userRaw as unknown as { name: string; email: string } | null) ?? { name: 'Unknown', email: '' };
      return { ...order, user };
    });
  }
}

export const getPendingOrdersService = new GetPendingOrdersService();
