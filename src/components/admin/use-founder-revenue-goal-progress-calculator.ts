/**
 * useFounderRevenueGoalProgressCalculator hook
 * Computes revenue progress, pace status, and milestone data for the FounderRevenueGoal widget
 */

// ============================================================
// CONSTANTS
// ============================================================

export const GOAL_USD = 1_000_000;
export const EXCHANGE_RATE = 25_000;
export const CURRENT_REVENUE_VND = 2_450_000_000;
export const CURRENT_REVENUE_USD = CURRENT_REVENUE_VND / EXCHANGE_RATE;

export const AI_RECOMMENDATIONS = [
    {
        priority: 'high',
        title: 'Mở rộng đội partner',
        description: 'Tuyển thêm 20 partner trong Q1 để tăng reach',
        impact: '+$50K/tháng',
    },
    {
        priority: 'high',
        title: 'Launch sản phẩm mới',
        description: 'ANIMA Premium có margin cao hơn 40%',
        impact: '+$30K/tháng',
    },
    {
        priority: 'medium',
        title: 'Chiến dịch Tết',
        description: 'Flash sale 50% trong 3 ngày đầu tháng 2',
        impact: '+$25K one-time',
    },
];

export const MILESTONES = [250_000, 500_000, 750_000, 1_000_000];

// ============================================================
// HOOK
// ============================================================

export function useFounderRevenueGoalProgressCalculator() {
    const progressPercentage = (CURRENT_REVENUE_USD / GOAL_USD) * 100;

    const daysInYear = 365;
    const now = new Date();
    const currentDay = now.getDate() + now.getMonth() * 30;
    const expectedProgress = (currentDay / daysInYear) * 100;
    const paceStatus: 'ahead' | 'behind' = progressPercentage >= expectedProgress ? 'ahead' : 'behind';

    const milestones = MILESTONES.map((milestone, i) => ({
        milestone,
        quarter: `Q${i + 1}`,
        reached: CURRENT_REVENUE_USD >= milestone,
    }));

    return {
        progressPercentage,
        paceStatus,
        milestones,
        currentRevenueUSD: CURRENT_REVENUE_USD,
        currentRevenueVND: CURRENT_REVENUE_VND,
        goalUSD: GOAL_USD,
        recommendations: AI_RECOMMENDATIONS,
    };
}
