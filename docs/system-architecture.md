# Tài Liệu Tổng Quan Dự Án WellNexus

## Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
3. [Thành Phần Chính](#thành-phần-chính)
4. [Luồng Dữ Liệu](#luồng-dữ-liệu)
5. [Hướng Dẫn Phát Triển](#hướng-dẫn-phát-triển)

## Giới Thiệu
WellNexus là nền tảng sức khỏe RaaS (Retail-as-a-Service) sử dụng hệ thống Agent-OS và Supabase backend. Dự án được xây dựng để cung cấp giải pháp thương mại cho sản phẩm sức khỏe tại Việt Nam.

### Mục Tiêu Chính
- Cung cấp nền tảng thương mại cho sản phẩm sức khỏe
- Hỗ trợ hệ thống phân phối đa cấp (MLM) với 8 cấp độ
- Tích hợp hệ thống AI agents cho trải nghiệm người dùng nâng cao
- Hỗ trợ hệ thống token kép (SHOP và GROW)

## Kiến Trúc Hệ Thống

### Công Nghệ Chính
- **Frontend:** React 19.2.4, TypeScript 5.9.3, Vite 7.3.1
- **UI Framework:** TailwindCSS với thiết kế Aura Elite (glassmorphism, dark gradients)
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Testing:** Vitest, React Testing Library, Playwright
- **Deployment:** Vercel

### Kiến Trúc Tổng Thể
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Supabase      │◄──►│   AI Services   │
│   (React/TS)    │    │  (Auth/DB/Edge) │    │ (Anthropic/    │
│                 │    │                 │    │  Google/OpenAI) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   UI Layer      │    │  Business Logic │
│ (Components,    │    │  (Hooks, Store, │
│   Pages)        │    │   Services)     │
└─────────────────┘    └──────────────────┘
```

## Thành Phần Chính

### 1. Hệ Thống Người Dùng
- Quản lý hồ sơ người dùng với Supabase Auth
- Hệ thống vai trò và quyền hạn
- Quản lý token kép (SHOP + GROW)

### 2. Hệ Thống Sản Phẩm & Thị Trường
- Quản lý sản phẩm và danh mục
- Giỏ hàng và thanh toán
- Giao diện thị trường trực quan

### 3. Hệ Thống Hoa Hồng & Mạng Lưới (MLM)
- Hệ thống hoa hồng Bee 2.0 với 8 cấp độ
- Tỷ lệ hoa hồng: 21-25% tùy cấp
- Hệ thống giới thiệu và theo dõi mạng lưới

### 4. Hệ Thống Agent-OS
- 24+ AI agents cho trải nghiệm nâng cao
- Tích hợp với các nhà cung cấp AI hàng đầu
- Ghi nhật ký và theo dõi hiệu suất agent

### 5. Hệ Thống Dashboard & Quản Trị
- Dashboard cá nhân và quản trị viên
- Biểu đồ hiệu suất và thống kê
- Công cụ quản lý sản phẩm và người dùng

### 6. Hệ Thống Thanh Toán & License (RaaS)
- Stripe webhook integration (customer subscriptions, invoices)
- Polar.sh webhook integration (subscriptions, payments)
- PayOS webhook pipeline (Vietnamese payments, 0% fee)
- Auto license provisioning on payment
- License revocation on cancel/expire
- Audit logging for all payment events

### 7. Hệ ThốngUsage Metering (AI Tracking & Quotas)
- Real-time usage tracking via `UsageMeter` SDK
- AI inference tracking: model, provider, prompt/completion tokens
- Agent execution tracking: Planner, Researcher, Developer types
- TimescaleDB optimization with hypertables (day-based chunks)
- Continuous aggregations (hourly, daily materialized views)
- Real-time quota enforcement via Edge Functions
- 5-tier limits: free, basic, premium, enterprise, master (unlimited)
- Usage analytics API with current usage, quotas, and breakdowns

### 8. Hệ Thống Analytics Dashboard (ROIaaS Phase 5)
- **LicenseAnalyticsDashboard**: Revenue metrics, cohort retention, conversion funnel, tier breakdown
- Real-time polling (30s refresh interval)
- Export features (CSV/PDF - Enterprise only)
- Custom date range picker (Pro+ only)
- Premium gate system với tier-based content gating

**Premium Gate System:**
- Free: Basic metrics (GMV, MRR, active licenses, tier distribution)
- Pro: Advanced charts (cohort analysis, conversion funnel, revenue over time)
- Enterprise: Full access + CSV/PDF export + custom date range

**Data Flow:**
```
Polar.sh Webhooks → Edge Functions → Supabase → Analytics Hooks → Dashboard
```

**Analytics Hooks:**
- `useRevenue`: GMV, MRR, ARR, growth rate, churn rate
- `useCohortRetention`: 6-month retention curves
- `useLicenseUsage`: API calls, daily active licenses
- `useConversionFunnel`: 5-step funnel with drop-off tracking
- `useRevenueByTier`: Breakdown by free/pro/enterprise

## Luồng Dữ Liệu

### Luồng Giao Dịch Chính
```
1. Người dùng chọn sản phẩm
2. Thêm vào giỏ hàng
3. Xác thực thanh toán
4. Ghi nhận hoa hồng cho các cấp trong mạng lưới
5. Cập nhật trạng thái và token
```

### Luồng Hoa Hồng MLM
```
1. Người dùng thực hiện giao dịch
2. Hệ thống xác định các cấp liên quan trong mạng lưới
3. Tính toán hoa hồng theo tỷ lệ Bee 2.0
4. Ghi nhận vào tài khoản tương ứng
5. Cập nhật bảng xếp hạng và thông báo
```

### Luồng Usage Metering & Quota Enforcement
```
1. Học viên thực hiện request qua SDK (UsageMeter)
2. Track metric: api_call, tokens, model_inference, agent_execution
3. Insert vào usage_records table với metadata
4. Edge Function check-quota kiểm tra real-time:
   - Tính usage hiện tại (今天 UTC midnight)
   - Compare với tier limit
   - Return 429 nếu vượt quota
   - Warning ở 80%, 90%
5. TimescaleDB tự động:
   - Chunk data theo ngày
   - Aggregate hourly/daily
   - Compress sau 7 ngày
   - Retain 90 ngày
```

### Luồng Thanh Toán & License (RaaS)
```
1. Người dùng chọn gói subscription
2. thanh toán qua Stripe/Polar/PayOS
3. Webhook nhận notification → verify signature
4. License auto-provisioning:
   - Generate license key (tier-based)
   - Store in raas_licenses table
   - Send email với license key
5. subscription activated
   - Update user_subscriptions table
   - Set period_end date
   - Fire-and-forget email notification
```

## Hướng Dẫn Phát Triển

### Môi Trường Phát Triển
1. Cài đặt Node.js 18+ và npm 9+
2. Cài đặt Supabase CLI
3. Sao chép `.env.example` thành `.env.local`
4. Cấu hình Supabase credentials

### Thiết Lập Ban Đầu
```bash
npm install
npx supabase db push
npm run dev
```

### Quy Tắc Mã Hóa
- Sử dụng TypeScript với strict mode
- Tuân thủ quy tắc đặt tên camelCase cho biến và PascalCase cho component
- Sử dụng TailwindCSS theo nguyên tắc utility-first
- Component nên được đặt trong thư mục `src/components`

### Kiểm Thử
- Viết unit test cho các hàm quan trọng
- Viết component test cho các component chính
- Đảm bảo đạt độ bao phủ trên 80%
- Chạy `npm run test` để kiểm tra trước khi commit
