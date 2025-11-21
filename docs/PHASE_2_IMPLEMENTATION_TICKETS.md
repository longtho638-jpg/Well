# Phase 2 Implementation Tickets

**Project:** WellNexus MVP
**Version:** v2.0.0-beta
**Current Status:** Seed Stage (v1.0.0-seed)
**Target:** Production-Ready Platform with Backend Integration

---

## Overview

Phase 2 transitions WellNexus from a frontend-only prototype to a full-stack production platform. This document breaks down all implementation tasks into actionable tickets organized by epic.

**Timeline Estimate:** 8-12 weeks
**Team Size:** 3-5 developers (1 frontend, 2 backend, 1 full-stack, 1 QA)

---

## Epic 1: Backend Infrastructure Setup

### Ticket #1.1 - Backend Framework Setup
**Priority:** P0 (Critical)
**Estimate:** 3 days
**Assignee:** Backend Lead

**Description:**
Set up Node.js backend with Express/NestJS framework.

**Acceptance Criteria:**
- [ ] Initialize Node.js project with TypeScript
- [ ] Configure Express or NestJS framework
- [ ] Set up environment configuration (.env management)
- [ ] Configure CORS for frontend-backend communication
- [ ] Create basic health check endpoint (`/api/health`)
- [ ] Set up logging middleware (Winston/Pino)
- [ ] Configure request validation middleware

**Technical Details:**
```bash
# Recommended Stack
- Framework: NestJS 10+ or Express 4.18+
- Language: TypeScript 5.3+
- Validation: class-validator + class-transformer
- Logging: Winston or Pino
```

**Dependencies:** None
**Blocked By:** None

---

### Ticket #1.2 - Database Setup (PostgreSQL)
**Priority:** P0 (Critical)
**Estimate:** 4 days
**Assignee:** Backend Lead

**Description:**
Set up PostgreSQL database with proper schema design for WellNexus data models.

**Acceptance Criteria:**
- [ ] Install and configure PostgreSQL 14+
- [ ] Create database schema for:
  - Users table
  - Products table
  - Transactions table
  - Quests table
  - Commissions table (MLM tree structure)
- [ ] Set up ORM (Prisma or TypeORM)
- [ ] Create database migration scripts
- [ ] Seed database with initial data
- [ ] Configure database connection pooling
- [ ] Set up database backup strategy

**Schema Requirements:**
```sql
-- Key tables to implement:
- users (id, email, password_hash, rank, kyc_status, referral_code, parent_referrer_id)
- products (id, name, price, commission_rate, stock, is_active)
- transactions (id, user_id, amount, type, status, tax_deducted, created_at)
- user_hierarchy (user_id, upline_id, level, created_at)
- quests (id, title, description, xp, type, is_active)
- user_quests (user_id, quest_id, completed_at, claimed_xp)
```

**Dependencies:** Ticket #1.1
**Blocked By:** None

---

### Ticket #1.3 - Authentication System
**Priority:** P0 (Critical)
**Estimate:** 5 days
**Assignee:** Backend Developer

**Description:**
Implement JWT-based authentication with refresh tokens.

**Acceptance Criteria:**
- [ ] Implement user registration endpoint (`POST /api/auth/register`)
- [ ] Implement login endpoint (`POST /api/auth/login`)
- [ ] Implement logout endpoint (`POST /api/auth/logout`)
- [ ] Implement refresh token endpoint (`POST /api/auth/refresh`)
- [ ] Set up password hashing (bcrypt)
- [ ] Create JWT middleware for protected routes
- [ ] Implement rate limiting for auth endpoints
- [ ] Add email verification flow
- [ ] Add password reset flow

**Security Requirements:**
- Password hashing: bcrypt rounds = 12
- JWT expiry: Access token 15min, Refresh token 7 days
- Store refresh tokens in database with rotation
- Implement CSRF protection

**Dependencies:** Ticket #1.2
**Blocked By:** None

---

### Ticket #1.4 - API Documentation Setup
**Priority:** P1 (High)
**Estimate:** 2 days
**Assignee:** Full-stack Developer

**Description:**
Set up Swagger/OpenAPI documentation for all backend APIs.

**Acceptance Criteria:**
- [ ] Install Swagger dependencies (@nestjs/swagger or swagger-jsdoc)
- [ ] Configure Swagger UI route (`/api/docs`)
- [ ] Document authentication endpoints
- [ ] Add request/response schemas
- [ ] Include example requests
- [ ] Add authentication to Swagger UI (JWT bearer)

**Dependencies:** Ticket #1.1, #1.3
**Blocked By:** None

---

### Ticket #1.5 - Error Handling & Logging
**Priority:** P1 (High)
**Estimate:** 3 days
**Assignee:** Backend Developer

**Description:**
Implement comprehensive error handling and logging system.

**Acceptance Criteria:**
- [ ] Create global error handler middleware
- [ ] Define standard error response format
- [ ] Implement custom error classes (ValidationError, AuthError, etc.)
- [ ] Set up structured logging (JSON format)
- [ ] Configure log levels (debug, info, warn, error)
- [ ] Add request/response logging
- [ ] Set up log rotation
- [ ] Configure error alerting (Sentry/Rollbar integration)

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2025-11-21T10:00:00Z",
  "requestId": "req-123456"
}
```

**Dependencies:** Ticket #1.1
**Blocked By:** None

---

## Epic 2: User Management APIs

### Ticket #2.1 - User Profile API
**Priority:** P0 (Critical)
**Estimate:** 3 days
**Assignee:** Backend Developer

**Description:**
Implement CRUD operations for user profiles.

**Acceptance Criteria:**
- [ ] `GET /api/users/me` - Get current user profile
- [ ] `PATCH /api/users/me` - Update user profile
- [ ] `GET /api/users/:id` - Get user by ID (admin only)
- [ ] `GET /api/users` - List users with pagination (admin only)
- [ ] Implement profile image upload (AWS S3/Cloudinary)
- [ ] Add profile validation (email, phone format)
- [ ] Return proper error codes for unauthorized access

**Response Schema:**
```typescript
interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  rank: UserRank;
  totalSales: number;
  teamVolume: number;
  avatarUrl: string;
  joinedAt: string;
  kycStatus: boolean;
  nextPayoutDate?: string;
  estimatedBonus?: number;
  referralLink: string;
}
```

**Dependencies:** Ticket #1.2, #1.3
**Blocked By:** None

---

### Ticket #2.2 - KYC Verification API
**Priority:** P1 (High)
**Estimate:** 4 days
**Assignee:** Backend Developer

**Description:**
Implement KYC (Know Your Customer) verification flow for tax compliance.

**Acceptance Criteria:**
- [ ] `POST /api/kyc/submit` - Submit KYC documents
- [ ] `GET /api/kyc/status` - Check KYC verification status
- [ ] Store document uploads securely (encrypted S3 bucket)
- [ ] Implement manual admin review interface
- [ ] Send email notifications on KYC status changes
- [ ] Validate Vietnamese ID card format
- [ ] Store tax identification number (MST)

**Vietnam KYC Requirements:**
- Full legal name
- National ID (CCCD/CMND) - 12 digits
- Tax code (MST) - 10 digits
- Proof of address
- Selfie photo for identity verification

**Dependencies:** Ticket #2.1
**Blocked By:** None

---

### Ticket #2.3 - Referral System API
**Priority:** P1 (High)
**Estimate:** 5 days
**Assignee:** Backend Developer

**Description:**
Implement MLM referral tracking system.

**Acceptance Criteria:**
- [ ] `GET /api/referrals/my-link` - Get user's referral link
- [ ] `POST /api/referrals/register/:code` - Register via referral code
- [ ] `GET /api/referrals/tree` - Get downline tree structure
- [ ] `GET /api/referrals/stats` - Get referral statistics
- [ ] Validate referral code uniqueness
- [ ] Track multi-level hierarchy (up to 5 levels)
- [ ] Calculate team volume recursively
- [ ] Prevent circular referrals

**Referral Link Format:**
```
https://wellnexus.vn/join/ABC123XYZ
```

**Dependencies:** Ticket #2.1
**Blocked By:** None

---

## Epic 3: Product & Marketplace APIs

### Ticket #3.1 - Product Catalog API
**Priority:** P0 (Critical)
**Estimate:** 3 days
**Assignee:** Backend Developer

**Description:**
Implement product management endpoints.

**Acceptance Criteria:**
- [ ] `GET /api/products` - List products with pagination & filters
- [ ] `GET /api/products/:id` - Get product details
- [ ] `POST /api/products` - Create product (admin only)
- [ ] `PATCH /api/products/:id` - Update product (admin only)
- [ ] `DELETE /api/products/:id` - Soft delete product (admin only)
- [ ] Implement product search (name, description)
- [ ] Add filters: price range, commission rate, stock availability
- [ ] Support sorting: price, salesCount, newest

**Query Parameters:**
```
GET /api/products?
  page=1
  &limit=20
  &search=ANIMA
  &minPrice=1000000
  &maxPrice=20000000
  &inStock=true
  &sortBy=salesCount
  &order=desc
```

**Dependencies:** Ticket #1.2
**Blocked By:** None

---

### Ticket #3.2 - Inventory Management API
**Priority:** P1 (High)
**Estimate:** 3 days
**Assignee:** Backend Developer

**Description:**
Implement stock tracking and inventory management.

**Acceptance Criteria:**
- [ ] Real-time stock updates on orders
- [ ] Prevent overselling (optimistic locking)
- [ ] `GET /api/inventory/:productId` - Get stock levels
- [ ] `POST /api/inventory/:productId/adjust` - Manual stock adjustment (admin)
- [ ] Stock alert notifications (low stock threshold)
- [ ] Inventory history log
- [ ] Support for product variants (future enhancement)

**Stock Update Logic:**
- Use database transactions for atomic updates
- Implement row-level locking to prevent race conditions
- Return 409 Conflict if stock insufficient

**Dependencies:** Ticket #3.1
**Blocked By:** None

---

### Ticket #3.3 - Order Processing API
**Priority:** P0 (Critical)
**Estimate:** 5 days
**Assignee:** Backend Developer

**Description:**
Implement order creation and processing workflow.

**Acceptance Criteria:**
- [ ] `POST /api/orders` - Create new order
- [ ] `GET /api/orders` - List user's orders
- [ ] `GET /api/orders/:id` - Get order details
- [ ] `PATCH /api/orders/:id/status` - Update order status
- [ ] Calculate commission automatically
- [ ] Calculate tax deduction (Vietnam PIT 10%)
- [ ] Update user's total sales and team volume
- [ ] Create transaction records
- [ ] Send order confirmation email

**Order Workflow:**
```
pending → processing → completed → paid
                    ↓
                 cancelled
```

**Commission Distribution:**
- Level 1 (direct): Full commission rate
- Level 2-5 (team): Tiered bonus percentages

**Dependencies:** Ticket #3.1, #3.2
**Blocked By:** None

---

## Epic 4: Financial & Tax APIs

### Ticket #4.1 - Commission Calculation Engine
**Priority:** P0 (Critical)
**Estimate:** 6 days
**Assignee:** Backend Lead

**Description:**
Implement multi-level commission calculation system.

**Acceptance Criteria:**
- [ ] Calculate direct sales commission
- [ ] Calculate team volume bonuses (5 levels deep)
- [ ] Apply commission rates based on user rank
- [ ] Implement rank progression logic
- [ ] Track pending vs. paid commissions
- [ ] Create commission ledger entries
- [ ] Support commission adjustments (refunds, chargebacks)

**Commission Rules:**
```typescript
// Direct Commission
directCommission = productPrice * product.commissionRate

// Team Bonus (example tiered structure)
Level 1: 25% of commission
Level 2: 15% of commission
Level 3: 10% of commission
Level 4: 5% of commission
Level 5: 3% of commission

// Rank Multipliers
Member: 1.0x
Partner: 1.2x
Founder Club: 1.5x
```

**Dependencies:** Ticket #3.3
**Blocked By:** None

---

### Ticket #4.2 - Vietnam Tax Compliance API
**Priority:** P0 (Critical)
**Estimate:** 4 days
**Assignee:** Backend Developer

**Description:**
Implement automated Vietnam Personal Income Tax (PIT) calculations per Circular 111/2013/TT-BTC.

**Acceptance Criteria:**
- [ ] Calculate tax on commissions > 2,000,000 VND
- [ ] Apply 10% PIT rate on taxable amount
- [ ] Generate monthly tax reports
- [ ] `GET /api/tax/summary` - Get user's tax summary
- [ ] `GET /api/tax/report/:month` - Monthly tax report
- [ ] `POST /api/tax/declaration` - Submit tax declaration
- [ ] Store tax deduction records
- [ ] Generate tax invoice (Hóa đơn điện tử)

**Tax Calculation Formula:**
```typescript
const TAX_THRESHOLD = 2_000_000; // VND
const TAX_RATE = 0.10; // 10%

function calculateTax(commission: number): number {
  if (commission <= TAX_THRESHOLD) return 0;
  return (commission - TAX_THRESHOLD) * TAX_RATE;
}

// Example:
// Commission: 5,000,000 VND
// Taxable: 5,000,000 - 2,000,000 = 3,000,000 VND
// Tax: 3,000,000 × 10% = 300,000 VND
// Net: 5,000,000 - 300,000 = 4,700,000 VND
```

**Dependencies:** Ticket #4.1
**Blocked By:** None

---

### Ticket #4.3 - Wallet & Transaction API
**Priority:** P0 (Critical)
**Estimate:** 4 days
**Assignee:** Backend Developer

**Description:**
Implement commission wallet and transaction history.

**Acceptance Criteria:**
- [ ] `GET /api/wallet` - Get wallet balance (available, pending, total)
- [ ] `GET /api/transactions` - List transactions with pagination
- [ ] `GET /api/transactions/:id` - Get transaction details
- [ ] `POST /api/transactions/export` - Export CSV/PDF
- [ ] Support transaction types: Direct Sale, Team Bonus, Withdrawal
- [ ] Track transaction status: pending, completed, failed
- [ ] Implement double-entry bookkeeping for accuracy

**Wallet Structure:**
```typescript
interface Wallet {
  userId: string;
  availableBalance: number; // Can withdraw
  pendingBalance: number;   // Locked (pending orders)
  totalEarned: number;      // Lifetime earnings
  totalWithdrawn: number;   // Lifetime withdrawals
  currency: 'VND';
}
```

**Dependencies:** Ticket #4.1, #4.2
**Blocked By:** None

---

### Ticket #4.4 - Withdrawal API
**Priority:** P1 (High)
**Estimate:** 5 days
**Assignee:** Backend Developer

**Description:**
Implement withdrawal request and processing system.

**Acceptance Criteria:**
- [ ] `POST /api/withdrawals` - Create withdrawal request
- [ ] `GET /api/withdrawals` - List user's withdrawal requests
- [ ] `GET /api/withdrawals/:id` - Get withdrawal details
- [ ] `PATCH /api/withdrawals/:id/approve` - Approve withdrawal (admin)
- [ ] `PATCH /api/withdrawals/:id/reject` - Reject withdrawal (admin)
- [ ] Validate minimum withdrawal amount (e.g., 100,000 VND)
- [ ] Require KYC completion before withdrawal
- [ ] Support bank transfer details (Vietnamese banks)
- [ ] Send email/SMS notifications on status changes

**Withdrawal Workflow:**
```
requested → pending_review → approved → processing → completed
                          ↓
                      rejected
```

**Bank Integration Requirements:**
- Support major Vietnamese banks (Vietcombank, VPBank, Techcombank, etc.)
- Store bank account number (encrypted)
- Store bank account holder name
- Support multiple bank accounts per user

**Dependencies:** Ticket #4.3, #2.2 (KYC)
**Blocked By:** None

---

## Epic 5: Gamification & Engagement APIs

### Ticket #5.1 - Quest System API
**Priority:** P2 (Medium)
**Estimate:** 4 days
**Assignee:** Backend Developer

**Description:**
Implement quest/achievement system for user engagement.

**Acceptance Criteria:**
- [ ] `GET /api/quests` - List available quests
- [ ] `GET /api/quests/my-progress` - Get user's quest progress
- [ ] `POST /api/quests/:id/complete` - Mark quest as completed
- [ ] `POST /api/quests/:id/claim` - Claim quest rewards
- [ ] Support quest types: onboarding, sales, learning
- [ ] Track quest completion automatically (event-driven)
- [ ] Award XP points for quest completion
- [ ] Implement daily/weekly/monthly quest rotation

**Quest Types:**
```typescript
interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'onboarding' | 'sales' | 'learning';
  xpReward: number;
  bonusReward?: number; // VND
  requirements: QuestRequirement[];
  expiresAt?: Date; // For time-limited quests
}

interface QuestRequirement {
  type: 'make_sale' | 'refer_user' | 'complete_kyc' | 'watch_video';
  target: number; // e.g., 3 sales, 1 referral
  current: number; // User's progress
}
```

**Dependencies:** Ticket #2.1
**Blocked By:** None

---

### Ticket #5.2 - Rank Progression API
**Priority:** P1 (High)
**Estimate:** 3 days
**Assignee:** Backend Developer

**Description:**
Implement automated rank progression system.

**Acceptance Criteria:**
- [ ] `GET /api/ranks/current` - Get user's current rank
- [ ] `GET /api/ranks/progress` - Get progress to next rank
- [ ] Automatically upgrade rank when criteria met
- [ ] Send congratulations email on rank upgrade
- [ ] Track rank history
- [ ] Award rank achievement badges
- [ ] Apply rank-based commission multipliers

**Rank Criteria:**
```typescript
enum UserRank {
  MEMBER = 'Member',         // Default - 0 VND
  PARTNER = 'Partner',       // 10,000,000 VND personal sales
  FOUNDER_CLUB = 'Founder Club' // 100,000,000 VND team volume
}

// Rank benefits
Member: 1.0x commission multiplier
Partner: 1.2x commission multiplier, unlock team bonuses
Founder Club: 1.5x multiplier, monthly bonus pool share
```

**Dependencies:** Ticket #2.1, #4.1
**Blocked By:** None

---

### Ticket #5.3 - Leaderboard API
**Priority:** P2 (Medium)
**Estimate:** 3 days
**Assignee:** Backend Developer

**Description:**
Implement leaderboard system for sales competition.

**Acceptance Criteria:**
- [ ] `GET /api/leaderboard/sales` - Top sellers (daily/weekly/monthly)
- [ ] `GET /api/leaderboard/recruiters` - Top recruiters
- [ ] `GET /api/leaderboard/earners` - Top earners
- [ ] Support time range filters
- [ ] Cache leaderboard data (Redis)
- [ ] Update leaderboard in near real-time
- [ ] Include user's rank position
- [ ] Privacy option to hide from leaderboard

**Response Format:**
```typescript
interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl: string;
  value: number; // Sales amount, referral count, etc.
  rank: UserRank;
  isCurrentUser: boolean;
}
```

**Dependencies:** Ticket #2.1
**Blocked By:** None

---

## Epic 6: AI Coach Integration

### Ticket #6.1 - AI Coach Backend Proxy
**Priority:** P1 (High)
**Estimate:** 3 days
**Assignee:** Full-stack Developer

**Description:**
Move Google Gemini AI integration to backend for security.

**Acceptance Criteria:**
- [ ] `POST /api/ai/coach` - Get personalized coaching advice
- [ ] `POST /api/ai/compliance-check` - Check tax compliance
- [ ] `POST /api/ai/product-recommendation` - Get product recommendations
- [ ] Secure API key in backend environment variables
- [ ] Implement rate limiting (10 requests/user/hour)
- [ ] Cache common AI responses (Redis)
- [ ] Add prompt injection protection
- [ ] Track AI usage for billing

**Request/Response:**
```typescript
// Request
POST /api/ai/coach
{
  "context": {
    "userRank": "Partner",
    "totalSales": 50000000,
    "teamSize": 12
  },
  "query": "How can I reach Founder Club?"
}

// Response
{
  "advice": "To reach Founder Club, you need...",
  "actions": [
    "Focus on team building",
    "Target high-commission products"
  ],
  "estimatedTimeline": "2-3 months with consistent effort"
}
```

**Dependencies:** Ticket #1.1, #2.1
**Blocked By:** None

---

### Ticket #6.2 - AI Training Data Collection
**Priority:** P2 (Medium)
**Estimate:** 2 days
**Assignee:** Backend Developer

**Description:**
Collect user interactions for AI model improvement.

**Acceptance Criteria:**
- [ ] Log all AI queries and responses
- [ ] Track user feedback (thumbs up/down)
- [ ] Store conversation history
- [ ] Implement data anonymization
- [ ] Create admin dashboard for reviewing AI performance
- [ ] Export training data for model fine-tuning

**Dependencies:** Ticket #6.1
**Blocked By:** None

---

## Epic 7: Admin Panel APIs

### Ticket #7.1 - Admin Dashboard API
**Priority:** P1 (High)
**Estimate:** 4 days
**Assignee:** Backend Developer

**Description:**
Implement admin analytics and monitoring endpoints.

**Acceptance Criteria:**
- [ ] `GET /api/admin/stats` - Platform statistics
- [ ] `GET /api/admin/revenue` - Revenue analytics
- [ ] `GET /api/admin/users/active` - Active users count
- [ ] `GET /api/admin/products/performance` - Product performance
- [ ] Role-based access control (RBAC)
- [ ] Support date range filters
- [ ] Real-time metrics (WebSocket or polling)

**Metrics to Track:**
```typescript
interface AdminStats {
  totalUsers: number;
  activeUsers: number; // Last 30 days
  totalRevenue: number;
  totalCommissionPaid: number;
  totalTaxCollected: number;
  averageOrderValue: number;
  topProducts: Product[];
  topSellers: User[];
  pendingWithdrawals: number;
  pendingKYC: number;
}
```

**Dependencies:** Ticket #1.3 (Auth with roles)
**Blocked By:** None

---

### Ticket #7.2 - User Management Admin API
**Priority:** P1 (High)
**Estimate:** 3 days
**Assignee:** Backend Developer

**Description:**
Implement admin user management endpoints.

**Acceptance Criteria:**
- [ ] `GET /api/admin/users` - List all users with filters
- [ ] `PATCH /api/admin/users/:id/suspend` - Suspend user account
- [ ] `PATCH /api/admin/users/:id/activate` - Activate user account
- [ ] `PATCH /api/admin/users/:id/rank` - Manually adjust user rank
- [ ] `GET /api/admin/users/:id/activity` - View user activity log
- [ ] Search users by email, name, referral code
- [ ] Bulk operations (export, suspend, email)

**Dependencies:** Ticket #7.1
**Blocked By:** None

---

### Ticket #7.3 - Financial Admin API
**Priority:** P1 (High)
**Estimate:** 4 days
**Assignee:** Backend Developer

**Description:**
Implement admin financial management endpoints.

**Acceptance Criteria:**
- [ ] `GET /api/admin/withdrawals/pending` - List pending withdrawals
- [ ] `POST /api/admin/withdrawals/:id/process` - Process withdrawal
- [ ] `GET /api/admin/tax/reports` - Monthly tax reports
- [ ] `POST /api/admin/commissions/adjust` - Manual commission adjustment
- [ ] `GET /api/admin/transactions/audit` - Audit transaction log
- [ ] Export financial reports (CSV, Excel)
- [ ] Reconciliation tools

**Dependencies:** Ticket #7.1, #4.4
**Blocked By:** None

---

## Epic 8: Frontend Integration

### Ticket #8.1 - API Client Setup
**Priority:** P0 (Critical)
**Estimate:** 2 days
**Assignee:** Frontend Developer

**Description:**
Replace mock data with real API calls.

**Acceptance Criteria:**
- [ ] Install Axios or Fetch wrapper library
- [ ] Create API client with interceptors
- [ ] Implement JWT token management
- [ ] Add request/response interceptors
- [ ] Handle API errors globally
- [ ] Add loading states to UI
- [ ] Implement retry logic for failed requests

**API Client Structure:**
```typescript
// src/services/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor - add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
    }
    return Promise.reject(error);
  }
);
```

**Dependencies:** Backend APIs (Epic 1-7)
**Blocked By:** Ticket #1.3

---

### Ticket #8.2 - Update Zustand Store with API Integration
**Priority:** P0 (Critical)
**Estimate:** 3 days
**Assignee:** Frontend Developer

**Description:**
Replace mock data in Zustand store with real API calls.

**Acceptance Criteria:**
- [ ] Update `login()` to call `/api/auth/login`
- [ ] Update `logout()` to call `/api/auth/logout`
- [ ] Fetch user profile from `/api/users/me`
- [ ] Fetch products from `/api/products`
- [ ] Fetch transactions from `/api/transactions`
- [ ] Update `simulateOrder()` to call `/api/orders`
- [ ] Add loading states to store
- [ ] Add error handling to store actions

**Updated Store Structure:**
```typescript
interface AppState {
  // ... existing fields
  isLoading: boolean;
  error: string | null;

  // Updated actions
  login: (email: string, password: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  createOrder: (productId: string) => Promise<void>;
}
```

**Dependencies:** Ticket #8.1
**Blocked By:** None

---

### Ticket #8.3 - Authentication Flow Update
**Priority:** P0 (Critical)
**Estimate:** 3 days
**Assignee:** Frontend Developer

**Description:**
Replace mock authentication with real login/signup forms.

**Acceptance Criteria:**
- [ ] Create login form component
- [ ] Create registration form component
- [ ] Implement form validation
- [ ] Add email verification flow
- [ ] Add forgot password flow
- [ ] Store JWT tokens securely (httpOnly cookies preferred)
- [ ] Implement auto-refresh token logic
- [ ] Add social login (Google OAuth - optional)

**Dependencies:** Ticket #8.2
**Blocked By:** Ticket #1.3

---

### Ticket #8.4 - Real-time Features (WebSocket)
**Priority:** P2 (Medium)
**Estimate:** 4 days
**Assignee:** Full-stack Developer

**Description:**
Add real-time updates for transactions and notifications.

**Acceptance Criteria:**
- [ ] Set up WebSocket connection (Socket.io)
- [ ] Subscribe to user-specific events
- [ ] Real-time transaction notifications
- [ ] Real-time commission updates
- [ ] Real-time rank progression alerts
- [ ] Show online status of team members
- [ ] Handle reconnection logic

**Events to Implement:**
```typescript
// Client subscribes to:
socket.on('transaction:new', (transaction) => {
  // Update UI with new transaction
});

socket.on('rank:upgraded', (newRank) => {
  // Show congratulations modal
});

socket.on('withdrawal:approved', (withdrawal) => {
  // Notify user
});
```

**Dependencies:** Ticket #8.2
**Blocked By:** None

---

## Epic 9: Testing & Quality Assurance

### Ticket #9.1 - Backend Unit Tests
**Priority:** P1 (High)
**Estimate:** 5 days
**Assignee:** QA Engineer + Backend Developers

**Description:**
Write comprehensive unit tests for backend services.

**Acceptance Criteria:**
- [ ] Set up Jest or Vitest for testing
- [ ] Test coverage > 80%
- [ ] Unit tests for all services
- [ ] Unit tests for utilities (tax calculation, commission calculation)
- [ ] Mock database queries
- [ ] Test error handling
- [ ] Test edge cases

**Test Files:**
```
tests/
├── unit/
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── user.service.test.ts
│   │   ├── commission.service.test.ts
│   │   └── tax.service.test.ts
│   └── utils/
│       ├── tax.test.ts
│       └── format.test.ts
```

**Dependencies:** Backend APIs (Epic 2-7)
**Blocked By:** None

---

### Ticket #9.2 - Backend Integration Tests
**Priority:** P1 (High)
**Estimate:** 4 days
**Assignee:** QA Engineer

**Description:**
Write integration tests for API endpoints.

**Acceptance Criteria:**
- [ ] Set up Supertest or similar
- [ ] Test all API endpoints
- [ ] Test authentication flows
- [ ] Test order processing workflow
- [ ] Test withdrawal workflow
- [ ] Test with real database (test database)
- [ ] Test rate limiting
- [ ] Test concurrent requests

**Dependencies:** Ticket #9.1
**Blocked By:** None

---

### Ticket #9.3 - Frontend Unit Tests
**Priority:** P1 (High)
**Estimate:** 4 days
**Assignee:** Frontend Developer

**Description:**
Write unit tests for React components.

**Acceptance Criteria:**
- [ ] Set up Vitest + React Testing Library
- [ ] Test coverage > 70%
- [ ] Test all UI components
- [ ] Test form validation
- [ ] Test Zustand store actions
- [ ] Mock API calls
- [ ] Snapshot tests for key components

**Dependencies:** None
**Blocked By:** None

---

### Ticket #9.4 - E2E Tests
**Priority:** P2 (Medium)
**Estimate:** 5 days
**Assignee:** QA Engineer

**Description:**
Write end-to-end tests for critical user journeys.

**Acceptance Criteria:**
- [ ] Set up Playwright or Cypress
- [ ] Test registration flow
- [ ] Test login/logout flow
- [ ] Test product purchase flow
- [ ] Test withdrawal request flow
- [ ] Test referral flow
- [ ] Run tests in CI/CD pipeline
- [ ] Record test videos on failure

**Critical User Journeys:**
1. New user signs up → completes KYC → makes first sale
2. User refers friend → friend makes purchase → user receives commission
3. User requests withdrawal → admin approves → balance updated
4. User completes quests → earns XP → ranks up

**Dependencies:** Ticket #8.3
**Blocked By:** None

---

## Epic 10: DevOps & Deployment

### Ticket #10.1 - CI/CD Pipeline Setup
**Priority:** P1 (High)
**Estimate:** 3 days
**Assignee:** DevOps Engineer

**Description:**
Set up automated CI/CD pipeline.

**Acceptance Criteria:**
- [ ] Set up GitHub Actions or GitLab CI
- [ ] Automated testing on pull requests
- [ ] Automated linting and formatting checks
- [ ] Build frontend on merge to main
- [ ] Deploy backend to staging on merge to develop
- [ ] Deploy to production on release tags
- [ ] Slack/Discord notifications on deployment

**Pipeline Stages:**
```yaml
# Example GitHub Actions workflow
1. Lint & Format Check
2. Unit Tests (Backend + Frontend)
3. Integration Tests
4. Build Application
5. Deploy to Staging
6. Run E2E Tests on Staging
7. Deploy to Production (manual approval)
```

**Dependencies:** Ticket #9.1, #9.2, #9.3
**Blocked By:** None

---

### Ticket #10.2 - Docker Containerization
**Priority:** P1 (High)
**Estimate:** 3 days
**Assignee:** DevOps Engineer

**Description:**
Containerize backend and frontend applications.

**Acceptance Criteria:**
- [ ] Create Dockerfile for backend
- [ ] Create Dockerfile for frontend
- [ ] Create docker-compose.yml for local development
- [ ] Multi-stage builds for optimized images
- [ ] Image size < 200MB (compressed)
- [ ] Include health checks
- [ ] Document Docker setup in README

**Docker Compose Services:**
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...

  frontend:
    build: ./frontend
    ports:
      - "5173:80"

  postgres:
    image: postgres:14
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
```

**Dependencies:** None
**Blocked By:** None

---

### Ticket #10.3 - Cloud Infrastructure Setup
**Priority:** P1 (High)
**Estimate:** 4 days
**Assignee:** DevOps Engineer

**Description:**
Set up production infrastructure on AWS/GCP/Azure.

**Acceptance Criteria:**
- [ ] Set up VPC and networking
- [ ] Deploy PostgreSQL (RDS or Cloud SQL)
- [ ] Deploy Redis (ElastiCache or Memorystore)
- [ ] Set up load balancer
- [ ] Configure auto-scaling
- [ ] Set up CDN for frontend (CloudFront/Cloud CDN)
- [ ] Configure SSL certificates (Let's Encrypt)
- [ ] Set up monitoring (CloudWatch/Stackdriver)

**Recommended Architecture (AWS):**
```
- Application Load Balancer
  ├── ECS/EKS Cluster (Backend containers)
  ├── S3 + CloudFront (Frontend static files)
  ├── RDS PostgreSQL (Multi-AZ)
  ├── ElastiCache Redis (Cluster mode)
  └── S3 (File uploads)
```

**Dependencies:** Ticket #10.2
**Blocked By:** None

---

### Ticket #10.4 - Monitoring & Alerting
**Priority:** P1 (High)
**Estimate:** 3 days
**Assignee:** DevOps Engineer

**Description:**
Set up application monitoring and alerting.

**Acceptance Criteria:**
- [ ] Set up application performance monitoring (New Relic/Datadog)
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring (UptimeRobot/Pingdom)
- [ ] Set up log aggregation (ELK stack or CloudWatch Logs)
- [ ] Create alerts for critical errors
- [ ] Set up dashboards for key metrics
- [ ] Configure PagerDuty/Opsgenie for on-call

**Key Metrics to Monitor:**
- API response times
- Error rates
- Database query performance
- Memory/CPU usage
- Active user count
- Transaction success rate
- Withdrawal processing time

**Dependencies:** Ticket #10.3
**Blocked By:** None

---

### Ticket #10.5 - Backup & Disaster Recovery
**Priority:** P1 (High)
**Estimate:** 2 days
**Assignee:** DevOps Engineer

**Description:**
Implement backup and disaster recovery procedures.

**Acceptance Criteria:**
- [ ] Automated daily database backups
- [ ] Backup retention: 30 days
- [ ] Test backup restoration procedure
- [ ] Document disaster recovery plan
- [ ] Set up multi-region failover (optional for Phase 2)
- [ ] Backup uploaded files to S3 with versioning
- [ ] Implement point-in-time recovery for database

**Dependencies:** Ticket #10.3
**Blocked By:** None

---

## Epic 11: Security & Compliance

### Ticket #11.1 - Security Audit
**Priority:** P0 (Critical)
**Estimate:** 3 days
**Assignee:** Security Engineer

**Description:**
Conduct comprehensive security audit.

**Acceptance Criteria:**
- [ ] OWASP Top 10 vulnerability scan
- [ ] SQL injection testing
- [ ] XSS attack testing
- [ ] CSRF protection verification
- [ ] Authentication bypass testing
- [ ] Authorization testing (RBAC)
- [ ] API rate limiting verification
- [ ] Secrets management audit (no hardcoded keys)

**Tools to Use:**
- OWASP ZAP
- Burp Suite
- Snyk (dependency scanning)
- npm audit

**Dependencies:** All backend APIs
**Blocked By:** None

---

### Ticket #11.2 - Data Privacy Compliance
**Priority:** P1 (High)
**Estimate:** 3 days
**Assignee:** Backend Lead + Legal

**Description:**
Ensure compliance with data privacy regulations.

**Acceptance Criteria:**
- [ ] Implement user data export (GDPR right to data portability)
- [ ] Implement account deletion (right to be forgotten)
- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Add cookie consent banner
- [ ] Encrypt sensitive data at rest (PII, bank details)
- [ ] Implement data retention policies
- [ ] Add audit logging for data access

**Vietnam Data Protection Requirements:**
- Comply with Decree 13/2023/ND-CP on personal data protection
- Store Vietnamese user data in Vietnam (if applicable)
- Obtain explicit consent for data collection

**Dependencies:** Ticket #11.1
**Blocked By:** None

---

### Ticket #11.3 - Penetration Testing
**Priority:** P1 (High)
**Estimate:** 5 days
**Assignee:** External Security Firm

**Description:**
Hire external penetration testing firm for comprehensive security assessment.

**Acceptance Criteria:**
- [ ] Engage reputable penetration testing firm
- [ ] Provide staging environment access
- [ ] Receive detailed security report
- [ ] Fix all critical and high-severity issues
- [ ] Retest after fixes
- [ ] Obtain security certification/report for compliance

**Dependencies:** Ticket #11.1, #11.2
**Blocked By:** None

---

## Epic 12: Performance Optimization

### Ticket #12.1 - Backend Performance Optimization
**Priority:** P2 (Medium)
**Estimate:** 4 days
**Assignee:** Backend Lead

**Description:**
Optimize backend API performance.

**Acceptance Criteria:**
- [ ] Database query optimization (add indexes)
- [ ] Implement database connection pooling
- [ ] Add Redis caching for frequently accessed data
- [ ] Optimize N+1 queries
- [ ] API response time < 200ms (P95)
- [ ] Implement pagination for all list endpoints
- [ ] Add database read replicas for scaling

**Caching Strategy:**
```typescript
// Cache product catalog (invalidate on product update)
Cache TTL: 1 hour

// Cache user profile (invalidate on profile update)
Cache TTL: 5 minutes

// Cache leaderboard (invalidate on new transaction)
Cache TTL: 30 seconds
```

**Dependencies:** Backend APIs
**Blocked By:** None

---

### Ticket #12.2 - Frontend Performance Optimization
**Priority:** P2 (Medium)
**Estimate:** 3 days
**Assignee:** Frontend Developer

**Description:**
Optimize frontend performance and bundle size.

**Acceptance Criteria:**
- [ ] Implement code splitting (React.lazy)
- [ ] Optimize images (WebP format, lazy loading)
- [ ] Reduce bundle size < 500KB (gzipped)
- [ ] Implement service worker for offline support
- [ ] Add skeleton loaders for better perceived performance
- [ ] Optimize font loading
- [ ] Achieve Lighthouse score > 90

**Code Splitting Strategy:**
```typescript
// Lazy load route components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
```

**Dependencies:** None
**Blocked By:** None

---

### Ticket #12.3 - Database Performance Tuning
**Priority:** P2 (Medium)
**Estimate:** 2 days
**Assignee:** Backend Lead

**Description:**
Optimize database schema and queries.

**Acceptance Criteria:**
- [ ] Add database indexes on frequently queried columns
- [ ] Analyze slow query log
- [ ] Optimize JOIN queries
- [ ] Implement database partitioning for large tables (transactions)
- [ ] Configure database autovacuum settings
- [ ] Set up connection pooling (pgBouncer)

**Key Indexes to Add:**
```sql
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_user_hierarchy_upline_id ON user_hierarchy(upline_id);
```

**Dependencies:** Ticket #1.2
**Blocked By:** None

---

## Epic 13: Documentation & Training

### Ticket #13.1 - API Documentation
**Priority:** P1 (High)
**Estimate:** 3 days
**Assignee:** Technical Writer + Backend Lead

**Description:**
Complete comprehensive API documentation.

**Acceptance Criteria:**
- [ ] Document all API endpoints in Swagger/OpenAPI
- [ ] Add request/response examples
- [ ] Document error codes and messages
- [ ] Add authentication guide
- [ ] Add rate limiting documentation
- [ ] Create Postman collection
- [ ] Add changelog for API versions

**See separate document:** `API_SPECIFICATION.md`

**Dependencies:** All backend APIs
**Blocked By:** None

---

### Ticket #13.2 - Developer Documentation
**Priority:** P1 (High)
**Estimate:** 2 days
**Assignee:** Technical Writer

**Description:**
Create comprehensive developer documentation.

**Acceptance Criteria:**
- [ ] Update README.md with setup instructions
- [ ] Document environment variables
- [ ] Add contribution guidelines
- [ ] Document coding standards
- [ ] Add architecture diagrams
- [ ] Document deployment procedures
- [ ] Add troubleshooting guide

**See separate document:** `DEPLOYMENT_GUIDE.md`

**Dependencies:** None
**Blocked By:** None

---

### Ticket #13.3 - User Documentation
**Priority:** P2 (Medium)
**Estimate:** 3 days
**Assignee:** Technical Writer

**Description:**
Create end-user help documentation (Vietnamese and English).

**Acceptance Criteria:**
- [ ] Create user guide (Vietnamese)
- [ ] Create FAQ section
- [ ] Add video tutorials (optional)
- [ ] Document all features
- [ ] Add troubleshooting section
- [ ] Create admin panel user guide
- [ ] Translate to English

**Dependencies:** None
**Blocked By:** None

---

### Ticket #13.4 - Internal Training
**Priority:** P2 (Medium)
**Estimate:** 2 days
**Assignee:** Product Manager

**Description:**
Conduct internal training for support team.

**Acceptance Criteria:**
- [ ] Create training materials
- [ ] Train customer support team
- [ ] Train admin panel users
- [ ] Create internal wiki/knowledge base
- [ ] Document common support issues
- [ ] Create escalation procedures

**Dependencies:** Ticket #13.3
**Blocked By:** None

---

## Implementation Timeline

### Phase 2a: Foundation (Weeks 1-4)
- Epic 1: Backend Infrastructure Setup
- Epic 2: User Management APIs
- Epic 8: Frontend Integration (API Client)

### Phase 2b: Core Features (Weeks 5-8)
- Epic 3: Product & Marketplace APIs
- Epic 4: Financial & Tax APIs
- Epic 5: Gamification & Engagement APIs

### Phase 2c: Admin & Testing (Weeks 9-10)
- Epic 6: AI Coach Integration
- Epic 7: Admin Panel APIs
- Epic 9: Testing & Quality Assurance

### Phase 2d: Production Readiness (Weeks 11-12)
- Epic 10: DevOps & Deployment
- Epic 11: Security & Compliance
- Epic 12: Performance Optimization
- Epic 13: Documentation & Training

---

## Success Metrics

### Technical Metrics
- [ ] API response time P95 < 200ms
- [ ] Uptime > 99.5%
- [ ] Test coverage > 80%
- [ ] Lighthouse score > 90
- [ ] Security audit: 0 critical issues

### Business Metrics
- [ ] Support 1000+ concurrent users
- [ ] Process 10,000+ transactions/day
- [ ] < 1% transaction error rate
- [ ] < 2% withdrawal processing time SLA breach
- [ ] > 95% user satisfaction score

---

## Risk Assessment

### High-Risk Items
1. **Commission Calculation Engine** (Ticket #4.1)
   - Risk: Complex MLM logic with edge cases
   - Mitigation: Extensive testing, manual verification

2. **Tax Compliance** (Ticket #4.2)
   - Risk: Regulatory changes, calculation errors
   - Mitigation: Legal review, automated testing

3. **Payment Integration** (Ticket #4.4)
   - Risk: Bank API changes, fraud
   - Mitigation: Use established payment gateway

4. **Security** (Epic 11)
   - Risk: Data breaches, financial fraud
   - Mitigation: Security audit, penetration testing

### Medium-Risk Items
1. **Real-time Features** (Ticket #8.4)
   - Risk: WebSocket scaling, connection management
   - Mitigation: Use managed service (Pusher, Ably)

2. **AI Integration** (Ticket #6.1)
   - Risk: API quota limits, costs
   - Mitigation: Caching, rate limiting

---

## Dependencies & Prerequisites

### External Services Required
- [ ] PostgreSQL database hosting
- [ ] Redis cache hosting
- [ ] Cloud storage (AWS S3 / Google Cloud Storage)
- [ ] Email service (SendGrid / AWS SES)
- [ ] SMS service (Twilio / Vonage) - for OTP
- [ ] Payment gateway (Vietnamese banks integration)
- [ ] SSL certificate provider
- [ ] Monitoring service (New Relic / Datadog)
- [ ] Error tracking (Sentry)

### Legal & Compliance
- [ ] Privacy policy drafted
- [ ] Terms of service drafted
- [ ] Tax registration (if required)
- [ ] Business license (Vietnam)
- [ ] Data protection compliance review

---

## Next Steps

1. **Review & Approve Tickets**
   - Product team review
   - Engineering team sizing
   - Adjust priorities based on business needs

2. **Sprint Planning**
   - Create 2-week sprints
   - Assign tickets to sprints
   - Assign team members

3. **Set Up Project Management**
   - Create Jira/Linear project
   - Import tickets
   - Set up sprint boards

4. **Kickoff Phase 2**
   - Team kickoff meeting
   - Set up development environments
   - Begin Epic 1

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
**Next Review:** End of Sprint 1
**Owner:** Product & Engineering Leadership
