import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { createLogger } from '../utils/logger';

const analyticsLogger = createLogger('AnalyticsService');

/**
 * Analytics Service
 * Provides data fetching and aggregation for dashboard charts and reports.
 * Uses Firestore for historical transaction data.
 */
export const analyticsService = {
    /**
     * Get daily revenue data for charts within a specific window
     * Aggregates transaction amounts by date.
     *
     * @param userId - The ID of the user to fetch data for
     * @param days - Number of days to look back (default: 7)
     * @returns Promise<Array<{name: string, value: number}>> Array of data points for Recharts
     */
    async getRevenueData(userId: string, days: number = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const q = query(
                collection(db, 'transactions'),
                where('userId', '==', userId),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                orderBy('createdAt', 'asc')
            );

            const querySnapshot = await getDocs(q);
            const transactions = querySnapshot.docs.map(doc => doc.data());

            // Group by day and sum amounts
            const dailyRevenue = new Map<string, number>();
            transactions.forEach(tx => {
                const date = (tx.createdAt as Timestamp).toDate().toLocaleDateString();
                dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + tx.amount);
            });

            return Array.from(dailyRevenue.entries()).map(([name, value]) => ({
                name,
                value,
            }));
        } catch (error) {
            analyticsLogger.error('Error fetching revenue data:', error);
            throw error;
        }
    },
};
