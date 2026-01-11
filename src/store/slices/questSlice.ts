/**
 * Quest Slice - Quests, XP, Gamification
 * Part of Store Decomposition (Phase 2 Refactoring)
 */

import { StateCreator } from 'zustand';
import { Quest, Transaction, User } from '../../types';
import { generateTxHash } from '../../utils/tokenomics';

// ============================================================================
// SLICE TYPES
// ============================================================================

export interface QuestState {
    quests: Quest[];
}

export interface QuestActions {
    completeQuest: (questId: string) => void;
    resetQuests: () => void;
}

export type QuestSlice = QuestState & QuestActions;

// ============================================================================
// SLICE CREATOR
// ============================================================================

type QuestSliceCreator = StateCreator<
    QuestSlice & {
        user: User;
        transactions: Transaction[];
    },
    [],
    [],
    QuestSlice
>;

export const createQuestSlice: QuestSliceCreator = (set, get) => ({
    quests: [],

    completeQuest: (questId) => {
        const state = get();
        const quest = state.quests.find(q => q.id === questId);
        if (!quest || quest.isCompleted) return;

        const growReward = quest.xp;

        const newTransaction: Transaction = {
            id: `TX-QUEST-${Date.now().toString().slice(-6)}`,
            userId: state.user.id,
            date: new Date().toISOString().split('T')[0],
            amount: growReward,
            type: 'Team Volume Bonus',
            status: 'completed',
            taxDeducted: 0,
            hash: generateTxHash(),
            currency: 'GROW'
        };

        set({
            quests: state.quests.map(q =>
                q.id === questId ? { ...q, isCompleted: true } : q
            ),
            user: {
                ...state.user,
                growBalance: state.user.growBalance + growReward
            },
            transactions: [newTransaction, ...state.transactions]
        } as Partial<QuestSlice & { user: User; transactions: Transaction[] }>);
    },

    resetQuests: () => set((state) => ({
        quests: state.quests.map(q => ({ ...q, isCompleted: false }))
    })),
});
