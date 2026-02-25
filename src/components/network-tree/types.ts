export interface TreeNode {
    id: string;
    name: string;
    rank: string;
    roleId: number;
    sales: number;
    teamVolume: number;
    avatarUrl?: string;
    joinDate: string;
    children: TreeNode[];
}
