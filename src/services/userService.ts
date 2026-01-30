import { doc, getDoc, setDoc, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';
import { createLogger } from '../utils/logger';

const userLogger = createLogger('UserService');

/**
 * WellNexus User Service (Hardened)
 * Orchestrates member profiles and identity logic.
 * Handles fetching and updating user profile data in Firestore.
 */
export const userService = {
    /**
     * Get user by ID with strict type casting
     * @param userId - The UUID of the user
     * @returns Promise<User | null> User profile object
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
     * Initializes user document and empty wallet document in Firestore.
     *
     * @param userId - The Auth ID of the new user
     * @param userData - Initial user data
     * @returns Promise<void>
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
     * @param userId - The UUID of the user
     * @param updates - Partial user object with fields to update
     * @returns Promise<void>
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
