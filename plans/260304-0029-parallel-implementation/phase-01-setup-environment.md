# Giai Đoạn 01: Thiết Lập Môi Trường

## Liên Kết Liên Quan
- [Kế hoạch tổng thể](../260304-0029-parallel-implementation.md)
- [Tech Stack](../../docs/tech-stack.md)
- [Hướng dẫn thiết kế](../../docs/design-guidelines.md)

## Tổng Quan
- **Ưu tiên:** Cao
- **Trạng thái:** Chưa bắt đầu
- **Mô tả:** Thiết lập môi trường phát triển cục bộ và CI/CD cho dự án WellNexus

## Nhận Thức Chính
- Môi trường phát triển ổn định là tiền đề cho toàn bộ dự án
- Cần có Supabase project để làm backend
- Cấu hình CI/CD giúp tự động hóa kiểm thử và triển khai

## Yêu Cầu

### Yêu Cầu Chức Năng
- Cài đặt Node.js 18+, npm 9+ thành công
- Thiết lập Supabase project thành công
- Cấu hình biến môi trường chính xác
- GitHub Actions chạy kiểm thử tự động
- Triển khai lên Vercel thành công

### Yêu Cầu Phi Chức Năng
- Thời gian thiết lập môi trường dưới 30 phút
- Không có lỗi trong quá trình thiết lập
- Tài liệu hướng dẫn rõ ràng cho các thành viên mới

## Kiến Trúc
- Sử dụng Supabase làm backend-as-a-service
- Vercel làm nền tảng triển khai
- GitHub làm nơi lưu trữ mã nguồn và CI/CD
- Husky và lint-staged để đảm bảo chất lượng code

## Các Tệp Tin Liên Quan
- `package.json` - quản lý dependencies
- `.env.example` - mẫu cấu hình biến môi trường
- `.github/workflows/` - các workflow CI/CD
- `vite.config.ts` - cấu hình build
- `vercel.json` - cấu hình triển khai

## Các Bước Triển Khai
1. Kiểm tra phiên bản Node.js và npm
2. Cài đặt các công cụ cần thiết (npm install)
3. Tạo Supabase project và lấy credentials
4. Sao chép .env.example thành .env.local
5. Cập nhật biến môi trường cho Supabase
6. Thiết lập Supabase local development
7. Cấu hình GitHub Actions workflow
8. Kiểm tra build cục bộ
9. Cấu hình Vercel CLI
10. Triển khai thử nghiệm

## Danh Sách Công Việc
- [ ] Kiểm tra Node.js và npm
- [ ] Cài đặt dependencies
- [ ] Tạo Supabase project
- [ ] Cấu hình biến môi trường
- [ ] Cấu hình GitHub Actions
- [ ] Cấu hình Vercel
- [ ] Kiểm thử build cục bộ
- [ ] Triển khai thử nghiệm

## Tiêu Chí Thành Công
- Có thể chạy `npm run dev` thành công
- Có thể chạy `npm run build` thành công
- GitHub Actions chạy kiểm thử thành công
- Có thể triển khai lên Vercel

## Đánh Giá Rủi Ro
- **Rủi ro:** Mâu thuẫn phiên bản Node.js/npm
  - **Tác động:** Cao
  - **Giải pháp:** Sử dụng nvm để quản lý phiên bản Node.js
- **Rủi ro:** Không thể kết nối đến Supabase
  - **Tác động:** Cao
  - **Giải pháp:** Kiểm tra kết nối mạng và xác nhận lại credentials

## Cân Nhắc Bảo Mật
- Không commit file .env
- Không lưu credentials trực tiếp trong code
- Sử dụng biến môi trường cho các khóa bí mật

## Các Bước Tiếp Theo
- Sau khi hoàn thành: Chuyển sang Giai đoạn 02 (Triển khai Cơ sở dữ liệu)
- Thông báo cho nhóm biết môi trường đã sẵn sàng
- Tạo tài liệu hướng dẫn cho các thành viên mới