import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, AlertCircle, Users, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface CopilotSuggestionsProps {
    onSelect: (text: string) => void;
}

export const CopilotSuggestions: React.FC<CopilotSuggestionsProps> = ({ onSelect }) => {
    const { t } = useTranslation();
    const suggestionChips = [
        { icon: DollarSign, text: "Giá sản phẩm đắt quá!", color: "from-orange-500 to-red-500" },
        { icon: AlertCircle, text: "Tôi chưa tin tưởng sản phẩm này", color: "from-red-500 to-pink-500" },
        { icon: Users, text: "Sản phẩm bên X rẻ hơn", color: "from-purple-500 to-indigo-500" },
        { icon: Zap, text: "Viết kịch bản bán hàng cho tôi", color: "from-cyan-500 to-blue-500" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 mt-3"
        >
            <p className="text-zinc-400 text-xs font-medium">{t('copilotsuggestions.g_i_c_u_h_i')}</p>
            <div className="grid grid-cols-2 gap-2">
                {suggestionChips.map((chip, index) => {
                    const Icon = chip.icon;
                    return (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(chip.text)}
                            className="relative group overflow-hidden rounded-xl p-3 text-left transition-all bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${chip.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                    {t('copilotsuggestions.g_i')}{index + 1}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors line-clamp-2">
                                {chip.text}
                            </p>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
};
