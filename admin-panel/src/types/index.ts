export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'founder' | 'staff' | 'user';
  created_at: string;
}

export interface Distributor {
  id: string;
  user_id: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  total_sales: number;
  commission_rate: number;
  active: boolean;
  join_date: string;
  user?: User; // Joined data
}

export interface Customer {
  id: string;
  full_name: string;
  email?: string;
  phone: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  distributor_id?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string; // Often denormalized or joined
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
