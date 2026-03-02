/**
 * Referral service — network tree types and hierarchy transform helpers.
 * Extracted to keep referral-service.ts under 200 LOC.
 */

export interface NetworkNode {
  id: string;
  name: string;
  rank: 'member' | 'silver' | 'gold' | 'diamond' | string;
  level: number;
  totalSales: number;
  personalSales: number;
  children?: NetworkNode[];
  attributes?: {
    avatar?: string;
    joinedDate?: string;
    activeDownlines?: number;
  };
}

export interface ReferralTreeData {
  name: string;
  attributes?: {
    rank?: string;
    totalSales?: number;
    avatar?: string;
  };
  children?: ReferralTreeData[];
}

export interface SupabaseDownlineRow {
  id: string;
  user_id: string;
  name: string;
  rank: string;
  level: number;
  total_sales: number;
  personal_sales: number;
  avatar_url: string | null;
  created_at: string;
  active_downlines: number;
  parent_id: string | null;
}

export interface ReferralStats {
  totalDownlines: number;
  f1Count: number;
  f2Count: number;
  totalTeamSales: number;
  activeMembers: number;
}

/**
 * Transform flat RPC response array to hierarchical NetworkNode tree.
 */
export function transformToHierarchy(flatData: SupabaseDownlineRow[]): NetworkNode | null {
  if (!flatData || flatData.length === 0) return null;

  const nodeMap = new Map<string, NetworkNode>();
  let root: NetworkNode | null = null;

  flatData.forEach((item) => {
    const node: NetworkNode = {
      id: item.id || item.user_id || '',
      name: item.name || 'Unknown',
      rank: item.rank || 'member',
      level: item.level || 1,
      totalSales: item.total_sales || 0,
      personalSales: item.personal_sales || 0,
      children: [],
      attributes: {
        avatar: item.avatar_url || undefined,
        joinedDate: item.created_at,
        activeDownlines: item.active_downlines || 0,
      },
    };
    nodeMap.set(node.id, node);
    if (item.level === 1 || !item.parent_id) root = node;
  });

  flatData.forEach((item) => {
    if (item.parent_id) {
      const parent = nodeMap.get(item.parent_id);
      const child = nodeMap.get(item.id || item.user_id || '');
      if (parent && child) {
        if (!parent.children) parent.children = [];
        parent.children.push(child);
      }
    }
  });

  return root;
}

/**
 * Transform NetworkNode tree to react-d3-tree format.
 */
export function transformToD3Tree(node: NetworkNode | null): ReferralTreeData | null {
  if (!node) return null;

  const d3Node: ReferralTreeData = {
    name: node.name,
    attributes: {
      rank: node.rank,
      totalSales: node.totalSales,
      avatar: node.attributes?.avatar,
    },
  };

  if (node.children && node.children.length > 0) {
    d3Node.children = node.children
      .map((child) => transformToD3Tree(child))
      .filter((n): n is ReferralTreeData => n !== null);
  }

  return d3Node;
}
