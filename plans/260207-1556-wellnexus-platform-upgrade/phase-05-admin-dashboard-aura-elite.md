# Phase 05: Admin Dashboard (Aura Elite)

## Context

Create a comprehensive admin dashboard with **Aura Elite design system** for monitoring PayOS transactions, managing users, viewing analytics, and accessing audit logs. The dashboard must reflect the glassmorphic, dark gradient aesthetic consistent with the rest of WellNexus.

**Current State:**
- No admin dashboard
- Admin role defined in Supabase RLS
- PayOS transactions logged but no UI to view them
- User management done via Supabase dashboard

**Target State:**
- Full-featured admin dashboard with Aura Elite styling
- Real-time PayOS transaction monitoring
- Commission analytics with visual charts
- User management (search, filter, role assignment)
- Audit log viewer with filtering
- Responsive design (desktop + tablet, mobile optional)

## Requirements

### Functional Requirements
- **FR-01:** PayOS transaction list with real-time updates (via Supabase Realtime)
- **FR-02:** Transaction details modal with payment status, metadata, timeline
- **FR-03:** Commission analytics dashboard (total earned, trends, top earners)
- **FR-04:** User management table (search, filter by role, edit roles)
- **FR-05:** Audit log viewer with filters (event type, date range, user)
- **FR-06:** Admin-only route protection (redirect non-admins)

### Non-Functional Requirements
- **NFR-01:** Aura Elite design system (glassmorphism, dark gradients, animations)
- **NFR-02:** Real-time transaction updates with < 1s latency
- **NFR-03:** Dashboard loads in < 2s (with data)
- **NFR-04:** Charts render with smooth animations (Framer Motion)
- **NFR-05:** Responsive down to 768px (tablet)

## Architecture

### Component Structure

```
src/
├── pages/
│   └── admin/
│       ├── admin-dashboard.tsx       # Main dashboard layout
│       ├── transactions-page.tsx     # PayOS transactions
│       ├── analytics-page.tsx        # Commission analytics
│       ├── users-page.tsx            # User management
│       └── audit-logs-page.tsx       # Audit log viewer
├── components/
│   └── admin/
│       ├── stat-card.tsx             # Aura Elite stat card
│       ├── transaction-table.tsx     # Transaction data table
│       ├── transaction-detail-modal.tsx
│       ├── commission-chart.tsx      # Chart.js/Recharts chart
│       ├── user-table.tsx            # User management table
│       ├── audit-log-table.tsx       # Audit log table
│       └── admin-sidebar.tsx         # Admin navigation
├── hooks/
│   ├── use-realtime-transactions.ts  # Supabase Realtime hook
│   ├── use-admin-analytics.ts        # Analytics data fetcher
│   └── use-admin-guard.ts            # Admin role guard
└── lib/
    └── admin-queries.ts              # Supabase queries for admin
```

### Database Queries

```sql
-- PayOS Transactions (with user info)
SELECT
  t.*,
  u.email,
  u.full_name
FROM transactions t
LEFT JOIN users u ON t.user_id = u.id
WHERE t.created_at >= NOW() - INTERVAL '30 days'
ORDER BY t.created_at DESC
LIMIT 100;

-- Commission Analytics (aggregated)
SELECT
  DATE_TRUNC('day', created_at) as date,
  SUM(amount) as total_commission,
  COUNT(*) as transaction_count
FROM transactions
WHERE status = 'completed'
GROUP BY date
ORDER BY date DESC
LIMIT 30;

-- Top Earners
SELECT
  u.id,
  u.full_name,
  u.email,
  SUM(t.amount) as total_earned,
  COUNT(t.id) as transaction_count
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
WHERE t.status = 'completed'
GROUP BY u.id, u.full_name, u.email
ORDER BY total_earned DESC
LIMIT 10;

-- Audit Logs (with filters)
SELECT *
FROM audit_logs
WHERE
  event_type = $1 OR $1 IS NULL
  AND user_id = $2 OR $2 IS NULL
  AND timestamp >= $3
  AND timestamp <= $4
ORDER BY timestamp DESC
LIMIT 50 OFFSET $5;
```

### Aura Elite Design Tokens

```typescript
// src/config/admin-theme.ts
export const adminTheme = {
  colors: {
    background: {
      primary: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      glass: 'rgba(255, 255, 255, 0.05)',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
    },
    accent: {
      primary: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      secondary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#a0a0a0',
      muted: '#606060',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  shadows: {
    glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
    card: '0 4px 16px rgba(0, 0, 0, 0.2)',
    hover: '0 12px 40px rgba(99, 102, 241, 0.3)',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
};
```

## Implementation Steps

### Step 1: Create Admin Route Guard

**File:** `src/hooks/use-admin-guard.ts`

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

export function useAdminGuard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    if (profile?.role !== 'admin') {
      navigate('/');
      console.warn('Access denied: Admin role required');
    }
  }, [user, profile, navigate]);

  return {
    isAdmin: profile?.role === 'admin',
    isLoading: !profile,
  };
}
```

### Step 2: Create Stat Card Component (Aura Elite)

**File:** `src/components/admin/stat-card.tsx`

```typescript
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 rounded-2xl border border-white/10
                 hover:border-white/20 transition-all duration-300
                 hover:shadow-[0_12px_40px_rgba(99,102,241,0.3)]"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400
                         bg-clip-text text-transparent">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>

        {icon && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-2">
          <span className={trend.isPositive ? 'text-green-400' : 'text-red-400'}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-500">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
```

### Step 3: Create Transaction Table

**File:** `src/components/admin/transaction-table.tsx`

```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';
import { TransactionDetailModal } from './transaction-detail-modal';

interface Transaction {
  id: string;
  user_email: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const statusColors = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    processing: 'text-blue-400 bg-blue-400/10',
    completed: 'text-green-400 bg-green-400/10',
    failed: 'text-red-400 bg-red-400/10',
  };

  return (
    <>
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setSelectedTransaction(tx)}
              >
                <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                  {tx.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{tx.user_email}</td>
                <td className="px-6 py-4 text-sm font-semibold text-white">
                  {tx.amount.toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {new Date(tx.created_at).toLocaleString('vi-VN')}
                </td>
                <td className="px-6 py-4">
                  <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                    View
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </>
  );
}
```

### Step 4: Create Realtime Transactions Hook

**File:** `src/hooks/use-realtime-transactions.ts`

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          user:users(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setTransactions(data);
      }
      setIsLoading(false);
    };

    fetchTransactions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('admin-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('Transaction change:', payload);

          if (payload.eventType === 'INSERT') {
            setTransactions(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTransactions(prev =>
              prev.map(tx => (tx.id === payload.new.id ? payload.new : tx))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { transactions, isLoading };
}
```

### Step 5: Create Admin Dashboard Page

**File:** `src/pages/admin/admin-dashboard.tsx`

```typescript
import { useAdminGuard } from '@/hooks/use-admin-guard';
import { useRealtimeTransactions } from '@/hooks/use-realtime-transactions';
import { StatCard } from '@/components/admin/stat-card';
import { TransactionTable } from '@/components/admin/transaction-table';
import { SEOHead } from '@/components/seo/seo-head';
import { useTranslation } from 'react-i18next';

export function AdminDashboard() {
  const { t } = useTranslation();
  const { isAdmin, isLoading: guardLoading } = useAdminGuard();
  const { transactions, isLoading: txLoading } = useRealtimeTransactions();

  if (guardLoading || txLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) return null;

  const totalRevenue = transactions
    .filter(tx => tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;
  const completedCount = transactions.filter(tx => tx.status === 'completed').length;

  return (
    <>
      <SEOHead title="Admin Dashboard - WellNexus" noindex />

      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-400 to-purple-400
                       bg-clip-text text-transparent">
          {t('admin.dashboard.title')}
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`${totalRevenue.toLocaleString('vi-VN')} ₫`}
            icon={<span className="text-2xl">💰</span>}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Pending"
            value={pendingCount}
            icon={<span className="text-2xl">⏳</span>}
          />
          <StatCard
            title="Completed"
            value={completedCount}
            icon={<span className="text-2xl">✅</span>}
            trend={{ value: 8.3, isPositive: true }}
          />
          <StatCard
            title="Total Transactions"
            value={transactions.length}
            icon={<span className="text-2xl">📊</span>}
          />
        </div>

        {/* Transactions Table */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Recent Transactions
          </h2>
          <TransactionTable transactions={transactions} />
        </div>
      </div>
    </>
  );
}
```

### Step 6: Create Admin Route

**File:** `src/App.tsx` (add admin route)

```typescript
import { AdminDashboard } from '@/pages/admin/admin-dashboard';

function App() {
  return (
    <Routes>
      {/* ... existing routes */}

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
```

### Step 7: Add Admin Link to Navigation

**File:** `src/components/navigation.tsx` (conditional admin link)

```typescript
import { useAuth } from '@/hooks/use-auth';

export function Navigation() {
  const { profile } = useAuth();

  return (
    <nav>
      {/* ... existing nav items */}

      {profile?.role === 'admin' && (
        <Link to="/admin" className="nav-link">
          <span>⚙️</span> Admin
        </Link>
      )}
    </nav>
  );
}
```

### Step 8: Add Admin Translation Keys

**File:** `src/locales/vi.ts`

```typescript
export default {
  // ... existing keys

  admin: {
    dashboard: {
      title: 'Bảng điều khiển Admin',
      stats: {
        revenue: 'Tổng doanh thu',
        pending: 'Chờ xử lý',
        completed: 'Hoàn thành',
        total: 'Tổng giao dịch',
      },
    },
    transactions: {
      title: 'Giao dịch gần đây',
      viewDetails: 'Xem chi tiết',
    },
  },
};
```

### Step 9: Create Transaction Detail Modal

**File:** `src/components/admin/transaction-detail-modal.tsx`

```typescript
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionDetailModalProps {
  transaction: any;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel max-w-2xl w-full mx-4 p-8 rounded-2xl border border-white/10"
        >
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Transaction ID</p>
                <p className="text-white font-mono">{transaction.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <p className="text-white font-semibold">{transaction.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Amount</p>
                <p className="text-white text-xl font-bold">
                  {transaction.amount.toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Date</p>
                <p className="text-white">
                  {new Date(transaction.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {transaction.metadata && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Metadata</p>
                <pre className="bg-black/30 p-4 rounded-lg text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

### Step 10: Add RLS Policy for Admin

**File:** `supabase/migrations/20260207_admin_rls.sql`

```sql
-- Allow admins to read all transactions
CREATE POLICY "Admins can read all transactions"
ON transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to read all audit logs
CREATE POLICY "Admins can read all audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

## Verification & Success Criteria

### Manual Testing

1. **Admin Access Test:**
   - Login as admin user
   - Navigate to `/admin`
   - Verify dashboard loads with stats

2. **Non-Admin Test:**
   - Login as regular user
   - Try to access `/admin`
   - Verify redirect to home

3. **Realtime Test:**
   - Open admin dashboard
   - Create test transaction (via PayOS or manual insert)
   - Verify transaction appears in table immediately

4. **Transaction Detail Test:**
   - Click on any transaction row
   - Verify modal opens with full details
   - Check metadata display

5. **Responsive Test:**
   - Resize browser to 768px (tablet)
   - Verify layout adapts correctly
   - Stats cards stack vertically

### Success Criteria Checklist

- [ ] Admin guard blocks non-admin users
- [ ] Dashboard loads with stats (revenue, pending, completed, total)
- [ ] Transaction table displays recent 100 transactions
- [ ] Realtime updates work (new transactions appear instantly)
- [ ] Transaction detail modal shows full info
- [ ] Aura Elite design (glassmorphism, gradients, animations)
- [ ] Responsive down to 768px
- [ ] Dashboard loads in < 2s
- [ ] Admin link appears in nav for admins only
- [ ] RLS policies protect admin data
- [ ] Translation keys added for admin UI
- [ ] TypeScript strict mode 0 errors

## Rollback Plan

1. **Remove admin routes:**
   ```bash
   git rm -r src/pages/admin src/components/admin
   git commit -m "Rollback: Remove admin dashboard"
   ```

2. **Revert RLS policies:**
   ```sql
   DROP POLICY "Admins can read all transactions" ON transactions;
   DROP POLICY "Admins can read all audit logs" ON audit_logs;
   ```

3. **Remove admin nav link:**
   ```typescript
   // src/components/navigation.tsx
   // Remove admin link conditional
   ```

## Next Steps

After Phase 5 completion:
- Proceed to Phase 6 (Security Headers & CSP Hardening)
- Consider adding user management table
- Add commission analytics charts
- Implement audit log filtering UI

---

**Estimated Effort:** 3 hours
**Dependencies:** Supabase Realtime, Framer Motion, admin role in database
**Risk Level:** Medium (admin features require careful access control testing)
