import { supabase } from '../lib/supabase';
import { Distributor, PaginationParams, PaginatedResponse } from '../types';

export const distributorService = {
  async getDistributors(params: PaginationParams): Promise<PaginatedResponse<Distributor>> {
    const { page, limit, search, sortBy = 'join_date', sortOrder = 'desc' } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Join with profiles to get user details
    let query = supabase
      .from('distributors')
      .select('*, user:profiles(*)', { count: 'exact' });

    if (search) {
      // Searching on joined tables is tricky in Supabase without specific setup or views
      // For now, we'll assume search on local fields or simple implementation
      // Or search on profiles first then filter distributors (complex)
      // Simpler approach: Filter by distributor code or similar if available
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data to match Distributor interface
    const distributors = (data || []).map((d: any) => ({
      ...d,
      user: d.user // Supabase returns joined data as object
    }));

    return {
      data: distributors as Distributor[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getDistributorById(id: string): Promise<Distributor | null> {
    const { data, error } = await supabase
      .from('distributors')
      .select('*, user:profiles(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Distributor;
  },

  async updateDistributor(id: string, updates: Partial<Distributor>): Promise<Distributor> {
    const { data, error } = await supabase
      .from('distributors')
      .update(updates)
      .eq('id', id)
      .select('*, user:profiles(*)')
      .single();

    if (error) throw error;
    return data as Distributor;
  }
};
