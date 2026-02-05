import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetworkNode } from '../../services/referral-service';
import { ChevronDown, Trophy, Star, Shield, User, DollarSign } from 'lucide-react';

interface NetworkListMobileProps {
  node: NetworkNode;
}

const RankIcon = ({ rank }: { rank: string }) => {
  switch (rank?.toLowerCase()) {
    case 'diamond': return <Trophy className="w-4 h-4 text-cyan-400" />;
    case 'gold': return <Star className="w-4 h-4 text-yellow-400" />;
    case 'silver': return <Shield className="w-4 h-4 text-slate-300" />;
    default: return <User className="w-4 h-4 text-emerald-400" />;
  }
};

const NodeItem: React.FC<{ node: NetworkNode; level: number }> = ({ node, level }) => {
  const [isOpen, setIsOpen] = useState(level === 0); // Open root by default
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="w-full">
      <div
        className={`
          flex items-center justify-between p-3 rounded-xl mb-2
          ${level === 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/5'}
        `}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            {node.attributes?.avatar ? (
              <img src={node.attributes.avatar} alt={node.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                <RankIcon rank={node.rank} />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-zinc-900 text-[10px] font-bold px-1.5 rounded-full border border-white/10 text-white">
              {node.level || 'L' + level}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white">{node.name}</h4>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="capitalize">{node.rank}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-400">
                  {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(node.totalSales || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {hasChildren && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-4 border-l border-zinc-800 ml-4"
          >
            {node.children!.map((child) => (
              <NodeItem key={child.id} node={child} level={level + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const NetworkListMobile: React.FC<NetworkListMobileProps> = ({ node }) => {
  return (
    <div className="w-full space-y-2 pb-20">
      <NodeItem node={node} level={0} />
    </div>
  );
};
