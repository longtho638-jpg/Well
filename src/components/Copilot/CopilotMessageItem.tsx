import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Lightbulb } from 'lucide-react';
import { CopilotMessage, ObjectionType } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { useTranslation } from '@/hooks';

interface CopilotMessageItemProps {
    message: CopilotMessage;
    isLast: boolean;
    isLoading?: boolean;
}

const useTypingEffect = (text: string, speed: number = 20) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        if (!text) return;
        setDisplayedText('');
        setIsTyping(true);
        let currentIndex = 0;
        const timer = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedText(text.slice(0, currentIndex + 1));
                currentIndex++;
            } else {
                setIsTyping(false);
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return { displayedText, isTyping };
};

const TypingText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 20 }) => {
    const { displayedText, isTyping } = useTypingEffect(text, speed);
    return (
        <span>
            {displayedText}
            {isTyping && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>|</motion.span>}
        </span>
    );
};

export const CopilotMessageItem: React.FC<CopilotMessageItemProps> = React.memo(({ message, isLast, isLoading }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);
    const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        };
    }, []);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
        showToast('Copied to clipboard', 'success');
    };

    const getObjectionBadge = (type?: ObjectionType) => {
        if (!type) return null;
        const badges: Record<ObjectionType, { label: string; color: string }> = {
            price: { label: t('copilot.objectionTypes.price'), color: 'bg-orange-100 text-orange-700' },
            skepticism: { label: t('copilot.objectionTypes.skepticism'), color: 'bg-red-100 text-red-700' },
            competition: { label: t('copilot.objectionTypes.competition'), color: 'bg-purple-100 text-purple-700' },
            timing: { label: t('copilot.objectionTypes.timing'), color: 'bg-blue-100 text-blue-700' },
            need: { label: t('copilot.objectionTypes.need'), color: 'bg-green-100 text-green-700' },
            general: { label: t('copilot.objectionTypes.general'), color: 'bg-gray-100 text-gray-700' }
        };
        const badge = badges[type];
        return (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const isAssistant = message.role === 'assistant';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${!isAssistant ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${!isAssistant
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm'}`}
            >
                {!isAssistant && message.objectionType && (
                    <div className="mb-2">
                        {getObjectionBadge(message.objectionType)}
                    </div>
                )}

                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {isAssistant && isLast && !isLoading ? (
                        <TypingText text={message.content} speed={15} />
                    ) : (
                        message.content
                    )}
                </div>

                {isAssistant && message.suggestion && message.objectionType !== 'general' && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-start gap-2 text-xs">
                            <Lightbulb className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-zinc-500 dark:text-zinc-400 mb-1 font-medium">{t('copilotmessageitem.g_i_nhanh')}</p>
                                <p className="text-zinc-700 dark:text-zinc-300 italic">{message.suggestion}</p>
                            </div>
                            <button
                                onClick={() => handleCopy(message.suggestion || '')}
                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                title="Copy suggestion"
                            >
                                {copied ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
});

CopilotMessageItem.displayName = 'CopilotMessageItem';
