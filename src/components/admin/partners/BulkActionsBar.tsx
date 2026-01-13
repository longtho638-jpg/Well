import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BulkActionsBarProps {
    selectedCount: number;
    loading: boolean;
    onAction: (action: 'activate' | 'ban' | 'export') => void;
    onClear: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
    selectedCount,
    loading,
    onAction,
    onClear
}) => {
    if (selectedCount === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#00575A]/5 border border-[#00575A]/20 rounded-xl p-4 flex items-center justify-between"
        >
            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#00575A]">
                    {selectedCount} partner{selectedCount > 1 ? 's' : ''} selected
                </span>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onAction('activate')}
                    disabled={loading}
                    icon={<Check className="w-4 h-4" />}
                >
                    Activate
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onAction('ban')}
                    disabled={loading}
                    icon={<Lock className="w-4 h-4" />}
                >
                    Ban
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction('export')}
                    disabled={loading}
                >
                    Export CSV
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClear}
                    icon={<X className="w-4 h-4" />}
                >
                    {''}
                </Button>
            </div>
        </motion.div>
    );
};
