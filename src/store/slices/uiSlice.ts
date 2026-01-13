/**
 * UI Slice - Landing Pages, Revenue Charts, Redemption
 * Part of Store Decomposition (Phase 17 Refactoring)
 */

import { StateCreator } from 'zustand';
import {
    UserLandingPage,
    LandingPageTemplate,
    RedemptionItem,
    RedemptionOrder,
    LandingPageTemplateType,
    User,
    Transaction
} from '../../types';
import { generateTxHash } from '../../utils/tokenomics';

export interface UIState {
    landingPageTemplates: LandingPageTemplate[];
    userLandingPages: UserLandingPage[];
    redemptionItems: RedemptionItem[];
    redemptionOrders: RedemptionOrder[];
}

export interface UIActions {
    createLandingPage: (template: string, portraitUrl?: string) => Promise<UserLandingPage>;
    publishLandingPage: (pageId: string) => void;
    redeemItem: (itemId: string) => Promise<void>;
}

export type UISlice = UIState & UIActions;

export const createUISlice: StateCreator<
    UISlice & { user: User; transactions: Transaction[] },
    [],
    [],
    UISlice
> = (set, get) => ({
    landingPageTemplates: [],
    userLandingPages: [],
    redemptionItems: [],
    redemptionOrders: [],

    createLandingPage: async (template, portraitUrl) => {
        const state = get();
        await new Promise(resolve => setTimeout(resolve, 2000));

        const aiGeneratedBio = `Tôi là ${state.user.name} - ${state.user.rank} tại WellNexus...`;

        const newPage: UserLandingPage = {
            id: `LP-${Date.now().toString().slice(-6)}`,
            userId: state.user.id,
            template: template as LandingPageTemplateType,
            portraitUrl,
            aiGeneratedBio,
            publishedUrl: `wellnexus.vn/lp/${state.user.id}`,
            isPublished: false,
            createdAt: new Date().toISOString().split('T')[0],
            views: 0,
            conversions: 0
        };

        set({
            userLandingPages: [...state.userLandingPages, newPage]
        } as Partial<UISlice>);

        return newPage;
    },

    publishLandingPage: (pageId) => set((state) => ({
        userLandingPages: state.userLandingPages.map(page =>
            page.id === pageId ? { ...page, isPublished: true } : page
        )
    }) as Partial<UISlice>),

    redeemItem: async (itemId) => {
        const state = get();
        const item = state.redemptionItems.find(i => i.id === itemId);

        if (!item || !item.isAvailable || item.stock <= 0 || state.user.growBalance < item.growCost) {
            throw new Error("Cannot redeem item");
        }

        const newOrder: RedemptionOrder = {
            id: `RO-${Date.now().toString().slice(-6)}`,
            userId: state.user.id,
            itemId: item.id,
            itemName: item.name,
            growSpent: item.growCost,
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0]
        };

        const newTransaction: Transaction = {
            id: `TX-REDEEM-${Date.now().toString().slice(-6)}`,
            userId: state.user.id,
            date: new Date().toISOString().split('T')[0],
            amount: item.growCost,
            type: 'Withdrawal',
            status: 'completed',
            taxDeducted: 0,
            hash: generateTxHash(),
            currency: 'GROW'
        };

        set({
            user: {
                ...state.user,
                growBalance: state.user.growBalance - item.growCost
            },
            redemptionItems: state.redemptionItems.map(i =>
                i.id === itemId ? { ...i, stock: i.stock - 1, redemptionCount: i.redemptionCount + 1 } : i
            ),
            redemptionOrders: [...state.redemptionOrders, newOrder],
            transactions: [newTransaction, ...state.transactions]
        } as Partial<UISlice & { user: User; transactions: Transaction[] }>);

        await new Promise(resolve => setTimeout(resolve, 1500));
    },
});
