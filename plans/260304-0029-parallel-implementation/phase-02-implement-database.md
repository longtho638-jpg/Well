# Giai Đoạn 02: Triển Khai Cơ Sở Dữ Liệu

## Liên Kết Liên Quan
- [Kế hoạch tổng thể](../260304-0029-parallel-implementation.md)
- [Tech Stack](../../docs/tech-stack.md)

## Tổng Quan
- **Ưu tiên:** Cao
- **Trạng thái:** Chưa bắt đầu
- **Mô tả:** Thiết lập schema và cấu hình bảo mật cho cơ sở dữ liệu Supabase

## Nhận Thức Chính
- CSDL là nền tảng cho toàn bộ hệ thống
- Cần thiết lập RLS để bảo mật dữ liệu người dùng
- Tối ưu indexes giúp hiệu suất truy vấn

## Yêu Cầu

### Yêu Cầu Chức Năng
- Schema PostgreSQL hoàn chỉnh cho WellNexus
- RLS được thiết lập cho tất cả các bảng
- Stored procedures cho các thao tác phức tạp
- Triggers cho hệ thống hoa hồng

### Yêu Cầu Phi Chức Năng
- Thời gian truy vấn dưới 200ms
- Không có SQL injection
- Sao lưu dữ liệu tự động

## Kiến Trúc
- Sử dụng PostgreSQL từ Supabase
- Row Level Security cho bảo mật
- Real-time subscriptions cho cập nhật thời gian thực
- Migrations để quản lý schema

## Các Tệp Tin Liên Quan
- `supabase/migrations/` - tệp migration
- `supabase/config.toml` - cấu hình Supabase
- `supabase/functions/` - edge functions
- `src/lib/supabase.ts` - client config

## Các Bước Triển Khai
1. Xem xét schema hiện tại trong supabase/migrations
2. Thiết lập RLS cho các bảng users, products, transactions
3. Tạo stored procedures cho logic hoa hồng
4. Tạo indexes cho các cột thường xuyên truy vấn
5. Thiết lập backup và phục hồi
6. Viết seed data cho môi trường dev
7. Tạo chính sách bảo mật cho các role
8. Kiểm thử các chính sách bảo mật

## Danh Sách Công Việc
- [ ] Kiểm tra schema hiện tại
- [ ] Thiết lập RLS cho bảng users
- [ ] Thiết lập RLS cho bảng products
- [ ] Thiết lập RLS cho bảng transactions
- [ ] Tạo stored procedures cho hoa hồng
- [ ] Tạo indexes cho hiệu suất
- [ ] Viết seed data
- [ ] Kiểm thử bảo mật

## Tiêu Chí Thành Công
- Tất cả các bảng có RLS được thiết lập
- Stored procedures hoạt động chính xác
- Indexes cải thiện hiệu suất truy vấn
- Seed data được cài đặt thành công

## Đánh Giá Rủi Ro
- **Rủi ro:** Sai chính sách RLS dẫn đến rò rỉ dữ liệu
  - **Tác động:** Rất cao
  - **Giải pháp:** Kiểm thử kỹ lưỡng chính sách bảo mật
- **Rủi ro:** Hiệu suất kém do thiếu indexes
  - **Tác động:** Trung bình
  - **Giải pháp:** Theo dõi các truy vấn chậm và thêm indexes phù hợp

## Cân Nhắc Bảo Mật
- Tất cả dữ liệu nhạy cảm được bảo vệ bởi RLS
- Không có dữ liệu được chia sẻ giữa người dùng không có quyền
- Logs không chứa thông tin nhạy cảm

## Các Bước Tiếp Theo
- Sau khi hoàn thành: Giai đoạn 03, 04, 05 có thể bắt đầu song song
- Cung cấp schema cho các nhóm phát triển API và UI
- Cập nhật tài liệu cho các developer khác