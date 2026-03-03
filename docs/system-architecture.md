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
