import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import { uiLogger } from '@/utils/logger';
import { UserRank, RANK_NAMES } from '@/types';
import { TreeNode } from '@/components/network-tree/types';

export const useNetworkTree = () => {
    const { t } = useTranslation();
    const user = useStore(state => state.user);
    const fetchDownlineTree = useStore(state => state.fetchDownlineTree);

    const [treeData, setTreeData] = useState<TreeNode | null>(null);
    const [loading, setLoading] = useState(true);

    const loadTree = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const children = await fetchDownlineTree(user.id);

            // Construct Root Node (Current User)
            const rootNode: TreeNode = {
                id: user.id,
                name: user.name,
                rank: user.roleId in RANK_NAMES ? t(RANK_NAMES[user.roleId as UserRank]) : t('ranks.unknown'),
                roleId: user.roleId,
                sales: user.totalSales,
                teamVolume: user.teamVolume,
                avatarUrl: user.avatarUrl,
                joinDate: user.joinedAt,
                children: children
            };

            setTreeData(rootNode);
        } catch (error) {
            uiLogger.error('Error loading tree', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.name, user?.roleId, user?.totalSales, user?.teamVolume, user?.avatarUrl, user?.joinedAt, fetchDownlineTree, t]);

    useEffect(() => {
        loadTree();
    }, [loadTree]);

    return {
        treeData,
        loading,
        loadTree
    };
};
