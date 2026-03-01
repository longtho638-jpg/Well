/**
 * Product catalog lookup tool for agents
 * Searches products in Supabase by name or category keyword
 */
import { z } from 'zod';
import type { AgentTool } from './agent-tool-types';
import { supabase } from '@/lib/supabase';

const ProductParamsSchema = z.object({
  query: z.string().describe('Tên sản phẩm hoặc danh mục tìm kiếm'),
});

type ProductParams = z.infer<typeof ProductParamsSchema>;

interface ProductResult {
  products: Array<{ id: string; name: string; price: number; category: string }>;
  count: number;
}

export const productLookupTool: AgentTool<ProductParams, ProductResult> = {
  name: 'lookupProduct',
  description: 'Tìm kiếm sản phẩm trong catalog theo tên hoặc danh mục',
  parameters: ProductParamsSchema,
  execute: async ({ query }) => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, category')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) throw new Error(`Product lookup failed: ${error.message}`);

    const products = (data ?? []).map(p => ({
      id: p.id as string,
      name: p.name as string,
      price: (p.price as number) ?? 0,
      category: (p.category as string) ?? 'uncategorized',
    }));

    return { products, count: products.length };
  },
};
