import { useState, useCallback } from 'react';
import { useAgentOS } from '@/hooks/useAgentOS';
import { useToast } from '@/components/ui/Toast';
import { CopilotMessage, ObjectionType } from '@/types';
import { generateSalesScript, getCopilotCoaching } from '@/services/copilotService';
import { uiLogger } from '@/utils/logger';

interface UseCopilotProps {
    productContext?: string;
    userName?: string;
}

export const useCopilot = ({ productContext, userName = "Bạn" }: UseCopilotProps) => {
    const { executeAgent } = useAgentOS();
    const { showToast } = useToast();
    const [messages, setMessages] = useState<CopilotMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Xin chào ${userName}! 👋 Tôi là **The Copilot** - trợ lý bán hàng AI của bạn.\n\nTôi sẽ giúp bạn:\n✅ Xử lý từ chối khách hàng\n✅ Gợi ý câu trả lời thông minh\n✅ Tạo kịch bản bán hàng\n\nHãy thử nhập một câu phản đối của khách hàng, ví dụ: "Sản phẩm này đắt quá!"`,
            timestamp: new Date().toISOString()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCoaching, setShowCoaching] = useState(false);
    const [coaching, setCoaching] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(true);

    const handleSend = useCallback(async (customText?: string) => {
        const messageText = customText || input.trim();
        if (!messageText || isLoading) return;

        setShowSuggestions(false);

        const userMessage: CopilotMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const objectionTypeResponse = await executeAgent('Sales Copilot', {
                action: 'detectObjection',
                message: messageText
            });

            const response = await executeAgent('Sales Copilot', {
                action: 'suggestResponse',
                message: messageText
            });

            const assistantMessage: CopilotMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: (response as { message?: string })?.message || String(response) || 'Response received',
                timestamp: new Date().toISOString(),
                objectionType: (objectionTypeResponse as { type?: ObjectionType })?.type as ObjectionType,
                suggestion: (response as { message?: string })?.message || String(response)
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            uiLogger.error('Copilot error', error);
            const errorMessage: CopilotMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại!',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
            showToast('Failed to process message', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, executeAgent, showToast]);

    const handleGenerateScript = useCallback(async () => {
        if (!productContext) return;

        setIsLoading(true);
        try {
            const script = await generateSalesScript(
                'Sản phẩm hiện tại',
                productContext
            );

            const scriptMessage: CopilotMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: script,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, scriptMessage]);
            showToast('Sales script generated', 'success');
        } catch {
            showToast('Failed to generate script', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [productContext, showToast]);

    const handleGetCoaching = useCallback(async () => {
        if (messages.length < 3) return;

        setIsLoading(true);
        setShowCoaching(true);

        try {
            const conversationHistory = messages
                .filter(m => m.role !== 'assistant' || !m.content.includes('Xin chào'))
                .map(m => ({ role: m.role, content: m.content }));

            const tips = await getCopilotCoaching(conversationHistory);
            setCoaching(tips);
            showToast('Coaching tips ready', 'success');
        } catch {
            showToast('Failed to get coaching', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [messages, showToast]);

    return {
        messages,
        input,
        setInput,
        isLoading,
        showCoaching,
        setShowCoaching,
        coaching,
        showSuggestions,
        handleSend,
        handleGenerateScript,
        handleGetCoaching
    };
};
