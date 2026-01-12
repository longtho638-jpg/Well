import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Product, Transaction, Quest } from '../types';
import { createLogger } from '../utils/logger';

const apiLogger = createLogger('API');

/**
 * User Operations
 */
export const userAPI = {
  // Get user by ID
  async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      apiLogger.error('Error fetching user:', error);
      throw error;
    }
  },

  // Create new user
  async createUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        joinedAt: Timestamp.now(),
        kycStatus: false,
      });

      // Create wallet for user
      await setDoc(doc(db, 'wallets', userId), {
        balance: 0,
        totalEarnings: 0,
        pendingPayout: 0,
        taxWithheldTotal: 0,
      });
    } catch (error) {
      apiLogger.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), updates as Record<string, unknown>);
    } catch (error) {
      apiLogger.error('Error updating user:', error);
      throw error;
    }
  },
};

/**
 * Wallet Operations
 */
export const walletAPI = {
  // Get wallet balance
  async getWallet(userId: string) {
    try {
      const walletDoc = await getDoc(doc(db, 'wallets', userId));
      if (walletDoc.exists()) {
        return walletDoc.data();
      }
      return null;
    } catch (error) {
      apiLogger.error('Error fetching wallet:', error);
      throw error;
    }
  },

  // Get user transactions
  async getTransactions(userId: string, limitCount = 50): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
    } catch (error) {
      apiLogger.error('Error fetching transactions:', error);
      throw error;
    }
  },
};

/**
 * Product Operations
 */
export const productAPI = {
  // Get all products
  async getProducts(): Promise<Product[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
    } catch (error) {
      apiLogger.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get product by ID
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (productDoc.exists()) {
        return { id: productDoc.id, ...productDoc.data() } as Product;
      }
      return null;
    } catch (error) {
      apiLogger.error('Error fetching product:', error);
      throw error;
    }
  },
};

/**
 * Quest Operations
 */
export const questAPI = {
  // Get all quests
  async getQuests(): Promise<Quest[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'quests'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Quest[];
    } catch (error) {
      apiLogger.error('Error fetching quests:', error);
      throw error;
    }
  },

  // Get user quest progress
  async getUserQuestProgress(userId: string, questId: string) {
    try {
      const progressDoc = await getDoc(
        doc(db, 'users', userId, 'questProgress', questId)
      );
      return progressDoc.exists() ? progressDoc.data() : null;
    } catch (error) {
      apiLogger.error('Error fetching quest progress:', error);
      throw error;
    }
  },

  // Update quest progress
  async updateQuestProgress(
    userId: string,
    questId: string,
    isCompleted: boolean
  ): Promise<void> {
    try {
      await setDoc(
        doc(db, 'users', userId, 'questProgress', questId),
        {
          questId,
          isCompleted,
          completedAt: isCompleted ? Timestamp.now() : null,
        },
        { merge: true }
      );
    } catch (error) {
      apiLogger.error('Error updating quest progress:', error);
      throw error;
    }
  },
};

/**
 * Order Operations
 */
export const orderAPI = {
  // Create new order
  async createOrder(userId: string, productId: string, quantity: number = 1) {
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId,
        productId,
        quantity,
        status: 'pending',
        createdAt: Timestamp.now(),
      });

      return orderRef.id;
    } catch (error) {
      apiLogger.error('Error creating order:', error);
      throw error;
    }
  },

  // Get user orders
  async getUserOrders(userId: string, limitCount = 50) {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      apiLogger.error('Error fetching orders:', error);
      throw error;
    }
  },
};

/**
 * Analytics Operations
 */
export const analyticsAPI = {
  // Get revenue data for charts
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
      apiLogger.error('Error fetching revenue data:', error);
      throw error;
    }
  },
};

/**
 * Export all APIs
 */
export default {
  user: userAPI,
  wallet: walletAPI,
  product: productAPI,
  quest: questAPI,
  order: orderAPI,
  analytics: analyticsAPI,
};
