# Test Coverage Report - 2026-03-05

**Goal:** 90%+ coverage for hooks & stores
**Status:** ⚠️ In Progress

---

## 📊 Current Coverage

### Hooks Tests
| Hook | Test File | Status |
|------|-----------|--------|
| useVendorDashboard | ✅ useVendorDashboard.test.ts | Covered |
| useAuth | ❌ | Missing |
| useWallet | ❌ | Missing |
| useProducts | ❌ | Missing |
| useOrders | ❌ | Missing |
| useNetworkTree | ❌ | Missing |
| useReferral | ❌ | Missing |
| useQuests | ❌ | Missing |
| useProductDetail | ❌ | Missing |
| useAuditLog | ❌ | Missing |

### Store Tests
| Slice | Test File | Status |
|-------|-----------|--------|
| walletSlice | ✅ walletSlice.test.ts | Covered |
| userSlice | ❌ | Missing |
| authSlice | ❌ | Missing |
| productsSlice | ❌ | Missing |
| ordersSlice | ❌ | Missing |

---

## 📋 Priority Tests to Add

### P0 - Critical Hooks
1. `useAuth.test.ts` - Login/logout, session management
2. `useWallet.test.ts` - Balance updates, transactions
3. `useProducts.test.ts` - Product fetching, filtering

### P1 - Important Hooks
4. `useOrders.test.ts` - Order creation, status updates
5. `useReferral.test.ts` - Referral code generation
6. `useNetworkTree.test.ts` - Tree visualization

### P2 - Store Slices
7. `userSlice.test.ts` - User state management
8. `authSlice.test.ts` - Auth state management
9. `productsSlice.test.ts` - Product state management

---

## 🔧 Test Templates

### Hook Test Template
```typescript
import { renderHook, act } from '@testing-library/react';
import { useHookName } from '../useHookName';

describe('useHookName', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current.loading).toBe(false);
  });

  it('should handle success case', async () => {
    const { result } = renderHook(() => useHookName());
    await act(async () => {
      await result.current.someAction();
    });
    expect(result.current.data).toBeDefined();
  });
});
```

### Store Test Template
```typescript
import { createStore } from 'zustand';
import { createStoreSlice } from '../slices/storeSlice';

describe('storeSlice', () => {
  it('should initialize with default state', () => {
    const store = createStore(createStoreSlice);
    expect(store.getState().someValue).toBe(expectedValue);
  });

  it('should update state on action', () => {
    const store = createStore(createStoreSlice);
    act(() => {
      store.getState().someAction(newValue);
    });
    expect(store.getState().someValue).toBe(newValue);
  });
});
```

---

## 📈 Coverage Target

| Category | Current | Target |
|----------|---------|--------|
| Hooks | ~10% | 90% |
| Stores | ~20% | 90% |
| Utils | ~80% | 90% |
| Components | ~60% | 80% |
| **Overall** | **~40%** | **90%** |

---

## ⏳ Next Steps

1. Create `useAuth.test.ts` (P0)
2. Create `useWallet.test.ts` (P0)
3. Create `useProducts.test.ts` (P0)
4. Create store slice tests (P1)
5. Run coverage report: `pnpm vitest run --coverage`
6. Verify 90%+ coverage achieved

---

*Created: 2026-03-05 11:41 AM*
