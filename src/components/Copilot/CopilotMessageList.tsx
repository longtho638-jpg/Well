import React, { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CopilotMessage } from '@/types';
import { CopilotMessageItem } from './CopilotMessageItem';
import { CopilotSuggestions } from './CopilotSuggestions';

interface CopilotMessageListProps {
    messages: CopilotMessage[];
    isLoading: boolean;
    showSuggestions: boolean;
    onSend: (text: string) => void;
}

export const CopilotMessageList: React.FC<CopilotMessageListProps> = ({
    messages,
    isLoading,
    showSuggestions,
    onSend
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        const currentMessagesEnd = messagesEndRef.current;
        return () => {
            // Cancel any pending smooth scroll on unmount
            currentMessagesEnd?.scrollIntoView({ behavior: 'instant' });
        };
    }, [messages, isLoading]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950">
            <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                    <CopilotMessageItem
                        key={message.id}
                        message={message}
                        isLast={index === messages.length - 1}
                        isLoading={isLoading && index === messages.length - 1}
                    />
                ))}

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3">
                            <div className="flex gap-2">
                                <motion.div
                                    className="w-2 h-2 bg-emerald-500 rounded-full"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                                />
                                <motion.div
                                    className="w-2 h-2 bg-emerald-500/60 rounded-full"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                                />
                                <motion.div
                                    className="w-2 h-2 bg-emerald-500/30 rounded-full"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {showSuggestions && messages.length <= 1 && !isLoading && (
                    <CopilotSuggestions onSelect={onSend} />
                )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </div>
    );
};
