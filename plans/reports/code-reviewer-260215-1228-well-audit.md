# Báo cáo Audit Dự án Well - 15/02/2026

## 1. Tổng quan
Dự án: Well (/Users/macbookprom1/Well)
Mục tiêu: Kiểm tra TypeScript strict mode, bảo mật XSS, và Supabase RLS.
Người thực hiện: Antigravity Agent (Claude 3.5 Sonnet)

---

## 2. TypeScript Strict Mode & Type Safety
### Trạng thái hiện tại:
- `tsconfig.json` (Root) và `admin-panel/tsconfig.app.json` đều đã bật `"strict": true`.
- Tuy nhiên, việc thực thi thực tế còn lỏng lẻo.

### Vấn đề phát hiện:
- **`admin-panel/src`**: Có **81** lỗi liên quan đến việc sử dụng `any` hoặc `@ts-ignore`.
  - Hầu hết nằm trong các service (ví dụ: `distributorService.ts`) và các file test.
  - Sử dụng `any` làm mất đi lợi ích của TypeScript, dễ dẫn đến lỗi runtime không mong muốn khi cấu trúc dữ liệu thay đổi.
- **Root `src`**: Sạch hơn, không phát hiện `: any` trực tiếp qua grep nhanh.

### Đề xuất:
1. Thay thế tất cả các khai báo `: any` bằng các Interface/Type cụ thể đã được định nghĩa trong `@/types/index.ts`.
2. Hạn chế tối đa việc dùng `@ts-ignore`, thay vào đó hãy sửa lỗi kiểu dữ liệu gốc.

---

## 3. Bảo mật XSS (Cross-Site Scripting)
### Trạng thái hiện tại:
- Không tìm thấy việc sử dụng trực tiếp `dangerouslySetInnerHTML`, `innerHTML`, hoặc `outerHTML` trong các file `.tsx`. Đây là một dấu hiệu tốt.

### Vấn đề tiềm ẩn:
- Cần kiểm tra kỹ các thành phần xử lý QR code hoặc hiển thị dữ liệu từ người dùng (ví dụ: `full_name`, `notes`) xem có được render thông qua các thư viện bên thứ ba mà không qua bộ lọc của React hay không.
- Các URL chuyển hướng (redirect) cần được validate để tránh "Open Redirect" hoặc thực thi script qua giao thức `javascript:`.

---

## 4. Supabase RLS & Database Security
### Vấn đề nghiêm trọng (Critical):
1. **Lỗ hổng Search Path Selection**:
   - Các hàm sử dụng `SECURITY DEFINER` như `create_withdrawal_request`, `process_withdrawal_request`, `is_founder`, `increment_wallet_cashback` **không** thiết lập `search_path`.
   - **Rủi ro**: Kẻ tấn công có quyền tạo đối tượng trong một schema có thể "đánh tráo" các hàm hoặc toán tử mà hàm `SECURITY DEFINER` sử dụng, từ đó chiếm quyền của người tạo hàm (thường là `postgres` hoặc `service_role`).
   - **Cách sửa**: Thêm `SET search_path = public` vào định nghĩa hàm.

2. **Rò rỉ dữ liệu (Information Exposure)**:
   - Hàm `get_downline_tree` được cấp quyền `EXECUTE` cho vai trò `anon` (người dùng chưa đăng nhập).
   - Hàm này trả về `email`, `name`, `total_sales` của toàn bộ hệ thống phân cấp.
   - **Rủi ro**: Bất kỳ ai cũng có thể gọi hàm này để thu thập danh sách email và thông tin doanh số của người dùng.
   - **Cách sửa**: Chỉ cấp quyền cho `authenticated` hoặc kiểm tra quyền sở hữu trong chính nội dung hàm.

3. **Logic RLS**:
   - Chính sách `Admins can update withdrawals` sử dụng `role_id IN (1, 2, 5)`. Cần đảm bảo các ID này đồng nhất với bảng roles và không thể bị thay đổi bởi người dùng thường.

---

## 5. Kế hoạch hành động (Action Plan)
1. **Giai đoạn 1 (Bảo mật SQL)**:
   - Cập nhật các migration để thêm `search_path` cho tất cả các hàm `SECURITY DEFINER`.
   - Điều chỉnh quyền EXECUTE của hàm `get_downline_tree`.
2. **Giai đoạn 2 (Type Safety)**:
   - Refactor `admin-panel/src/services` để loại bỏ `any`.
3. **Giai đoạn 3 (XSS Verification)**:
   - Kiểm tra thủ công các component nhạy cảm.
