# WellNexus API Specification

**Version:** 2.0.0
**Base URL:** `https://api.wellnexus.vn/v1`
**Authentication:** JWT Bearer Token
**Content-Type:** `application/json`
**Last Updated:** 2025-11-21

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Products](#products)
4. [Orders](#orders)
5. [Transactions](#transactions)
6. [Withdrawals](#withdrawals)
7. [Quests](#quests)
8. [Referrals](#referrals)
9. [AI Coach](#ai-coach)
10. [Admin](#admin)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

---

## General Information

### Request Headers

All authenticated requests must include:

```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
X-Client-Version: 1.0.0 (optional)
```

### Response Format

All API responses follow this standard structure:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "timestamp": "2025-11-21T10:00:00Z",
    "requestId": "req-abc123"
  }
}
```

**Error Response:**
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
  "meta": {
    "timestamp": "2025-11-21T10:00:00Z",
    "requestId": "req-abc123"
  }
}
```

### Pagination

List endpoints support pagination using query parameters:

```http
GET /api/resource?page=1&limit=20&sortBy=createdAt&order=desc
```

**Paginated Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

---

## 1. Authentication

### 1.1 Register

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "Lan Nguyen",
  "email": "lan.nguyen@example.com",
  "password": "SecurePass123!",
  "phone": "+84901234567",
  "referralCode": "ABC123" // optional
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format
- `password`: Required, min 8 characters, must include uppercase, lowercase, number, special char
- `phone`: Required, Vietnamese phone format (+84...)
- `referralCode`: Optional, valid referral code

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_1234567890",
      "name": "Lan Nguyen",
      "email": "lan.nguyen@example.com",
      "rank": "Member",
      "kycStatus": false,
      "referralLink": "https://wellnexus.vn/join/LAN123XYZ"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900 // 15 minutes
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `409 Conflict` - Email already exists
- `422 Unprocessable Entity` - Invalid referral code

---

### 1.2 Login

Authenticate user and receive tokens.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "lan.nguyen@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_1234567890",
      "name": "Lan Nguyen",
      "email": "lan.nguyen@example.com",
      "rank": "Partner",
      "totalSales": 45000000,
      "teamVolume": 89000000,
      "kycStatus": true,
      "avatarUrl": "https://cdn.wellnexus.vn/avatars/usr_1234567890.jpg"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded (max 5 attempts per 15 min)

---

### 1.3 Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### 1.4 Logout

Invalidate current session and refresh token.

**Endpoint:** `POST /api/auth/logout`
**Authentication:** Required

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### 1.5 Request Password Reset

Send password reset email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "lan.nguyen@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent. Please check your inbox."
  }
}
```

---

### 1.6 Reset Password

Reset password using reset token from email.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "resetToken": "reset_abc123xyz",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully. You can now login with your new password."
  }
}
```

---

## 2. Users

### 2.1 Get Current User Profile

Get authenticated user's profile.

**Endpoint:** `GET /api/users/me`
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "usr_1234567890",
    "name": "Lan Nguyen",
    "email": "lan.nguyen@example.com",
    "phone": "+84901234567",
    "rank": "Partner",
    "totalSales": 45000000,
    "teamVolume": 89000000,
    "avatarUrl": "https://cdn.wellnexus.vn/avatars/usr_1234567890.jpg",
    "joinedAt": "2024-09-15T08:00:00Z",
    "kycStatus": true,
    "nextPayoutDate": "2025-12-01",
    "estimatedBonus": 2500000,
    "referralLink": "https://wellnexus.vn/join/LAN123XYZ",
    "wallet": {
      "availableBalance": 12500000,
      "pendingBalance": 3000000,
      "totalEarned": 45000000,
      "totalWithdrawn": 29500000,
      "currency": "VND"
    }
  }
}
```

---

### 2.2 Update User Profile

Update user's profile information.

**Endpoint:** `PATCH /api/users/me`
**Authentication:** Required

**Request Body:**
```json
{
  "name": "Lan Nguyen Updated",
  "phone": "+84901234999",
  "avatarUrl": "https://cdn.wellnexus.vn/avatars/new-avatar.jpg"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "usr_1234567890",
    "name": "Lan Nguyen Updated",
    "email": "lan.nguyen@example.com",
    "phone": "+84901234999",
    // ... other fields
  }
}
```

---

### 2.3 Upload Profile Picture

Upload user's profile picture.

**Endpoint:** `POST /api/users/me/avatar`
**Authentication:** Required
**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
```
avatar: <file> (image/jpeg, image/png, max 5MB)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.wellnexus.vn/avatars/usr_1234567890.jpg"
  }
}
```

---

### 2.4 Submit KYC Documents

Submit KYC verification documents.

**Endpoint:** `POST /api/kyc/submit`
**Authentication:** Required
**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
```
fullName: Nguyen Thi Lan
nationalId: 001234567890
taxCode: 0123456789
idCardFront: <file>
idCardBack: <file>
selfiePhoto: <file>
proofOfAddress: <file>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "kycStatus": "pending_review",
    "submittedAt": "2025-11-21T10:00:00Z",
    "estimatedReviewTime": "1-3 business days"
  }
}
```

---

### 2.5 Get KYC Status

Check KYC verification status.

**Endpoint:** `GET /api/kyc/status`
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "approved", // pending_review, approved, rejected
    "submittedAt": "2025-11-20T10:00:00Z",
    "reviewedAt": "2025-11-21T15:00:00Z",
    "notes": "" // Rejection reason if status is 'rejected'
  }
}
```

---

## 3. Products

### 3.1 List Products

Get product catalog with filtering and pagination.

**Endpoint:** `GET /api/products`
**Authentication:** Optional (public endpoint)

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `search` (string) - Search by name or description
- `minPrice` (number) - Minimum price filter (VND)
- `maxPrice` (number) - Maximum price filter (VND)
- `inStock` (boolean) - Only show in-stock products
- `sortBy` (string: `price`, `salesCount`, `createdAt`) - Sort field
- `order` (string: `asc`, `desc`) - Sort order

**Example Request:**
```http
GET /api/products?search=ANIMA&inStock=true&sortBy=salesCount&order=desc&page=1&limit=20
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "prd_001",
        "name": "ANIMA 119 - Premium Wellness Tonic",
        "description": "Cao cấp ANIMA 119 giúp tăng cường sức khỏe toàn diện",
        "price": 15900000,
        "commissionRate": 0.25,
        "imageUrl": "https://cdn.wellnexus.vn/products/anima-119.jpg",
        "stock": 47,
        "salesCount": 892,
        "category": "Wellness",
        "isActive": true,
        "createdAt": "2024-08-01T00:00:00Z"
      }
      // ... more products
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1,
      "hasNext": false,
      "hasPrevious": false
    }
  }
}
```

---

### 3.2 Get Product Details

Get detailed information about a specific product.

**Endpoint:** `GET /api/products/:productId`
**Authentication:** Optional

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "prd_001",
    "name": "ANIMA 119 - Premium Wellness Tonic",
    "description": "Cao cấp ANIMA 119 giúp tăng cường sức khỏe toàn diện. Công thức độc quyền từ thiên nhiên.",
    "longDescription": "Detailed product description...",
    "price": 15900000,
    "commissionRate": 0.25,
    "imageUrl": "https://cdn.wellnexus.vn/products/anima-119.jpg",
    "images": [
      "https://cdn.wellnexus.vn/products/anima-119-1.jpg",
      "https://cdn.wellnexus.vn/products/anima-119-2.jpg"
    ],
    "stock": 47,
    "salesCount": 892,
    "category": "Wellness",
    "isActive": true,
    "features": [
      "100% natural ingredients",
      "Lab-tested purity",
      "Vegan-friendly"
    ],
    "specifications": {
      "weight": "500ml",
      "origin": "Vietnam"
    },
    "reviews": {
      "averageRating": 4.8,
      "totalReviews": 234
    },
    "createdAt": "2024-08-01T00:00:00Z"
  }
}
```

---

## 4. Orders

### 4.1 Create Order

Create a new product order.

**Endpoint:** `POST /api/orders`
**Authentication:** Required

**Request Body:**
```json
{
  "productId": "prd_001",
  "quantity": 1,
  "shippingAddress": {
    "fullName": "Lan Nguyen",
    "phone": "+84901234567",
    "address": "123 Nguyen Trai Street",
    "ward": "Phuong 1",
    "district": "Quan 5",
    "city": "Ho Chi Minh City",
    "postalCode": "70000"
  },
  "note": "Please deliver in the morning"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_9876543210",
      "userId": "usr_1234567890",
      "productId": "prd_001",
      "productName": "ANIMA 119 - Premium Wellness Tonic",
      "quantity": 1,
      "productPrice": 15900000,
      "totalAmount": 15900000,
      "commission": 3975000,
      "taxDeducted": 197500,
      "netCommission": 3777500,
      "status": "pending",
      "shippingAddress": { /* ... */ },
      "createdAt": "2025-11-21T10:00:00Z",
      "estimatedDelivery": "2025-11-25"
    },
    "transaction": {
      "id": "txn_abc123",
      "amount": 3975000,
      "type": "Direct Sale",
      "status": "pending",
      "taxDeducted": 197500,
      "netAmount": 3777500
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid product ID or quantity
- `409 Conflict` - Insufficient stock
- `402 Payment Required` - Payment method required (for paid orders)

---

### 4.2 List User Orders

Get user's order history.

**Endpoint:** `GET /api/orders`
**Authentication:** Required

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `status` (string: `pending`, `processing`, `completed`, `cancelled`) - Filter by status
- `sortBy` (string: `createdAt`, `totalAmount`) - Sort field
- `order` (string: `asc`, `desc`) - Sort order

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "ord_9876543210",
        "productName": "ANIMA 119 - Premium Wellness Tonic",
        "quantity": 1,
        "totalAmount": 15900000,
        "commission": 3975000,
        "netCommission": 3777500,
        "status": "completed",
        "createdAt": "2025-11-21T10:00:00Z",
        "completedAt": "2025-11-25T14:30:00Z"
      }
      // ... more orders
    ],
    "pagination": { /* ... */ }
  }
}
```

---

### 4.3 Get Order Details

Get detailed information about a specific order.

**Endpoint:** `GET /api/orders/:orderId`
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "ord_9876543210",
    "userId": "usr_1234567890",
    "product": {
      "id": "prd_001",
      "name": "ANIMA 119 - Premium Wellness Tonic",
      "imageUrl": "https://cdn.wellnexus.vn/products/anima-119.jpg"
    },
    "quantity": 1,
    "productPrice": 15900000,
    "totalAmount": 15900000,
    "commission": 3975000,
    "taxDeducted": 197500,
    "netCommission": 3777500,
    "status": "completed",
    "shippingAddress": {
      "fullName": "Lan Nguyen",
      "phone": "+84901234567",
      "address": "123 Nguyen Trai Street, Phuong 1, Quan 5",
      "city": "Ho Chi Minh City"
    },
    "tracking": {
      "carrier": "Giao Hang Nhanh",
      "trackingNumber": "GHN123456789",
      "trackingUrl": "https://ghn.vn/track/GHN123456789"
    },
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2025-11-21T10:00:00Z"
      },
      {
        "status": "processing",
        "timestamp": "2025-11-21T15:00:00Z"
      },
      {
        "status": "completed",
        "timestamp": "2025-11-25T14:30:00Z"
      }
    ],
    "createdAt": "2025-11-21T10:00:00Z",
    "updatedAt": "2025-11-25T14:30:00Z"
  }
}
```

---

## 5. Transactions

### 5.1 List Transactions

Get user's transaction history.

**Endpoint:** `GET /api/transactions`
**Authentication:** Required

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `type` (string: `Direct Sale`, `Team Volume Bonus`, `Withdrawal`) - Filter by type
- `status` (string: `pending`, `completed`) - Filter by status
- `startDate` (ISO date) - Filter from date
- `endDate` (ISO date) - Filter to date
- `sortBy` (string: `date`, `amount`) - Sort field
- `order` (string: `asc`, `desc`) - Sort order

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "txn_abc123",
        "userId": "usr_1234567890",
        "date": "2025-11-21",
        "amount": 3975000,
        "type": "Direct Sale",
        "status": "completed",
        "taxDeducted": 197500,
        "netAmount": 3777500,
        "relatedOrderId": "ord_9876543210",
        "description": "Commission from ANIMA 119 sale"
      },
      {
        "id": "txn_def456",
        "userId": "usr_1234567890",
        "date": "2025-11-20",
        "amount": 1200000,
        "type": "Team Volume Bonus",
        "status": "completed",
        "taxDeducted": 0,
        "netAmount": 1200000,
        "relatedUserId": "usr_downline_123",
        "description": "Level 2 team bonus"
      }
      // ... more transactions
    ],
    "pagination": { /* ... */ },
    "summary": {
      "totalEarned": 45000000,
      "totalTaxDeducted": 2250000,
      "netEarnings": 42750000,
      "periodStart": "2025-11-01",
      "periodEnd": "2025-11-30"
    }
  }
}
```

---

### 5.2 Get Transaction Details

Get detailed information about a specific transaction.

**Endpoint:** `GET /api/transactions/:transactionId`
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "txn_abc123",
    "userId": "usr_1234567890",
    "date": "2025-11-21",
    "amount": 3975000,
    "type": "Direct Sale",
    "status": "completed",
    "taxDeducted": 197500,
    "netAmount": 3777500,
    "relatedOrder": {
      "id": "ord_9876543210",
      "productName": "ANIMA 119 - Premium Wellness Tonic",
      "productPrice": 15900000,
      "commissionRate": 0.25
    },
    "taxBreakdown": {
      "grossAmount": 3975000,
      "threshold": 2000000,
      "taxableAmount": 1975000,
      "taxRate": 0.10,
      "taxDeducted": 197500,
      "netAmount": 3777500
    },
    "createdAt": "2025-11-21T10:00:00Z",
    "completedAt": "2025-11-21T10:05:00Z"
  }
}
```

---

### 5.3 Export Transactions

Export transaction history as CSV or PDF.

**Endpoint:** `POST /api/transactions/export`
**Authentication:** Required

**Request Body:**
```json
{
  "format": "csv", // or "pdf"
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "type": "all" // or "Direct Sale", "Team Volume Bonus", "Withdrawal"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.wellnexus.vn/exports/txn_export_usr_1234567890_202511.csv",
    "expiresAt": "2025-11-21T12:00:00Z",
    "recordCount": 45
  }
}
```

---

### 5.4 Get Tax Summary

Get tax summary for a specific period.

**Endpoint:** `GET /api/tax/summary`
**Authentication:** Required

**Query Parameters:**
- `year` (number) - Year (e.g., 2025)
- `month` (number, optional) - Month (1-12)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "year": 2025,
      "month": 11,
      "startDate": "2025-11-01",
      "endDate": "2025-11-30"
    },
    "summary": {
      "totalIncome": 15000000,
      "taxThreshold": 2000000,
      "taxableIncome": 13000000,
      "taxRate": 0.10,
      "totalTaxDeducted": 1300000,
      "netIncome": 13700000
    },
    "transactions": [
      {
        "id": "txn_abc123",
        "date": "2025-11-21",
        "grossAmount": 3975000,
        "taxDeducted": 197500,
        "netAmount": 3777500
      }
      // ... more transactions
    ]
  }
}
```

---

## 6. Withdrawals

### 6.1 Create Withdrawal Request

Request withdrawal of available balance.

**Endpoint:** `POST /api/withdrawals`
**Authentication:** Required

**Request Body:**
```json
{
  "amount": 10000000,
  "bankAccountId": "bank_xyz789", // Pre-registered bank account
  "note": "Monthly withdrawal"
}
```

**Validation:**
- Minimum withdrawal: 100,000 VND
- Must have completed KYC
- Amount <= available balance

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "wdr_123abc",
    "userId": "usr_1234567890",
    "amount": 10000000,
    "status": "requested",
    "bankAccount": {
      "bankName": "Vietcombank",
      "accountNumber": "****5678",
      "accountHolder": "NGUYEN THI LAN"
    },
    "estimatedProcessingTime": "1-3 business days",
    "requestedAt": "2025-11-21T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Amount below minimum or exceeds available balance
- `403 Forbidden` - KYC not completed
- `422 Unprocessable Entity` - Invalid bank account

---

### 6.2 List Withdrawal Requests

Get user's withdrawal history.

**Endpoint:** `GET /api/withdrawals`
**Authentication:** Required

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `status` (string: `requested`, `pending_review`, `approved`, `processing`, `completed`, `rejected`) - Filter by status

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "wdr_123abc",
        "amount": 10000000,
        "status": "completed",
        "bankAccount": {
          "bankName": "Vietcombank",
          "accountNumber": "****5678"
        },
        "requestedAt": "2025-11-21T10:00:00Z",
        "completedAt": "2025-11-23T14:30:00Z",
        "transactionId": "txn_withdrawal_123"
      }
      // ... more withdrawals
    ],
    "pagination": { /* ... */ }
  }
}
```

---

### 6.3 Get Withdrawal Details

Get detailed information about a specific withdrawal.

**Endpoint:** `GET /api/withdrawals/:withdrawalId`
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "wdr_123abc",
    "userId": "usr_1234567890",
    "amount": 10000000,
    "status": "completed",
    "bankAccount": {
      "bankName": "Vietcombank",
      "branchName": "Ho Chi Minh City Branch",
      "accountNumber": "1234567890",
      "accountHolder": "NGUYEN THI LAN"
    },
    "timeline": [
      {
        "status": "requested",
        "timestamp": "2025-11-21T10:00:00Z"
      },
      {
        "status": "pending_review",
        "timestamp": "2025-11-21T10:05:00Z"
      },
      {
        "status": "approved",
        "timestamp": "2025-11-22T09:00:00Z",
        "approvedBy": "admin_001"
      },
      {
        "status": "processing",
        "timestamp": "2025-11-22T10:00:00Z"
      },
      {
        "status": "completed",
        "timestamp": "2025-11-23T14:30:00Z",
        "transferReference": "VCB20251123ABC123"
      }
    ],
    "note": "Monthly withdrawal",
    "requestedAt": "2025-11-21T10:00:00Z",
    "completedAt": "2025-11-23T14:30:00Z",
    "transactionId": "txn_withdrawal_123"
  }
}
```

---

### 6.4 Add Bank Account

Register a new bank account for withdrawals.

**Endpoint:** `POST /api/withdrawals/bank-accounts`
**Authentication:** Required

**Request Body:**
```json
{
  "bankName": "Vietcombank",
  "branchName": "Ho Chi Minh City Branch",
  "accountNumber": "1234567890",
  "accountHolder": "NGUYEN THI LAN" // Must match KYC name
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "bank_xyz789",
    "bankName": "Vietcombank",
    "branchName": "Ho Chi Minh City Branch",
    "accountNumber": "****7890",
    "accountHolder": "NGUYEN THI LAN",
    "isVerified": false,
    "isPrimary": true
  }
}
```

---

## 7. Quests

### 7.1 List Available Quests

Get all available quests for the user.

**Endpoint:** `GET /api/quests`
**Authentication:** Required

**Query Parameters:**
- `type` (string: `onboarding`, `sales`, `learning`) - Filter by quest type
- `status` (string: `available`, `in_progress`, `completed`) - Filter by completion status

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "qst_001",
        "title": "First Sale Milestone",
        "description": "Make your first product sale to earn bonus XP",
        "type": "sales",
        "xpReward": 500,
        "bonusReward": 50000,
        "requirements": [
          {
            "type": "make_sale",
            "target": 1,
            "current": 0
          }
        ],
        "progress": 0,
        "isCompleted": false,
        "canClaim": false,
        "expiresAt": null
      },
      {
        "id": "qst_002",
        "title": "Complete Your Profile",
        "description": "Fill out all profile information and complete KYC",
        "type": "onboarding",
        "xpReward": 200,
        "requirements": [
          {
            "type": "complete_kyc",
            "target": 1,
            "current": 1
          }
        ],
        "progress": 100,
        "isCompleted": true,
        "canClaim": false,
        "claimedAt": "2025-11-20T10:00:00Z"
      }
      // ... more quests
    ]
  }
}
```

---

### 7.2 Get Quest Progress

Get detailed progress for a specific quest.

**Endpoint:** `GET /api/quests/:questId/progress`
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "questId": "qst_001",
    "title": "First Sale Milestone",
    "requirements": [
      {
        "type": "make_sale",
        "description": "Make a product sale",
        "target": 1,
        "current": 0,
        "isCompleted": false
      }
    ],
    "overallProgress": 0,
    "isCompleted": false,
    "canClaim": false
  }
}
```

---

### 7.3 Claim Quest Reward

Claim rewards for a completed quest.

**Endpoint:** `POST /api/quests/:questId/claim`
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "questId": "qst_001",
    "xpAwarded": 500,
    "bonusAwarded": 50000,
    "newTotalXp": 2500,
    "claimedAt": "2025-11-21T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Quest not completed or already claimed
- `404 Not Found` - Quest not found

---

## 8. Referrals

### 8.1 Get Referral Link

Get user's unique referral link.

**Endpoint:** `GET /api/referrals/my-link`
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "referralCode": "LAN123XYZ",
    "referralLink": "https://wellnexus.vn/join/LAN123XYZ",
    "qrCodeUrl": "https://cdn.wellnexus.vn/qr/LAN123XYZ.png",
    "totalReferrals": 12,
    "activeReferrals": 8
  }
}
```

---

### 8.2 Get Referral Tree

Get user's downline tree structure.

**Endpoint:** `GET /api/referrals/tree`
**Authentication:** Required

**Query Parameters:**
- `maxDepth` (number, default: 5) - Maximum tree depth to return

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_1234567890",
      "name": "Lan Nguyen",
      "rank": "Partner",
      "totalSales": 45000000,
      "teamVolume": 89000000
    },
    "tree": [
      {
        "id": "usr_downline_001",
        "name": "Minh Tran",
        "rank": "Member",
        "level": 1,
        "totalSales": 12000000,
        "teamVolume": 15000000,
        "joinedAt": "2025-10-15T00:00:00Z",
        "children": [
          {
            "id": "usr_downline_002",
            "name": "Hoa Le",
            "rank": "Member",
            "level": 2,
            "totalSales": 3000000,
            "teamVolume": 3000000,
            "joinedAt": "2025-11-01T00:00:00Z",
            "children": []
          }
        ]
      }
      // ... more downline members
    ],
    "stats": {
      "totalMembers": 12,
      "level1Members": 5,
      "level2Members": 4,
      "level3Members": 2,
      "level4Members": 1,
      "level5Members": 0
    }
  }
}
```

---

### 8.3 Get Referral Statistics

Get detailed referral statistics.

**Endpoint:** `GET /api/referrals/stats`
**Authentication:** Required

**Query Parameters:**
- `startDate` (ISO date) - Start date for statistics
- `endDate` (ISO date) - End date for statistics

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalReferrals": 12,
    "activeReferrals": 8,
    "newReferralsThisMonth": 3,
    "teamVolume": 89000000,
    "teamVolumeThisMonth": 15000000,
    "totalCommissionFromTeam": 5600000,
    "topPerformers": [
      {
        "id": "usr_downline_001",
        "name": "Minh Tran",
        "level": 1,
        "totalSales": 12000000,
        "contributedCommission": 2400000
      }
      // ... more top performers
    ]
  }
}
```

---

## 9. AI Coach

### 9.1 Get Coaching Advice

Get personalized AI coaching advice.

**Endpoint:** `POST /api/ai/coach`
**Authentication:** Required
**Rate Limit:** 10 requests per hour per user

**Request Body:**
```json
{
  "query": "How can I reach Founder Club rank faster?",
  "context": {
    "includeUserStats": true,
    "includeRecommendations": true
  }
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "advice": "To reach Founder Club faster, focus on these strategic areas:\n\n1. **Build Your Team**: Your current team volume is 89M VND. You need 100M VND to reach Founder Club. Focus on recruiting 2-3 motivated partners.\n\n2. **High-Commission Products**: Prioritize selling ANIMA 119 (25% commission) over lower-commission items.\n\n3. **Team Training**: Your Level 1 downline is performing well, but Level 2-3 need support. Host weekly training sessions.",
    "actionItems": [
      "Recruit 2-3 new partners this month",
      "Increase ANIMA 119 sales by 30%",
      "Schedule weekly team training calls",
      "Help your Level 2 downline complete their first sales"
    ],
    "estimatedTimeline": "With consistent effort, you can reach Founder Club in 6-8 weeks.",
    "keyMetrics": {
      "currentTeamVolume": 89000000,
      "requiredTeamVolume": 100000000,
      "gap": 11000000,
      "gapPercentage": 11
    }
  }
}
```

---

### 9.2 Get Product Recommendations

Get AI-powered product recommendations for the user.

**Endpoint:** `POST /api/ai/product-recommendations`
**Authentication:** Required
**Rate Limit:** 20 requests per hour per user

**Request Body:**
```json
{
  "maxRecommendations": 3,
  "includeReasoning": true
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "product": {
          "id": "prd_001",
          "name": "ANIMA 119 - Premium Wellness Tonic",
          "price": 15900000,
          "commissionRate": 0.25,
          "imageUrl": "https://cdn.wellnexus.vn/products/anima-119.jpg"
        },
        "reasoning": "Based on your Partner rank and sales history, ANIMA 119 offers the highest commission rate (25%) and aligns with your target customer demographic. Previous customers have a 78% repeat purchase rate.",
        "potentialCommission": 3975000,
        "confidence": 0.92
      }
      // ... more recommendations
    ]
  }
}
```

---

### 9.3 Check Tax Compliance

Get AI analysis of tax compliance status.

**Endpoint:** `POST /api/ai/compliance-check`
**Authentication:** Required
**Rate Limit:** 5 requests per hour per user

**Request Body:**
```json
{
  "transactionId": "txn_abc123" // optional
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isCompliant": true,
    "summary": "Your tax withholding is compliant with Vietnam Personal Income Tax Law (Circular 111/2013/TT-BTC). All transactions above the 2,000,000 VND threshold have 10% PIT automatically deducted.",
    "details": {
      "totalIncomeThisMonth": 15000000,
      "totalTaxDeductedThisMonth": 1300000,
      "effectiveTaxRate": 0.0867,
      "nextTaxDeadline": "2025-12-15",
      "estimatedAnnualTax": 15600000
    },
    "recommendations": [
      "Keep records of all transactions for year-end tax filing",
      "Consider consulting a tax professional for deductions",
      "Ensure KYC information is up to date for smooth tax reporting"
    ]
  }
}
```

---

## 10. Admin

### 10.1 Get Platform Statistics (Admin Only)

Get platform-wide statistics.

**Endpoint:** `GET /api/admin/stats`
**Authentication:** Required (Admin role)

**Query Parameters:**
- `startDate` (ISO date) - Start date for statistics
- `endDate` (ISO date) - End date for statistics

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 5432,
      "active": 3891,
      "newThisMonth": 234
    },
    "revenue": {
      "totalSales": 2145000000,
      "totalCommissionPaid": 536250000,
      "totalTaxCollected": 26812500,
      "averageOrderValue": 12500000
    },
    "products": {
      "totalProducts": 15,
      "activeProducts": 12,
      "outOfStock": 2
    },
    "withdrawals": {
      "pending": 45,
      "totalAmount": 125000000,
      "processedThisMonth": 234,
      "totalAmountProcessed": 1500000000
    },
    "kyc": {
      "pendingReview": 23,
      "approved": 4521,
      "rejected": 45
    }
  }
}
```

---

### 10.2 List All Users (Admin Only)

Get list of all users with filtering.

**Endpoint:** `GET /api/admin/users`
**Authentication:** Required (Admin role)

**Query Parameters:**
- `page`, `limit` - Pagination
- `search` - Search by name, email, or ID
- `rank` - Filter by rank
- `kycStatus` - Filter by KYC status
- `status` - Filter by account status (active, suspended)
- `sortBy` - Sort field
- `order` - Sort order

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "usr_1234567890",
        "name": "Lan Nguyen",
        "email": "lan.nguyen@example.com",
        "rank": "Partner",
        "kycStatus": true,
        "totalSales": 45000000,
        "teamVolume": 89000000,
        "accountStatus": "active",
        "joinedAt": "2024-09-15T08:00:00Z",
        "lastLoginAt": "2025-11-21T09:00:00Z"
      }
      // ... more users
    ],
    "pagination": { /* ... */ }
  }
}
```

---

### 10.3 Manage User (Admin Only)

Suspend, activate, or modify user account.

**Endpoint:** `PATCH /api/admin/users/:userId`
**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "action": "suspend", // or "activate", "update_rank"
  "reason": "Violation of terms of service",
  "newRank": "Partner" // only for update_rank action
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_1234567890",
    "action": "suspend",
    "status": "suspended",
    "updatedAt": "2025-11-21T10:00:00Z"
  }
}
```

---

### 10.4 Process Withdrawal (Admin Only)

Approve or reject withdrawal request.

**Endpoint:** `PATCH /api/admin/withdrawals/:withdrawalId`
**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "action": "approve", // or "reject"
  "note": "Approved for processing",
  "transferReference": "VCB20251121ABC123" // for approve action
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "withdrawalId": "wdr_123abc",
    "status": "approved",
    "approvedBy": "admin_001",
    "approvedAt": "2025-11-21T10:00:00Z",
    "note": "Approved for processing"
  }
}
```

---

## 11. Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required or failed |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `UNPROCESSABLE_ENTITY` | 422 | Request valid but cannot be processed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Error Response Examples

**Validation Error (400):**
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
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-11-21T10:00:00Z",
    "requestId": "req-abc123"
  }
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired access token"
  }
}
```

**Rate Limit Error (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 15 minutes.",
    "retryAfter": 900
  }
}
```

---

## 12. Rate Limiting

### Rate Limit Rules

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| Authentication | 5 requests | 15 minutes |
| AI Coach | 10 requests | 1 hour |
| AI Recommendations | 20 requests | 1 hour |
| General API | 100 requests | 1 minute |
| Admin API | 1000 requests | 1 minute |

### Rate Limit Headers

All API responses include rate limit information in headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1700560800
```

---

## Webhooks (Future Enhancement)

WellNexus will support webhooks for real-time event notifications in future versions:

**Planned Events:**
- `user.registered` - New user registration
- `order.created` - New order placed
- `order.completed` - Order completed
- `transaction.created` - New transaction
- `withdrawal.requested` - Withdrawal requested
- `withdrawal.completed` - Withdrawal completed
- `rank.upgraded` - User rank upgraded
- `kyc.approved` - KYC approved
- `kyc.rejected` - KYC rejected

---

## API Versioning

The API uses URL versioning. The current version is `v1`.

- Base URL: `https://api.wellnexus.vn/v1`
- Future versions will be released as `v2`, `v3`, etc.
- Deprecated endpoints will be supported for a minimum of 6 months after deprecation notice.

---

## SDKs & Client Libraries

Official SDKs will be available for:

- JavaScript/TypeScript (npm package)
- PHP (Composer package)
- Python (pip package)

Community SDKs welcome!

---

## Support & Contact

- **API Documentation:** https://docs.wellnexus.vn
- **Developer Portal:** https://developers.wellnexus.vn
- **Support Email:** api-support@wellnexus.vn
- **Status Page:** https://status.wellnexus.vn

---

**Document Version:** 2.0.0
**Last Updated:** 2025-11-21
**Maintained By:** WellNexus Engineering Team
