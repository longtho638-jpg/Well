import { supabase } from '../lib/supabase';
import { Customer, PaginationParams, PaginatedResponse } from '../types';

export const customerService = {
  async getCustomers(params: PaginationParams): Promise<PaginatedResponse<Customer>> {
    const { page, limit, search, sortBy = 'created_at', sortOrder = 'desc' } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data as Customer[]) || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Customer;
  },

  async getCustomerOrders(customerId: string): Promise<any[]> {
     const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

     if (error) throw error;
     return data || [];
  }
};
