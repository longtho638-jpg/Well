import React from 'react';
import { NetworkNode } from '../../services/referral-service';
import { User, Trophy, Star, Shield, Users } from 'lucide-react';

interface NodeCardProps {
  nodeDatum: any; // react-d3-tree type is generic
  toggleNode: () => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({ nodeDatum, toggleNode }) => {
  const attributes = nodeDatum.attributes || {};
  const isExpanded = nodeDatum.__rd3t.collapsed === false;
  const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;

  // Rank badge configuration
  const getRankBadge = (rank: string) => {
    switch (rank?.toLowerCase()) {
      case 'diamond':
        return { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', icon: Trophy };
      case 'gold':
        return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: Star };
      case 'silver':
        return { color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/20', icon: Shield };
      default:
        return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: User };
    }
  };

  const rankConfig = getRankBadge(attributes.rank || 'member');
  const Icon = rankConfig.icon;

  return (
    <foreignObject x="-100" y="-40" width="200" height="80">
      <div
        onClick={toggleNode}
        className={`
          relative w-full h-full rounded-xl border backdrop-blur-md transition-all duration-300 cursor-pointer overflow-hidden
          ${isExpanded ? 'bg-white/10 border-white/20 shadow-lg shadow-emerald-500/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}
          ${hasChildren ? 'hover:scale-105' : ''}
        `}
      >
        <div className="flex items-center h-full p-3 gap-3">
          {/* Avatar/Icon */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${rankConfig.bg} ${rankConfig.border}`}>
            {attributes.avatar ? (
              <img src={attributes.avatar} alt={nodeDatum.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <Icon className={`w-5 h-5 ${rankConfig.color}`} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{nodeDatum.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${rankConfig.bg} ${rankConfig.color}`}>
                {attributes.rank || 'Member'}
              </span>
              {attributes.totalSales > 0 && (
                <span className="text-[10px] text-zinc-400 font-medium">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(attributes.totalSales)}
                </span>
              )}
            </div>
          </div>

          {/* Expand Indicator */}
          {hasChildren && (
            <div className={`
              w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300
              ${isExpanded ? 'rotate-180 bg-white/10 text-white' : 'bg-white/5 text-zinc-400'}
            `}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    </foreignObject>
  );
};
