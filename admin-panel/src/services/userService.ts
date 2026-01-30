import { supabase } from '../lib/supabase';
import { User, PaginationParams, PaginatedResponse } from '../types';

export const userService = {
  async getUsers(params: PaginationParams): Promise<PaginatedResponse<User>> {
    const { page, limit, search, sortBy = 'created_at', sortOrder = 'desc' } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('profiles') // Assuming 'profiles' table holds user data
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data as User[]) || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as User;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },
};
