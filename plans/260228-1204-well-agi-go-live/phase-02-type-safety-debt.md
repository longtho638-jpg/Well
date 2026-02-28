# Phase 02: Type Safety & Debt Liquidation — Well AGI Go Live

## Tổng Quan
- **Trạng thái**: Pending
- **Mục tiêu**: Xóa sổ 100% ESLint warnings còn lại, giải quyết triệt để các vấn đề về Type Safety (any types, non-null assertions) và nợ kỹ thuật (dead code).

## Các Bước Thực Hiện

1. **Giải quyết ESLint Warnings (15 warnings)**:
   - Sửa `useLogin.ts:67`: Xử lý `!` (non-null assertion) bằng cách kiểm tra null/undefined hoặc dùng optional chaining.
   - Xóa các unused imports và variables còn sót lại (sau đợt sửa trước đó).
   - Prefix các biến không dùng nhưng bắt buộc phải khai báo (ví dụ trong callbacks) với `_`.
2. **Loại bỏ `any` types**:
   - Thay thế các khai báo `: any` và `as any` bằng interfaces/types phù hợp.
   - Đặc biệt chú ý các file test nơi `any` thường được dùng để mock dữ liệu phức tạp.
3. **Dọn dẹp Dead Code**:
   - Sử dụng `ts-prune` hoặc quét thủ công để tìm các functions/constants không bao giờ được sử dụng.
   - Xóa bỏ các mock data inline nếu đã có hệ thống mock tập trung.

## Danh Sách Cần Kiểm Tra (Checklist)
- [ ] 0 ESLint warnings (`npm run lint` sạch)
- [ ] 0 `any` types trong toàn bộ codebase (trừ trường hợp cực kỳ đặc biệt có giải trình)
- [ ] Fix triệt để lỗi non-null assertion tại `useLogin.ts`

## Tiêu Chí Thành Công
- Codebase đạt chuẩn Type Safety cao nhất.
- Không còn bất kỳ warning nào khi build hoặc lint.
