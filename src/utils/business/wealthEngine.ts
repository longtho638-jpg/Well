import { User } from '@/types';

/**
 * Calculate Business Valuation (Investment-grade metric)
 * Formula: Monthly Profit * 12 (Annualized) * PE Ratio (5x for high-growth SMB)
 */
export function calculateBusinessValuation(user: User): number {
    // Estimate monthly profit: 20% of total sales (conservative margin)
    const monthlyProfit = user.totalSales * 0.20;
    // Annualize the monthly profit
    const annualizedProfit = monthlyProfit * 12;
    // Apply PE ratio of 5x (standard for high-growth small businesses)
    const PE_RATIO = 5;
    return annualizedProfit * PE_RATIO;
}

/**
 * Calculate Equity Value (GROW Token holdings)
 * Assumption: 1 GROW = 10,000 VND market value
 */
export function calculateEquityValue(growBalance: number): number {
    const GROW_TO_VND_RATE = 10000;
    return growBalance * GROW_TO_VND_RATE;
}

/**
 * Calculate monthly asset growth rate
 */
export function calculateAssetGrowthRate(user: User): number {
    // Simulated growth rate based on team volume momentum
    if (user.teamVolume > 100_000_000) return 15; // 15% monthly growth
    if (user.teamVolume > 50_000_000) return 10;  // 10% monthly growth
    if (user.teamVolume > 20_000_000) return 7;   // 7% monthly growth
    return 5; // 5% baseline growth
}

/**
 * Enrich user with Wealth OS metrics
 */
export function enrichUserWithWealthMetrics(user: User): User {
    const monthlyProfit = user.totalSales * 0.20; // 20% profit margin
    const businessValuation = calculateBusinessValuation(user);
    const equityValue = calculateEquityValue(user.growBalance + user.stakedGrowBalance);
    const cashflowValue = user.shopBalance;
    const assetGrowthRate = calculateAssetGrowthRate(user);
    const projectedAnnualProfit = monthlyProfit * 12;

    return {
        ...user,
        monthlyProfit,
        businessValuation,
        projectedAnnualProfit,
        equityValue,
        cashflowValue,
        assetGrowthRate,
    };
}
