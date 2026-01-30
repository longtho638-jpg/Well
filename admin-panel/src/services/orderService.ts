import { supabase } from '../lib/supabase';
import { Order, PaginationParams, PaginatedResponse } from '../types';

export const orderService = {
  async getOrders(params: PaginationParams): Promise<PaginatedResponse<Order>> {
    const { page, limit, search, sortBy = 'created_at', sortOrder = 'desc' } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('orders')
      .select('*, customer:customers(*)', { count: 'exact' });

    if (search) {
      // Search logic
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data as Order[]) || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*), items:order_items(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Order;
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Order;
  }
};
