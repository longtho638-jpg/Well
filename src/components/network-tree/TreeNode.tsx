import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Award, Shield } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { formatVND } from '@/utils/format';
import { TreeNode } from './types';
import { getRankColor } from './utils';

interface TreeNodeProps {
    node: TreeNode;
    level: number;
    onAddMember: (nodeId: string, nodeName: string) => void;
}

export const TreeNodeComponent: React.FC<TreeNodeProps> = memo(({ node, level, onAddMember }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* Node Card */}
            <div
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpanded(!expanded);
                    }
                }}
                className={`relative group z-10 flex flex-col items-center outline-none`}
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
                                loading="lazy"
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
                            title={t('networktree.add_member')}
                        >
                            <UserPlus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-zinc-800/50 rounded-lg p-2">
                            <p className="text-zinc-500">{t('networktree.sales')}</p>
                            <p className="text-white font-medium">{formatVND(node.sales)}</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-2">
                            <p className="text-zinc-500">{t('networktree.team')}</p>
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
                        {node.children.map((child) => (
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
});
