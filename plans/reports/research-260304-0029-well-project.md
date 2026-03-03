# Báo Cáo Nghiên Cứu Dự Án WellNexus

## 1. Tổng Quan Dự Án
- **Tên Dự Án:** WellNexus RaaS Health Platform
- **Mô Tả:** Nền tảng mã nguồn mở cho cộng đồng thương mại Hybrid dành cho Việt Nam, sử dụng hệ điều hành Agent-OS mạnh mẽ và backend Supabase. Được xây dựng cho RaaS (Retail-as-a-Service) sản phẩm sức khỏe.
- **Trạng Thái:** Đang hoạt động, có 110 bài kiểm tra, build trong 6.74s, điểm kiểm tra 97/100

## 2. Công Nghệ Chính
- **Frontend:** React 19.2.4, TypeScript 5.9.3, Vite 7.3.1
- **Quản Lý Trạng Thái:** Zustand
- **Hiệu Ứng:** Framer Motion
- **CSS:** TailwindCSS
- **Backend:** Supabase (PostgreSQL)
- **API:** REST/GraphQL
- **Triển Khai:** Vercel (wellnexus.vn)

## 3. Tính Năng Chính
- Hệ thống Agent-OS với 24+ AI agents (Huấn luyện viên, Trợ lý Bán hàng, Bộ máy Phần thưởng)
- Tích hợp AgencyOS với 85+ lệnh tự động hóa
- Tối ưu hóa SEO: thẻ meta, sơ đồ trang web, robots.txt, JSON-LD
- Hỗ trợ truy cập: vai trò ARIA, hỗ trợ điều hướng bàn phím
- Thương mại xã hội: MLM/Đại lý với hoa hồng 8 cấp (21–25%)
- Ví HealthFi: Hệ thống token kép (SHOP + GROW)
- Hỗ trợ PWA: Có thể cài đặt trên thiết bị di động và máy tính
- Giao diện tối/sáng: Chuyển đổi có hoạt ảnh và lưu trạng thái
- Tách mã: Tải trang theo yêu cầu để tăng tốc độ tải ban đầu
- Hiệu ứng Skeleton: Trạng thái tải cao cấp
- An toàn kiểu: 100% tuân thủ TypeScript ở chế độ nghiêm ngặt

## 4. Cơ Sở Dữ Liệu
- Sử dụng Supabase với PostgreSQL
- Bao gồm các bảng với RLS (Row Level Security):
  - users (hồ sơ người dùng và số dư)
  - products (sản phẩm thị trường)
  - transactions (chuyển khoản SHOP/GROW)
  - team_members (mạng lưới MLM)
  - agent_logs (hoạt động của tác nhân AI)

## 5. Hệ Thống Hoa Hồng (Bee 2.0)
- Cấp độ 1-6 (THIEN_LONG → DAI_SU): 25%
- Cấp độ 7 (KHOI_NGHIEP): 25%
- Cấp độ 8 (CTV): 21%

## 6. Tích Hợp Email
- Sử dụng Resend cho email giao dịch
- Các mẫu email: chào mừng, xác nhận đơn hàng, hoa hồng kiếm được, thăng cấp chức vụ
- Được xử lý bởi chức năng Supabase Edge để đảm bảo sự cô lập lỗi

## 7. Cấu Trúc Dự Án
```
src/
├── agents/         # Agent-OS (24+ agents)
├── components/     # Thành phần UI React
├── hooks/          # useAuth, useWallet, useAgentOS
├── pages/          # Bảng điều khiển, Thị trường, Quản trị
├── utils/          # Tokenomics, Thuế, Định dạng
└── __tests__/      # 307+ bài kiểm tra (30 tệp)
```

## 8. Môi Trường Phát Triển
- Yêu cầu: Node.js 18+, npm 9+, Supabase account
- Môi trường được cấu hình qua .env.local với các biến VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
- Sử dụng Vite cho quá trình phát triển và build

## 9. Thử Thách Có Thể Gặp Phải
- Phức tạp trong hệ thống hoa hồng đa cấp
- Việc quản lý các tác nhân AI trong Agent-OS
- Quản lý token kép (SHOP + GROW)
- Việc duy trì hiệu suất với các tính năng phong phú

## 10. Cơ Hội Phát Triển
- Mở rộng thêm các tính năng AI cho hệ thống Agent-OS
- Tối ưu hóa hiệu suất cho người dùng Việt Nam
- Phát triển thêm các tính năng thương mại xã hội
- Cải thiện trải nghiệm người dùng trên thiết bị di động