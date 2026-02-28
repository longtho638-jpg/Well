# Phase 01: Audit & Baseline — Well AGI Go Live

## Tổng Quan
- **Trạng thái**: In-progress
- **Mục tiêu**: Xác lập baseline kỹ thuật cuối cùng, quét sạch các lỗi build/test tiềm ẩn sau đợt "deep scan" vừa rồi.

## Các Bước Thực Hiện

1. **Kiểm tra trạng thái Build & Test**:
   - Chạy `npm run build` (tsc + vite) để confirm 0 error.
   - Chạy `npm test` để confirm 349/349 PASS.
2. **Quét ESLint Toàn Diện**:
   - Chạy `npm run lint` hoặc `npx eslint src --format json -o eslint_report.json` để có danh sách chính xác 15 warnings còn lại.
3. **Quét Type Safety**:
   - Tìm kiếm các từ khóa `: any`, `as any`, `!`, `@ts-ignore` trong codebase.
4. **Kiểm tra A11y**:
   - Xác định chính xác 8 lỗi A11y đã được báo cáo trong session trước.

## Danh Sách Cần Kiểm Tra (Checklist)
- [ ] Build thành công (exit code 0)
- [ ] Tests 100% PASS
- [ ] Export danh sách ESLint warnings
- [ ] Xác định nguyên nhân `useLogin.ts:67` non-null assertion

## Tiêu Chí Thành Công
- Đã có danh sách chi tiết các file cần sửa cho Phase 02 & 03.
- Không phát hiện thêm lỗi build nghiêm trọng nào mới.
