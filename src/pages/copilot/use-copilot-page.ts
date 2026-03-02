import { useState } from 'react';
import { MessageCircle, Target, TrendingUp } from 'lucide-react';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';

export interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

export function useCopilotPage() {
  const { t, i18n } = useTranslation();
  const { user } = useStore();

  const [showHistory, setShowHistory] = useState(true);
  const [chatSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: t('copilotpage.mock.session1.title'),
      timestamp: new Date(new Date().setHours(new Date().getHours() - 2)),
      preview: t('copilotpage.mock.session1.preview')
    },
    {
      id: '2',
      title: t('copilotpage.mock.session2.title'),
      timestamp: new Date(new Date().setHours(new Date().getHours() - 5)),
      preview: t('copilotpage.mock.session2.preview')
    },
    {
      id: '3',
      title: t('copilotpage.mock.session3.title'),
      timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
      preview: t('copilotpage.mock.session3.preview')
    },
    {
      id: '4',
      title: t('copilotpage.mock.session4.title'),
      timestamp: new Date(new Date().setDate(new Date().getDate() - 2)),
      preview: t('copilotpage.mock.session4.preview')
    }
  ]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const promptSuggestions = [
    { icon: '📝', title: t('copilotpage.prompts.facebook.title'), prompt: t('copilotpage.prompts.facebook.prompt') },
    { icon: '💬', title: t('copilotpage.prompts.salesScript.title'), prompt: t('copilotpage.prompts.salesScript.prompt') },
    { icon: '🎯', title: t('copilotpage.prompts.objection.title'), prompt: t('copilotpage.prompts.objection.prompt') },
    { icon: '📞', title: t('copilotpage.prompts.coldCall.title'), prompt: t('copilotpage.prompts.coldCall.prompt') },
    { icon: '✨', title: t('copilotpage.prompts.highlight.title'), prompt: t('copilotpage.prompts.highlight.prompt') },
    { icon: '🎁', title: t('copilotpage.prompts.promotion.title'), prompt: t('copilotpage.prompts.promotion.prompt') }
  ];

  const features = [
    { icon: MessageCircle, title: t('copilot.features.objectionHandling.title'), description: t('copilot.features.objectionHandling.description') },
    { icon: Target, title: t('copilot.features.salesScript.title'), description: t('copilot.features.salesScript.description') },
    { icon: TrendingUp, title: t('copilot.features.realtimeCoaching.title'), description: t('copilot.features.realtimeCoaching.description') }
  ];

  const handleNewChat = () => setSelectedSession(null);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return t('copilotpage.time.justNow');
    if (diffHours < 24) return t('copilotpage.time.hoursAgo', { count: diffHours });
    if (diffHours < 48) return t('copilotpage.time.yesterday');
    return date.toLocaleDateString(i18n.language);
  };

  return {
    t,
    user,
    showHistory,
    setShowHistory,
    chatSessions,
    selectedSession,
    setSelectedSession,
    promptSuggestions,
    features,
    handleNewChat,
    formatTimestamp
  };
}
