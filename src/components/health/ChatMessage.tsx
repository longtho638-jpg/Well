import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Clock } from 'lucide-react';
import { Message, ProductRecommendation } from '@/hooks/useHealthCoach';
import { ProductRecommendationCard } from './ProductRecommendationCard';
import { useTranslation } from '@/hooks';

interface ChatMessageProps {
    message: Message;
    index: number;
    onQuickOrder: (rec: ProductRecommendation) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, onQuickOrder }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
            className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar */}
            <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`flex-shrink-0 w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-xl transition-all duration-300 ${message.role === 'user'
                        ? 'bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5'
                        : 'bg-[#00575A] dark:bg-teal-500/10 border border-teal-500/20 text-white dark:text-teal-400'
                    }`}
            >
                {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                ) : (
                    <Bot className="w-5 h-5 shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
                )}
            </motion.div>

            {/* Content Area */}
            <div className={`flex-1 max-w-[85%] sm:max-w-2xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <motion.div
                    className={`inline-block p-5 rounded-[1.5rem] shadow-2xl backdrop-blur-3xl transition-all duration-500 ${message.role === 'user'
                            ? 'bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-white/5'
                            : 'bg-[#00575A]/5 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-300 border border-emerald-500/10 dark:border-white/5'
                        }`}
                >
                    <p className="whitespace-pre-line leading-relaxed text-[15px] font-medium">
                        {message.content}
                    </p>
                </motion.div>

                {/* Optional Recommendation */}
                {message.productRecommendation && (
                    <div className="mt-4">
                        <ProductRecommendationCard
                            recommendation={message.productRecommendation}
                            onOrder={() => message.productRecommendation && onQuickOrder(message.productRecommendation)}
                        />
                    </div>
                )}

                {/* Footer */}
                <div className={`flex items-center gap-2 mt-2 px-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                        <Clock className="w-2.5 h-2.5" />
                        {message.timestamp.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                    {message.role === 'assistant' && (
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-2 py-0.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            {t('chatmessage.verified_advice')}</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
