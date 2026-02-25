import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';
import { useTranslation, useNetworkTree } from '@/hooks';
import { AddMemberModal } from './network-tree/AddMemberModal';
import { TreeNodeComponent } from './network-tree/TreeNode';

const NetworkTree: React.FC = () => {
    const { t } = useTranslation();
    const { treeData, loading, loadTree } = useNetworkTree();

    const [addMemberModal, setAddMemberModal] = useState<{ open: boolean; sponsorId: string; sponsorName: string }>({
        open: false,
        sponsorId: '',
        sponsorName: ''
    });

    // Optimization: Stable callback handler
    const handleAddMember = useCallback((id: string, name: string) => {
        setAddMemberModal({ open: true, sponsorId: id, sponsorName: name });
    }, []);

    return (
        <div className="relative min-h-[600px] overflow-x-auto bg-zinc-950 rounded-3xl border border-zinc-800 p-8">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-emerald-400" />
                        {t('networktree.s_h_th_ng_network_tree')}</h2>
                    <p className="text-zinc-400 text-sm">{t('networktree.visual_representation_of_your')}</p>
                </div>
                <button
                    onClick={loadTree}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                >
                    <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Tree Visualization */}
            <div className="relative z-10 flex justify-center min-w-max pb-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                        <p className="text-zinc-500">{t('networktree.loading_network_data')}</p>
                    </div>
                ) : treeData ? (
                    <TreeNodeComponent
                        node={treeData}
                        level={0}
                        onAddMember={handleAddMember}
                    />
                ) : (
                    <div className="text-center text-zinc-500">{t('networktree.no_data_available')}</div>
                )}
            </div>

            {/* Add Member Modal */}
            <AnimatePresence>
                {addMemberModal.open && (
                    <AddMemberModal
                        sponsorId={addMemberModal.sponsorId}
                        sponsorName={addMemberModal.sponsorName}
                        onClose={() => setAddMemberModal({ ...addMemberModal, open: false })}
                        onSuccess={loadTree}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default NetworkTree;
