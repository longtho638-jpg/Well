import { useState, useCallback, useMemo } from 'react';
import { useStore } from '@/store';
import { questService } from '@/services/questService';
import { Quest } from '@/types';

import { LucideIcon } from 'lucide-react';

export type QuestStatus = 'done' | 'ready' | 'claimable';

export interface FullQuest extends Quest {
    status: QuestStatus;
    icon: LucideIcon;
    bgGradient: string;
    navigationPath?: string;
    reward: number;
}

export function useQuests() {
    const quests = useStore(state => state.quests);
    const completeQuest = useStore(state => state.completeQuest);

    const [claimableIds, setClaimableIds] = useState<Set<string>>(new Set());
    const [flyingTokens, setFlyingTokens] = useState<Array<{ id: string; x: number; y: number }>>([]);

    const fullQuests = useMemo(() => {
        return quests.map(q => {
            const meta = questService.getMetadata(q.id);
            let status: QuestStatus = q.isCompleted ? 'done' : 'ready';

            if (!q.isCompleted && claimableIds.has(q.id)) {
                status = 'claimable';
            }

            return {
                ...q,
                status,
                reward: q.xp,
                icon: meta?.icon,
                bgGradient: meta?.bgGradient || 'from-gray-400 to-gray-500',
                navigationPath: meta?.navigationPath
            } as FullQuest;
        });
    }, [quests, claimableIds]);

    const handleStartQuest = useCallback((questId: string, navigationPath?: string): boolean => {
        if (navigationPath) {
            // In a real app, this would redirect. Here we simulate completion readiness.
            setTimeout(() => {
                setClaimableIds(prev => new Set(prev).add(questId));
            }, 1500);
            return true;
        }
        return false;
    }, []);

    const handleClaimReward = useCallback((questId: string, rect: DOMRect) => {
        const quest = quests.find(q => q.id === questId);
        if (!quest) return;

        // Trigger animation
        const newToken = {
            id: `token-${Date.now()}`,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        setFlyingTokens(prev => [...prev, newToken]);

        // Mark as completed in store
        completeQuest(questId);

        // Remove from claimable
        setClaimableIds(prev => {
            const next = new Set(prev);
            next.delete(questId);
            return next;
        });
    }, [quests, completeQuest]);

    const stats = useMemo(() => {
        const completed = quests.filter(q => q.isCompleted).length;
        const totalRewards = quests.reduce((sum, q) => sum + (q.isCompleted ? q.xp : 0), 0);
        return {
            completedCount: completed,
            totalCount: quests.length,
            totalRewards,
            isAllCompleted: completed === quests.length
        };
    }, [quests]);

    const handleTokenAnimationComplete = useCallback((tokenId: string) => {
        setFlyingTokens(prev => prev.filter(t => t.id !== tokenId));
    }, []);

    return {
        quests: fullQuests,
        stats,
        flyingTokens,
        handleStartQuest,
        handleClaimReward,
        handleTokenAnimationComplete
    };
}
