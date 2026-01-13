/**
 * WellNexus Health Coach Hook
 * Orchestrates AI health consultations and patient context management.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { agentLogger } from '@/utils/logger';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import { useAgentOS } from '@/hooks/useAgentOS';
import { formatVND } from '@/utils/format';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    productRecommendation?: ProductRecommendation;
    timestamp: Date;
}

export interface ProductRecommendation {
    comboName: string;
    products: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    totalPrice: number;
    reason: string;
}

export interface ChatHistory {
    id: string;
    title: string;
    date: Date;
    messageCount: number;
}

export const useHealthCoach = () => {
    const { t } = useTranslation();
    const { user, simulateOrder } = useStore();
    const { executeAgent } = useAgentOS();

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '0',
            role: 'assistant',
            content: t('healthCoach.greeting'),
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSendMessage = useCallback(async () => {
        if (!inputValue.trim() || isTyping) return;

        const userInput = inputValue;
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userInput,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            const aiResponseResult = await executeAgent('Gemini Coach', {
                action: 'getCoachAdvice',
                user: user,
                context: userInput
            });

            // Hardened parsing logic
            let responseContent = 'Xin lỗi, đã có lỗi xảy ra.';

            if (typeof aiResponseResult === 'string') {
                responseContent = aiResponseResult;
            } else if (aiResponseResult && typeof aiResponseResult === 'object') {
                const result = aiResponseResult as Record<string, unknown>;
                responseContent = (result.message as string) || (result.error as string) || (result.fallback as string) || responseContent;
            }

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseContent,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            agentLogger.error('HealthCoach Agent execution error', error);
            const errorMessage: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    }, [inputValue, isTyping, user, executeAgent]);

    const handleQuickOrder = useCallback((recommendation: ProductRecommendation) => {
        recommendation.products.forEach(product => {
            simulateOrder(product.id);
        });

        const confirmMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: t('healthCoach.orderSuccess', {
                comboName: recommendation.comboName,
                totalPrice: formatVND(recommendation.totalPrice)
            }),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmMessage]);
    }, [simulateOrder, t]);

    return {
        messages,
        inputValue,
        setInputValue,
        isTyping,
        selectedHistory,
        setSelectedHistory,
        messagesEndRef,
        handleSendMessage,
        handleQuickOrder
    };
};
