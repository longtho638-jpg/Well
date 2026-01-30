import { Sunrise, Share2, GraduationCap, LucideIcon } from 'lucide-react';

export interface QuestMetadata {
    id: string;
    icon: LucideIcon;
    bgGradient: string;
    navigationPath?: string;
    type: 'onboarding' | 'sales' | 'learning';
}

const QUEST_METADATA: Record<string, QuestMetadata> = {
    'daily-1': {
        id: 'daily-1',
        icon: Sunrise,
        bgGradient: 'from-green-400 to-emerald-500',
        type: 'onboarding'
    },
    'daily-2': {
        id: 'daily-2',
        icon: Share2,
        bgGradient: 'from-blue-400 to-cyan-500',
        navigationPath: '/dashboard/marketplace',
        type: 'sales'
    },
    'daily-3': {
        id: 'daily-3',
        icon: GraduationCap,
        bgGradient: 'from-purple-400 to-pink-500',
        navigationPath: '/dashboard',
        type: 'learning'
    }
};

export const questService = {
    /**
     * Get metadata for a specific daily quest
     * @param id - Quest ID (e.g., 'daily-1')
     */
    getMetadata(id: string): QuestMetadata | undefined {
        return QUEST_METADATA[id];
    },

    /**
     * Get all available quest metadata
     */
    getAllMetadata(): QuestMetadata[] {
        return Object.values(QUEST_METADATA);
    }
};
