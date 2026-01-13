import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface CopilotCoachingProps {
    showCoaching: boolean;
    coaching: string;
    onClose: () => void;
}

export const CopilotCoaching: React.FC<CopilotCoachingProps> = ({
    showCoaching,
    coaching,
    onClose
}) => {
    const { t } = useTranslation();
    return (
        <AnimatePresence>
            {showCoaching && coaching && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-zinc-200 dark:border-zinc-800 bg-blue-500/5 dark:bg-blue-500/10 backdrop-blur-xl p-4"
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 mb-2">{t('copilotcoaching.coaching_tips')}</h4>
                            <div className="text-sm text-blue-700 dark:text-blue-200 whitespace-pre-wrap">{coaching}</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-bold transition-colors"
                        >
                            {t('copilotcoaching.ng')}</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
