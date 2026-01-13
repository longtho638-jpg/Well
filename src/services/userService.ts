import { doc, getDoc, setDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';
import { createLogger } from '../utils/logger';

const userLogger = createLogger('UserService');

/**
 * WellNexus User Service (Hardened)
 * Orchestrates member profiles and identity logic.
 */
export const userService = {
    /**
     * Get user by ID with strict type casting
     */
    async getUser(userId: string): Promise<User | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const data = userDoc.data() as DocumentData;
                return {
                    id: userDoc.id,
                    ...data
                } as User;
            }
            return null;
        } catch (error) {
            userLogger.error('Error fetching node profile:', error);
            throw error;
        }
    },

    /**
     * Create new user with associated wallet node
     */
    async createUser(userId: string, userData: Partial<User>): Promise<void> {
        try {
            userLogger.info(`Provisioning new network node: ${userId}`);

            await setDoc(doc(db, 'users', userId), {
                ...userData,
                joinedAt: Timestamp.now().toDate().toISOString(),
                kycStatus: false,
                totalSales: 0,
                teamVolume: 0,
                shopBalance: 0,
                stakedGrowBalance: 0
            });

            // provision associated wallet node
            await setDoc(doc(db, 'wallets', userId), {
                balance: 0,
                totalEarnings: 0,
                pendingPayout: 0,
                taxWithheldTotal: 0,
            });
        } catch (error) {
            userLogger.error('Node provisioning failed:', error);
            throw error;
        }
    },

    /**
     * Update user profile mutation
     */
    async updateUser(userId: string, updates: Partial<User>): Promise<void> {
        try {
            userLogger.info(`Mutating node profile: ${userId}`);
            await updateDoc(doc(db, 'users', userId), updates as Record<string, unknown>);
        } catch (error) {
            userLogger.error('Profile mutation failed:', error);
            throw error;
        }
    },
};
