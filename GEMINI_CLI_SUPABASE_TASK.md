# Task for Gemini CLI: Supabase Setup & Integration

## Context
Current: Mock data in `mockData.ts` + Zustand client state  
Target: Supabase database + Supabase Auth  
Deployment: Vercel (already set up)

---

## Phase 1: Supabase Project Setup (Manual - USER will do)

**USER Actions:**
1. Go to https://supabase.com
2. Create new project: "wellnexus-prod"
3. Get credentials:
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: `eyJxxx...`
4. Add to Vercel environment variables:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxx
   ```

---

## Phase 2: Database Schema (Manual - USER will run SQL)

**SQL to run in Supabase SQL Editor:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rank TEXT NOT NULL DEFAULT 'Member',
  avatar_url TEXT,
  shop_balance BIGINT DEFAULT 0,
  grow_balance BIGINT DEFAULT 0,
  staked_grow_balance BIGINT DEFAULT 0,
  total_sales BIGINT DEFAULT 0,
  team_volume BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  commission_rate FLOAT DEFAULT 0,
  image_url TEXT,
  sales_count INT DEFAULT 0,
  stock INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  amount BIGINT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  tax_deducted BIGINT DEFAULT 0,
  hash TEXT,
  currency TEXT DEFAULT 'SHOP',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent logs table
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  input JSONB,
  output JSONB,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own agent logs"
  ON agent_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Insert seed products (from mockData)
INSERT INTO products (id, name, description, price, commission_rate, image_url, sales_count, stock)
VALUES
  ('PROD-119', 'Combo ANIMA 119', 'Energy & Focus Supplement. Boosts daily performance naturally.', 1500000, 0.25, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80', 124, 50),
  ('PROD-120', 'WellNexus Starter Kit', 'Business Starter Kit. Everything you need to launch.', 3500000, 0.20, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80', 85, 20),
  ('PROD-121', 'Immune Boost Pack', 'Daily Vitamin C+ for family health.', 900000, 0.15, 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=400&q=80', 56, 100);
```

---

## Phase 3: Install Supabase Client (YOU EXECUTE)

### Task 3.1: Install package
```bash
npm install @supabase/supabase-js
```

### Task 3.2: Create Supabase client

**Create: `src/lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using mock data mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Task 3.3: Create `.env.local` (for local dev)

**Create: `.env.local`**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
VITE_GEMINI_API_KEY=your_gemini_key
```

---

## Phase 4: Minimal Store Integration (YOU EXECUTE)

Keep Zustand but add Supabase fetch methods.

### Task 4.1: Add Supabase imports to store

**Modify: `src/store.ts` (top of file)**
```typescript
import { supabase } from './lib/supabase';
```

### Task 4.2: Add fetch methods (append to store)

Add these methods at the end of `useStore`, before closing `}))`:

```typescript
  // ============================================================================
  // SUPABASE SYNC METHODS
  // ============================================================================

  /**
   * Fetch user from Supabase (called after auth)
   */
  fetchUserFromDB: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) {
      // Map Supabase user to app User type
      const user: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        rank: data.rank as UserRank,
        totalSales: data.total_sales,
        teamVolume: data.team_volume,
        shopBalance: data.shop_balance,
        growBalance: data.grow_balance,
        stakedGrowBalance: data.staked_grow_balance,
        // ... map other fields
      };
      
      set({ user: enrichUserWithWealthMetrics(user), isAuthenticated: true });
    }
  },

  /**
   * Persist agent log to Supabase
   */
  persistAgentLog: async (log: AgentLog) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    await supabase.from('agent_logs').insert([{
      agent_name: log.agentName,
      action: log.action,
      input: log.input,
      output: log.output,
      user_id: session?.user?.id
    }]);
  },
```

---

## Phase 5: Auth Integration (YOU EXECUTE)

### Task 5.1: Create auth hook

**Create: `src/hooks/useAuth.ts`**
```typescript
import { useEffect } from 'react';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const { fetchUserFromDB, setIsAuthenticated, setUser } = useStore();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserFromDB();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserFromDB();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    signIn: (email: string, password: string) => 
      supabase.auth.signInWithPassword({ email, password }),
    
    signUp: (email: string, password: string, name: string) =>
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name } // Store name in user metadata
        }
      }),
    
    signOut: () => supabase.auth.signOut(),
  };
}
```

### Task 5.2: Export hook

**Modify: `src/hooks/index.ts`**
```typescript
export { useAuth } from './useAuth';
```

---

## Phase 6: Update Login Flow (YOU EXECUTE)

### Task 6.1: Modify logout to use Supabase

**Modify: `src/store.ts` - `logout` method**
```typescript
  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: CURRENT_USER }); // Fallback to mock
  },
```

---

## Verification Steps

After completing all phases:

1. **Build check**:
   ```bash
   npm run build
   ```

2. **Dev server**:
   ```bash
   npm run dev
   ```

3. **Test**:
   - App should load with mock data (no Supabase connection yet)
   - No console errors
   - Agent Dashboard still works

---

## Success Criteria

- ✅ Supabase client installed
- ✅ `src/lib/supabase.ts` created
- ✅ Store has Supabase methods
- ✅ `useAuth` hook created
- ✅ Build succeeds
- ✅ App runs locally

---

## Notes

**This is Phase 1 integration** - app still uses mock data but infrastructure is ready.

**Next steps** (after USER creates Supabase project):
- Wire UI components to call Supabase
- Implement real signup/login
- Sync transactions to DB

Proceed with Phase 3-6 implementation (USER will do Phase 1-2 manually).
