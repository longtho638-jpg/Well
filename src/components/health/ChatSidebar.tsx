import React from 'react';
import { motion } from 'framer-motion';
import { History, MessageSquare } from 'lucide-react';
import { useTranslation } from '@/hooks';

export interface ChatHistory {
    id: string;
    title: string;
    date: Date;
    messageCount: number;
}

const MOCK_CHAT_HISTORY: ChatHistory[] = [
    {
        id: '1',
        title: 'Tư vấn chứng mất ngủ',
        date: new Date(2025, 10, 18),
        messageCount: 12
    },
    {
        id: '2',
        title: 'Hỏi về tăng cường miễn dịch',
        date: new Date(2025, 10, 15),
        messageCount: 8
    },
    {
        id: '3',
        title: 'Stress công việc',
        date: new Date(2025, 10, 10),
        messageCount: 15
    }
];

interface ChatSidebarProps {
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ selectedId, onSelect }) => {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 bg-white dark:bg-zinc-900 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full"
        >
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00575A] to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <History className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('chatsidebar.l_ch_s')}</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">{t('chatsidebar.c_c_cu_c_h_i_tho_i')}</p>
                    </div>
                </div>
                <button className="w-full bg-gradient-to-r from-[#00575A] to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group">
                    <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    {t('chatsidebar.t_o_cu_c_h_i_tho_i_m_i')}</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {MOCK_CHAT_HISTORY.map((chat) => (
                    <motion.button
                        key={chat.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(chat.id)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${selectedId === chat.id
                                ? 'bg-emerald-500/10 border-2 border-emerald-500/30 shadow-md'
                                : 'bg-zinc-100 dark:bg-zinc-800/30 hover:bg-zinc-200 dark:hover:bg-zinc-800 border-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                    >
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1 line-clamp-1">
                            {chat.title}
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500 dark:text-zinc-500">
                                {chat.date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {chat.messageCount}
                            </span>
                        </div>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
};
