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
  DocumentData,
  UpdateData,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Product, Transaction, Quest, UserRank, TransactionType, TokenType } from '../types';

/**
 * Firestore Document Types
 * These represent the structure of documents stored in Firestore
 */
export interface FirestoreUser extends DocumentData {
  name: string;
  email: string;
  rank: UserRank;
  totalSales: number;
  teamVolume: number;
  avatarUrl: string;
  joinedAt: Timestamp;
  kycStatus: boolean;
  nextPayoutDate?: string;
  estimatedBonus?: number;
  referralLink?: string;
  shopBalance: number;
  growBalance: number;
  stakedGrowBalance: number;
  businessValuation?: number;
  monthlyProfit?: number;
  projectedAnnualProfit?: number;
  equityValue?: number;
  cashflowValue?: number;
  assetGrowthRate?: number;
}

export interface FirestoreProduct extends DocumentData {
  name: string;
  price: number;
  commissionRate: number;
  imageUrl: string;
  description: string;
  salesCount: number;
  stock: number;
}

export interface FirestoreTransaction extends DocumentData {
  userId?: string;
  date: string;
  amount: number;
  type: TransactionType;
  status: 'pending' | 'completed';
  taxDeducted?: number;
  hash: string;
  currency: TokenType;
  createdAt: Timestamp;
}

export interface FirestoreQuest extends DocumentData {
  title: string;
  description: string;
  xp: number;
  type: 'onboarding' | 'sales' | 'learning';
  isCompleted: boolean;
}

export interface FirestoreWallet extends DocumentData {
  balance: number;
  totalEarnings: number;
  pendingPayout: number;
  taxWithheldTotal: number;
}

export interface FirestoreQuestProgress extends DocumentData {
  questId: string;
  isCompleted: boolean;
  completedAt: Timestamp | null;
}

export interface FirestoreOrder extends DocumentData {
  userId: string;
  productId: string;
  quantity: number;
  status: string;
  createdAt: Timestamp;
}

/**
 * Type Converters
 * Convert Firestore documents to application types
 */
function convertFirestoreUser(id: string, data: DocumentData): User {
  const firestoreUser = data as FirestoreUser;
  return {
    id,
    name: firestoreUser.name,
    email: firestoreUser.email,
    rank: firestoreUser.rank,
    totalSales: firestoreUser.totalSales,
    teamVolume: firestoreUser.teamVolume,
    avatarUrl: firestoreUser.avatarUrl,
    joinedAt: firestoreUser.joinedAt instanceof Timestamp
      ? firestoreUser.joinedAt.toDate().toISOString()
      : firestoreUser.joinedAt,
    kycStatus: firestoreUser.kycStatus,
    nextPayoutDate: firestoreUser.nextPayoutDate,
    estimatedBonus: firestoreUser.estimatedBonus,
    referralLink: firestoreUser.referralLink,
    shopBalance: firestoreUser.shopBalance,
    growBalance: firestoreUser.growBalance,
    stakedGrowBalance: firestoreUser.stakedGrowBalance,
    businessValuation: firestoreUser.businessValuation,
    monthlyProfit: firestoreUser.monthlyProfit,
    projectedAnnualProfit: firestoreUser.projectedAnnualProfit,
    equityValue: firestoreUser.equityValue,
    cashflowValue: firestoreUser.cashflowValue,
    assetGrowthRate: firestoreUser.assetGrowthRate,
  };
}

function convertFirestoreProduct(id: string, data: DocumentData): Product {
  const firestoreProduct = data as FirestoreProduct;
  return {
    id,
    name: firestoreProduct.name,
    price: firestoreProduct.price,
    commissionRate: firestoreProduct.commissionRate,
    imageUrl: firestoreProduct.imageUrl,
    description: firestoreProduct.description,
    salesCount: firestoreProduct.salesCount,
    stock: firestoreProduct.stock,
  };
}

function convertFirestoreTransaction(id: string, data: DocumentData): Transaction {
  const firestoreTransaction = data as FirestoreTransaction;
  return {
    id,
    userId: firestoreTransaction.userId,
    date: firestoreTransaction.date,
    amount: firestoreTransaction.amount,
    type: firestoreTransaction.type,
    status: firestoreTransaction.status,
    taxDeducted: firestoreTransaction.taxDeducted,
    hash: firestoreTransaction.hash,
    currency: firestoreTransaction.currency,
  };
}

function convertFirestoreQuest(id: string, data: DocumentData): Quest {
  const firestoreQuest = data as FirestoreQuest;
  return {
    id,
    title: firestoreQuest.title,
    description: firestoreQuest.description,
    xp: firestoreQuest.xp,
    type: firestoreQuest.type,
    isCompleted: firestoreQuest.isCompleted,
  };
}

/**
 * User Operations
 */
export const userAPI = {
  // Get user by ID
  async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return convertFirestoreUser(userDoc.id, userDoc.data());
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
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
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      // Convert User updates to Firestore-compatible format
      const firestoreUpdates: UpdateData<FirestoreUser> = {};

      // Only include defined fields
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          firestoreUpdates[key as keyof FirestoreUser] = value;
        }
      });

      await updateDoc(doc(db, 'users', userId), firestoreUpdates);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
};

/**
 * Wallet Operations
 */
export const walletAPI = {
  // Get wallet balance
  async getWallet(userId: string): Promise<FirestoreWallet | null> {
    try {
      const walletDoc = await getDoc(doc(db, 'wallets', userId));
      if (walletDoc.exists()) {
        return walletDoc.data() as FirestoreWallet;
      }
      return null;
    } catch (error) {
      console.error('Error fetching wallet:', error);
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
      return querySnapshot.docs.map(doc =>
        convertFirestoreTransaction(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error fetching transactions:', error);
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
      return querySnapshot.docs.map(doc =>
        convertFirestoreProduct(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get product by ID
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (productDoc.exists()) {
        return convertFirestoreProduct(productDoc.id, productDoc.data());
      }
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
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
      return querySnapshot.docs.map(doc =>
        convertFirestoreQuest(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error fetching quests:', error);
      throw error;
    }
  },

  // Get user quest progress
  async getUserQuestProgress(userId: string, questId: string): Promise<FirestoreQuestProgress | null> {
    try {
      const progressDoc = await getDoc(
        doc(db, 'users', userId, 'questProgress', questId)
      );
      return progressDoc.exists() ? progressDoc.data() as FirestoreQuestProgress : null;
    } catch (error) {
      console.error('Error fetching quest progress:', error);
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
      console.error('Error updating quest progress:', error);
      throw error;
    }
  },
};

/**
 * Order Response Interface
 */
export interface OrderResponse {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  status: string;
  createdAt: Timestamp;
}

/**
 * Order Operations
 */
export const orderAPI = {
  // Create new order
  async createOrder(userId: string, productId: string, quantity: number = 1): Promise<string> {
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
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get user orders
  async getUserOrders(userId: string, limitCount = 50): Promise<OrderResponse[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as FirestoreOrder;
        return {
          id: doc.id,
          userId: data.userId,
          productId: data.productId,
          quantity: data.quantity,
          status: data.status,
          createdAt: data.createdAt,
        };
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },
};

/**
 * Revenue Data Response Interface
 */
export interface RevenueDataPoint {
  name: string;
  value: number;
}

/**
 * Analytics Operations
 */
export const analyticsAPI = {
  // Get revenue data for charts
  async getRevenueData(userId: string, days: number = 7): Promise<RevenueDataPoint[]> {
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
      const transactions = querySnapshot.docs.map(doc => doc.data() as FirestoreTransaction);

      // Group by day and sum amounts
      const dailyRevenue = new Map<string, number>();
      transactions.forEach(tx => {
        if (tx.createdAt instanceof Timestamp) {
          const date = tx.createdAt.toDate().toLocaleDateString();
          dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + tx.amount);
        }
      });

      return Array.from(dailyRevenue.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    } catch (error) {
      console.error('Error fetching revenue data:', error);
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
