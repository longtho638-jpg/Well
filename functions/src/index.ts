import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * Constants
 */
const TAX_THRESHOLD = 2_000_000; // 2M VND
const TAX_RATE = 0.1; // 10% PIT

/**
 * Calculate tax based on Vietnam Circular 111/2013/TT-BTC
 */
function calculateTax(amount: number): number {
  if (amount <= TAX_THRESHOLD) {
    return 0;
  }
  return (amount - TAX_THRESHOLD) * TAX_RATE;
}

/**
 * Trigger: Process order and calculate commissions
 * Runs when a new order is created
 */
export const processOrder = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    try {
      // Get product details
      const productDoc = await db.collection('products').doc(order.productId).get();
      if (!productDoc.exists) {
        throw new Error('Product not found');
      }

      const product = productDoc.data();
      const orderTotal = product!.price * order.quantity;
      const commission = orderTotal * (product!.commissionRate || 0.25);

      // Calculate tax
      const taxAmount = calculateTax(commission);
      const netCommission = commission - taxAmount;

      // START TRANSACTION for Wallet Update
      await db.runTransaction(async (transaction) => {
        const walletRef = db.collection('wallets').doc(order.userId);
        const walletDoc = await transaction.get(walletRef);

        if (!walletDoc.exists) {
          throw new Error('Wallet not found');
        }

        // Create transaction record within the same transaction or outside (idempotency key needed if outside)
        // For simplicity and safety, we read wallet inside transaction, calculate new balance, and update.
        // We can write the transaction log outside or inside. Inside is better for consistency.
        
        const currentBalance = walletDoc.data()!.balance || 0;
        const currentEarnings = walletDoc.data()!.totalEarnings || 0;
        const currentTax = walletDoc.data()!.taxWithheldTotal || 0;

        transaction.update(walletRef, {
          balance: currentBalance + netCommission,
          totalEarnings: currentEarnings + commission,
          taxWithheldTotal: currentTax + taxAmount,
        });

        // We can also create the ledger entry here to be atomic
        const transactionRef = db.collection('transactions').doc();
        transaction.set(transactionRef, {
          userId: order.userId,
          type: 'commission',
          amount: netCommission,
          grossAmount: commission,
          taxDeducted: taxAmount,
          relatedOrderId: orderId,
          status: 'completed',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Update order status (can be outside transaction as it triggers this)
      await snap.ref.update({
        status: 'completed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        commission: netCommission,
        taxDeducted: taxAmount,
      });

      // Update product sales count
      await productDoc.ref.update({
        salesCount: admin.firestore.FieldValue.increment(order.quantity),
        stock: admin.firestore.FieldValue.increment(-order.quantity),
      });

      // Update user stats
      const userRef = db.collection('users').doc(order.userId);
      await userRef.update({
        totalSales: admin.firestore.FieldValue.increment(orderTotal),
        teamVolume: admin.firestore.FieldValue.increment(orderTotal * 0.2),
      });

      functions.logger.info(`Order ${orderId} processed successfully`, {
        commission: netCommission,
        tax: taxAmount,
      });
    } catch (error) {
      functions.logger.error(`Error processing order ${orderId}:`, error);
      await snap.ref.update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

/**
 * Trigger: Create wallet when new user is created
 */
export const createUserWallet = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;

    try {
      await db.collection('wallets').doc(userId).set({
        balance: 0,
        totalEarnings: 0,
        pendingPayout: 0,
        taxWithheldTotal: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`Wallet created for user ${userId}`);
    } catch (error) {
      functions.logger.error(`Error creating wallet for user ${userId}:`, error);
    }
  });

/**
 * Callable Function: Request payout
 */
export const requestPayout = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to request payout'
    );
  }

  const userId = context.auth.uid;
  const amount = data.amount;

  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid payout amount'
    );
  }

  try {
    // Use transaction to prevent race conditions (Double Spending)
    await db.runTransaction(async (transaction) => {
      const walletRef = db.collection('wallets').doc(userId);
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Wallet not found');
      }

      const currentBalance = walletDoc.data()!.balance || 0;

      if (amount > currentBalance) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Insufficient balance'
        );
      }

      // Create transaction record
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId,
        type: 'payout',
        amount: -amount,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update wallet
      transaction.update(walletRef, {
        balance: currentBalance - amount,
        pendingPayout: admin.firestore.FieldValue.increment(amount),
      });
    });

    functions.logger.info(`Payout requested for user ${userId}`, { amount });

    return { success: true, message: 'Payout request submitted' };
  } catch (error) {
    functions.logger.error(`Error requesting payout for user ${userId}:`, error);
    throw error;
  }
});

/**
 * Scheduled Function: Daily rank calculation
 * Runs every day at midnight (Vietnam time)
 */
export const calculateDailyRanks = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Asia/Ho_Chi_Minh')
  .onRun(async (context) => {
    try {
      const usersSnapshot = await db.collection('users').get();

      const batch = db.batch();

      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        let newRank = 'member';

        // Rank progression logic
        if (userData.teamVolume >= 100_000_000) {
          // 100M VND
          newRank = 'leader';
        } else if (userData.totalSales > 0) {
          newRank = 'pro';
        }

        if (userData.rank !== newRank) {
          batch.update(userDoc.ref, { rank: newRank });
          functions.logger.info(`User ${userDoc.id} promoted to ${newRank}`);
        }
      });

      await batch.commit();

      functions.logger.info('Daily rank calculation completed');
    } catch (error) {
      functions.logger.error('Error calculating daily ranks:', error);
    }
  });

/**
 * HTTP Function: Health check
 */
export const healthCheck = functions.https.onRequest((req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'wellnexus-functions',
  });
});
