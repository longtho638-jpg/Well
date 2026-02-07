/**
 * Network Tree Export Utilities
 * Export network tree data to JSON and CSV formats
 */

import { exportToCSV, CSVColumn } from './csv-export-utility';

export interface NetworkNode {
  id: string;
  name: string;
  email?: string;
  level: number;
  rank?: string;
  totalSales?: number;
  commissionEarned?: number;
  children?: NetworkNode[];
  joinedAt?: string;
  parentId?: string;
}

interface FlattenedNode {
  id: string;
  name: string;
  email?: string;
  level: number;
  rank: string;
  totalSales: number;
  commissionEarned: number;
  joinedAt: string;
  parentId: string;
  childrenCount: number;
  depth: number;
}

/**
 * Flatten network tree to array for CSV export
 */
function flattenNetworkTree(node: NetworkNode, depth: number = 0): FlattenedNode[] {
  const result: FlattenedNode[] = [];

  // Add current node
  result.push({
    id: node.id,
    name: node.name,
    email: node.email,
    level: node.level || depth,
    rank: node.rank || 'Distributor',
    totalSales: node.totalSales || 0,
    commissionEarned: node.commissionEarned || 0,
    joinedAt: node.joinedAt || 'N/A',
    parentId: node.parentId || '',
    childrenCount: node.children?.length || 0,
    depth,
  });

  // Recursively add children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      result.push(...flattenNetworkTree(child, depth + 1));
    }
  }

  return result;
}

/**
 * Export network tree as JSON
 */
export function exportNetworkTreeJSON(rootNode: NetworkNode, filename?: string): void {
  const json = JSON.stringify(rootNode, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = filename || `network-tree-${Date.now()}.json`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export network tree as CSV (flattened)
 */
export function exportNetworkTreeCSV(rootNode: NetworkNode, filename?: string): void {
  // Flatten tree
  const flatData = flattenNetworkTree(rootNode);

  // Define CSV columns
  const columns: CSVColumn[] = [
    { key: 'id', header: 'User ID', formatter: (id: string | number | boolean | null | undefined) => typeof id === 'string' ? id.slice(0, 8) : '' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'level', header: 'Network Level (F1-F7)' },
    { key: 'depth', header: 'Tree Depth' },
    { key: 'rank', header: 'Rank' },
    {
      key: 'totalSales',
      header: 'Total Sales (VND)',
      formatter: (amount: string | number | boolean | null | undefined) => typeof amount === 'number' ? new Intl.NumberFormat('vi-VN').format(amount || 0) : '0'
    },
    {
      key: 'commissionEarned',
      header: 'Commission Earned (VND)',
      formatter: (amount: string | number | boolean | null | undefined) => typeof amount === 'number' ? new Intl.NumberFormat('vi-VN').format(amount || 0) : '0'
    },
    {
      key: 'joinedAt',
      header: 'Joined Date',
      formatter: (date: string | number | boolean | null | undefined) => typeof date === 'string' && date !== 'N/A' ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
    },
    { key: 'parentId', header: 'Parent ID', formatter: (id: string | number | boolean | null | undefined) => typeof id === 'string' && id ? id.slice(0, 8) : 'Root' },
    { key: 'childrenCount', header: 'Direct Referrals' },
  ];

  // Export to CSV
  exportToCSV(
    flatData,
    columns,
    filename || `network-tree-${Date.now()}.csv`
  );
}

/**
 * Calculate network statistics
 */
export function calculateNetworkStats(rootNode: NetworkNode): {
  totalMembers: number;
  maxDepth: number;
  totalSales: number;
  totalCommission: number;
  levelDistribution: Record<number, number>;
} {
  const flatData = flattenNetworkTree(rootNode);

  const stats = {
    totalMembers: flatData.length,
    maxDepth: Math.max(...flatData.map(n => n.depth)),
    totalSales: flatData.reduce((sum, n) => sum + (n.totalSales || 0), 0),
    totalCommission: flatData.reduce((sum, n) => sum + (n.commissionEarned || 0), 0),
    levelDistribution: {} as Record<number, number>,
  };

  // Calculate level distribution
  flatData.forEach(node => {
    const level = node.level || 0;
    stats.levelDistribution[level] = (stats.levelDistribution[level] || 0) + 1;
  });

  return stats;
}
