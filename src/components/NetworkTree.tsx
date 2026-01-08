import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Plus,
    Search,
    ChevronRight,
    ChevronDown,
    UserPlus,
    MoreVertical,
    Award,
    TrendingUp,
    Shield,
    Zap,
    Loader2,
    X
} from 'lucide-react';
import { useStore } from '@/store';
import { UserRank, RANK_NAMES } from '@/types';
import { formatVND } from '@/utils/format';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// TYPES
// ============================================================

interface TreeNode {
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

// ============================================================
// ADD MEMBER MODAL
// ============================================================

const AddMemberModal: React.FC<{
    sponsorId: string;
    sponsorName: string;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ sponsorId, sponsorName, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: 'Password123!', // Default password for manual entry
        role_id: 8 // Default to CTV
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Auth User (or just DB entry if not using Auth for this MVP flow)
            // For this "Enter Tree" feature, we'll assume we are creating a real user account.
            // However, creating an Auth user requires admin rights or the signUp API.
            // We'll use the signUp API.

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        role_id: formData.role_id,
                        sponsor_id: sponsorId
                    }
                }
            });

            if (authError) throw authError;

            // If signUp doesn't automatically create the user record (due to triggers), we might need to.
            // But our triggers should handle it. 
            // Wait a moment for triggers to fire if needed.

            showToast(`Added ${formData.name} to the team!`, 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error adding member:', error);
            showToast(error.message || 'Failed to add member', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">Nhập Cây (Add Member)</h3>
                        <p className="text-sm text-zinc-400">Sponsor: <span className="text-emerald-400 font-medium">{sponsorName}</span></p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            placeholder="Nguyen Van A"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            placeholder="email@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            placeholder="0912345678"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Rank</label>
                        <select
                            value={formData.role_id}
                            onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value={8}>Cộng Tác Viên (CTV)</option>
                            <option value={7}>Khởi Nghiệp</option>
                            <option value={6}>Đại Sứ</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            Add Member
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// ============================================================
// TREE NODE COMPONENT
// ============================================================

const TreeNodeComponent: React.FC<{
    node: TreeNode;
    level: number;
    onAddMember: (nodeId: string, nodeName: string) => void;
}> = ({ node, level, onAddMember }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    // Rank Colors
    const getRankColor = (rankId: number) => {
        if (rankId <= 2) return 'border-purple-500 shadow-purple-500/20'; // High rank
        if (rankId <= 5) return 'border-blue-500 shadow-blue-500/20'; // Mid rank
        return 'border-zinc-700 shadow-zinc-500/10'; // Low rank
    };

    return (
        <div className="flex flex-col items-center">
            {/* Node Card */}
            <div
                className={`relative group z-10 flex flex-col items-center`}
                onClick={() => setExpanded(!expanded)}
            >
                <div className={`
          w-64 bg-zinc-900/90 backdrop-blur-xl border-2 rounded-2xl p-4 transition-all duration-300 cursor-pointer hover:scale-105
          ${getRankColor(node.roleId)} shadow-lg
        `}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={node.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(node.name)}&background=random`}
                                alt={node.name}
                                className="w-12 h-12 rounded-full border-2 border-white/10"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-0.5">
                                {node.roleId <= 6 ? <Award className="w-4 h-4 text-yellow-400" /> : <Shield className="w-4 h-4 text-zinc-500" />}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-bold truncate">{node.name}</h4>
                            <p className="text-xs text-zinc-400 truncate">{node.rank}</p>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddMember(node.id, node.name);
                            }}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-emerald-400"
                            title="Add Member Under This User"
                        >
                            <UserPlus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-zinc-800/50 rounded-lg p-2">
                            <p className="text-zinc-500">Sales</p>
                            <p className="text-white font-medium">{formatVND(node.sales)}</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-2">
                            <p className="text-zinc-500">Team</p>
                            <p className="text-white font-medium">{formatVND(node.teamVolume)}</p>
                        </div>
                    </div>
                </div>

                {/* Connector Line to Children */}
                {hasChildren && expanded && (
                    <div className="h-8 w-px bg-zinc-700 my-0"></div>
                )}
            </div>

            {/* Children Container */}
            <AnimatePresence>
                {hasChildren && expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-8 items-start pt-4 border-t border-transparent relative"
                    >
                        {/* Horizontal Connector Line */}
                        {node.children.length > 1 && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-16rem)] h-px bg-zinc-700" />
                        )}

                        {/* Vertical Connectors for each child */}
                        {node.children.map((child, index) => (
                            <div key={child.id} className="flex flex-col items-center relative">
                                {/* Top vertical line connecting to horizontal bar */}
                                <div className="h-4 w-px bg-zinc-700 absolute -top-4"></div>

                                <TreeNodeComponent
                                    node={child}
                                    level={level + 1}
                                    onAddMember={onAddMember}
                                />
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================================
// MAIN NETWORK TREE COMPONENT
// ============================================================

const NetworkTree: React.FC = () => {
    const { user, fetchDownlineTree } = useStore();
    const [treeData, setTreeData] = useState<TreeNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [addMemberModal, setAddMemberModal] = useState<{ open: boolean; sponsorId: string; sponsorName: string }>({
        open: false,
        sponsorId: '',
        sponsorName: ''
    });

    const loadTree = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const children = await fetchDownlineTree(user.id);

            // Construct Root Node (Current User)
            const rootNode: TreeNode = {
                id: user.id,
                name: user.name,
                rank: RANK_NAMES[user.roleId as UserRank] || 'Unknown',
                roleId: user.roleId,
                sales: user.totalSales,
                teamVolume: user.teamVolume,
                avatarUrl: user.avatarUrl,
                joinDate: user.joinedAt,
                children: children
            };

            setTreeData(rootNode);
        } catch (error) {
            console.error('Error loading tree:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTree();
    }, [user?.id]);

    return (
        <div className="relative min-h-[600px] overflow-x-auto bg-zinc-950 rounded-3xl border border-zinc-800 p-8">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-emerald-400" />
                        Sơ Đồ Hệ Thống (Network Tree)
                    </h2>
                    <p className="text-zinc-400 text-sm">Visual representation of your downline hierarchy.</p>
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
                        <p className="text-zinc-500">Loading network data...</p>
                    </div>
                ) : treeData ? (
                    <TreeNodeComponent
                        node={treeData}
                        level={0}
                        onAddMember={(id, name) => setAddMemberModal({ open: true, sponsorId: id, sponsorName: name })}
                    />
                ) : (
                    <div className="text-center text-zinc-500">No data available</div>
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
