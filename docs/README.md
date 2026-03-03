# WellNexus Distributor Portal - Tài Liệu Tổng Quan

## Mô Tả Dự Án

WellNexus là nền tảng sức khỏe RaaS (Retail-as-a-Service) mã nguồn mở dành cho Việt Nam, được xây dựng với hệ điều hành Agent-OS mạnh mẽ và backend Supabase. Dự án được thiết kế cho mô hình RaaS (Retail-as-a-Service) các sản phẩm sức khỏe.

### Đặc Điểm Chính
- 🤖 **Hệ Thống Agent-OS** - 24+ AI agents (Huấn luyện viên, Trợ lý Bán hàng, Bộ máy Phần thưởng)
- ⚡ **Tích Hợp AgencyOS** - 85+ lệnh tự động hóa
- 🔍 **Tối Ưu Hóa SEO** - Thẻ meta, sơ đồ trang web, robots.txt, JSON-LD
- ♿ **Khả Năng Truy Cập** - Vai trò ARIA, hỗ trợ điều hướng bàn phím
- 🛍️ **Thương Mại Xã Hội** - MLM/Đại lý với hoa hồng 8 cấp (21–25%)
- 💰 **Ví HealthFi** - Hệ thống token kép (SHOP + GROW)
- 📱 **Hỗ Trợ PWA** - Có thể cài đặt trên thiết bị di động/máy tính
- 🌙 **Chủ Đề Tối/Sáng** - Chuyển đổi có hoạt ảnh và lưu trạng thái
- ⚡ **Tách Mã** - Tải trang theo yêu cầu cho tốc độ tải ban đầu nhanh
- 💀 **Tải Skeleton** - Trạng thái tải cao cấp
- ⚛️ **React 19 & Vite 7** - Cập nhật công nghệ frontend cho hiệu suất tối đa
- 🔒 **An Toàn Kiểu** - Tuân thủ TypeScript Strict Mode 100%

## Kiến Trúc Công Nghệ

### Frontend
- **Framework:** React 19.2.4
- **Ngôn ngữ:** TypeScript 5.9.3
- **Build Tool:** Vite 7.3.1
- **UI Framework:** TailwindCSS
- **Quản Lý Trạng Thái:** Zustand
- **Hiệu Ứng:** Framer Motion

### Backend
- **Backend-as-a-Service:** Supabase
- **Cơ Sở Dữ Liệu:** PostgreSQL với RLS (Row Level Security)
- **Xác Thực:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Edge Functions:** Supabase Edge Functions

### Công Cụ Phát Triển
- **Kiểm Thử:** Vitest, React Testing Library, Playwright
- **Phân Tích Mã:** ESLint, TypeScript
- **Tự Động Hóa:** Husky, lint-staged
- **Triển Khai:** Vercel

## Thiết Kế Aura Elite

Dự án sử dụng phong cách thiết kế Aura Elite với các đặc điểm:
- **Glassmorphism** - Hiệu ứng kính trong suốt
- **Dark Gradients** - Gradient tối làm nền
- **Hiệu Ứng Chuyển Động** - Sử dụng Framer Motion
- **Responsive Design** - Hỗ trợ mọi kích thước màn hình

## Hệ Thống Hoa Hồng (Bee 2.0)

- **Cấp độ 1-6 (THIEN_LONG → DAI_SU):** 25%
- **Cấp độ 7 (KHOI_NGHIEP):** 25%
- **Cấp độ 8 (CTV):** 21%

## Cài Đặt

### Điều Kiện Tiên Quyết
- Node.js 18+ và npm 9+
- Tài khoản Supabase (có thể dùng bản miễn phí)
- Git

### 1. Sao Chép Kho
```bash
git clone https://github.com/longtho638-jpg/Well.git
cd Well
```

### 2. Cài Đặt Thư Viện Phụ Thuộc
```bash
npm install
```

### 3. Thiết Lập Môi Trường
```bash
# Sao chép file cấu hình môi trường
cp .env.example .env.local

# Chỉnh sửa .env.local và thêm các biến bắt buộc:
# VITE_SUPABASE_URL=https://jcbahdioqoepvoliplqy.supabase.co
# VITE_SUPABASE_ANON_KEY=<khóa-chung-từ-bảng-điều-khiển-supabase>
```

**Lấy thông tin xác thực Supabase:**
1. Truy cập [Bảng điều khiển Supabase](https://supabase.com/dashboard)
2. Chọn dự án của bạn (hoặc tạo mới)
3. Vào Settings → API
4. Sao chép `Project URL` → `VITE_SUPABASE_URL`
5. Sao chép khóa `anon public` → `VITE_SUPABASE_ANON_KEY`

### 4. Thiết Lập Cơ Sở Dữ Liệu
```bash
# Chạy các bản cập nhật cơ sở dữ liệu bằng Supabase CLI
npx supabase db push

# Hoặc thực hiện thủ công:
# 1. Mở Bảng điều khiển Supabase → Trình soạn thảo SQL
# 2. Sao chép nội dung từ supabase/migrations/20260113_recursive_referral.sql
# 3. Dán và Chạy
```

### 5. Máy Chủ Phát Triển
```bash
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173) trong trình duyệt của bạn.

### 6. Chạy Kiểm Thử
```bash
# Chạy tất cả kiểm thử
npm run test:run

# Chạy với độ bao phủ
npm run test:coverage

# Chạy ở chế độ theo dõi (phát triển)
npm run test
```

### 7. Xây Dựng cho Sản Xuất
```bash
npm run build

# Xem trước bản dựng sản xuất
npm run preview
```

**Xác minh bản dựng:**
- ✅ 0 lỗi TypeScript
- ✅ Tất cả kiểm thử vượt qua
- ✅ Kích thước bundle < 500KB (đã nén)
- ✅ Thời gian xây dựng < 5s

## Cấu Trúc Dự Án
```
src/
├── agents/         # Hệ thống Agent-OS (24+ agents)
├── components/     # React UI components
├── hooks/          # useAuth, useWallet, useAgentOS
├── pages/          # Dashboard, Marketplace, Admin
├── utils/          # Tokenomics, Tax, Format
└── __tests__/      # 307+ tests (30 files)
```

## Kiểm Thử

| Module | Số Lượng |
|--------|-----------|
| Logic Hoa Hồng | 24 |
| Trang Dashboard | 26 |
| Logic Quản Trị | 18 |
| Tokenomics | 14 |
| Logic Đại Lý | 12 |
| Thanh Toán (PayOS) | 18 |
| Components UI | 24 |
| Dịch Vụ Giới Thiệu | 15 |
| Khác | 156 |
| **Tổng Cộng** | **307+** |

## Schema Cơ Sở Dữ Liệu

| Bảng | RLS | Mục Đích |
|------|-----|----------|
| users | ✅ | Hồ sơ người dùng và số dư |
| products | ✅ | Sản phẩm trên thị trường |
| transactions | ✅ | Chuyển nhượng SHOP/GROW |
| team_members | ✅ | Mạng lưới MLM |
| agent_logs | ✅ | Hoạt động của AI agent |

## Tích Hợp Email (Resend)

WellNexus sử dụng **Resend** cho email giao dịch với gói miễn phí hào phóng (100 email/ngày, 3,000/tháng).

### Mẫu Email
- ✅ Email chào mừng (đăng ký người dùng mới)
- ✅ Xác nhận đơn hàng (đơn hàng đã hoàn thành)
- ✅ Hoa hồng kiếm được (trực tiếp + hoa hồng F1 giới thiệu)
- ✅ Thông báo thăng cấp chức vụ

### Thiết Lập

1. **Lấy Khóa API Resend**
   - Đăng ký tại [resend.com](https://resend.com)
   - Điều hướng đến trang API Keys
   - Tạo khóa API mới (bắt đầu với `re_`)

2. **Cấu Hình Chức Năng Edge của Supabase**
   ```bash
   # Đặt khóa bí mật trong Bảng điều khiển Supabase
   # Vào: Cài đặt dự án > Chức năng Edge > Bí mật
   # Thêm: RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

   # Hoặc qua CLI của Supabase:
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Xác Minh Tên Miền (Sản Xuất)**
   - Thêm tên miền của bạn vào Resend
   - Thêm bản ghi DNS (SPF, DKIM, DMARC)
   - Đối với kiểm thử, dùng mặc định `onboarding@resend.dev`

4. **Kiểm Tra Gửi Email**
   ```typescript
   import { emailService } from './src/services/email-service-client-side-trigger';

   // Gửi email chào mừng kiểm tra
   await emailService.sendWelcome('user@example.com', {
     userName: 'Test User',
     userEmail: 'user@example.com',
   });
   ```

### Trình Kích Hoạt Email
Email được gửi tự động khi:
- ✅ Người dùng hoàn tất đơn hàng → Thông báo hoa hồng kiếm được
- ✅ Người giới thiệu kiếm hoa hồng F1 → Thông báo hoa hồng F1 giới thiệu
- ✅ Người dùng đạt cấp độ mới → Email chúc mừng với số liệu

Tất cả việc gửi email được xử lý bởi Chức năng Edge của Supabase `send-email` với cách ly lỗi (lỗi email không làm hỏng quá trình xử lý phần thưởng).

## Tài Liệu Liên Quan

- [Kiến Trúc Hệ Thống](./system-architecture.md) - Mô tả chi tiết kiến trúc
- [Tiêu Chuẩn Lập Trình](./code-standards.md) - Quy tắc và tiêu chuẩn lập trình
- [Bản Đồ Phát Triển](./project-roadmap.md) - Kế hoạch phát triển trong tương lai
- [Hướng Dẫn Thiết Kế](./design-guidelines.md) - Hướng dẫn thiết kế UI/UX
- [Tài Liệu Tech Stack](./tech-stack.md) - Chi tiết công nghệ sử dụng

## Đóng Góp

```bash
# Đảm bảo bản dựng vượt qua
npm run build     # Yêu cầu 0 lỗi
npm run test:run  # Tất cả kiểm thử phải vượt qua
```

---

**Cập Nhật Lần Cuối:** 2026-02-11 | **Phiên Bản:** 2.4.0 | **Trạng Thái:** ✅ Sẵn Sàng Sản Xuất
