# 10x Deep Scan & Tech Debt Liquidation - Project Well

## 🎯 Mục tiêu
- Triệt tiêu nợ kỹ thuật tại hooks, stores, context.
- Fix lỗi xử lý Supabase (error handling).
- Đảm bảo i18n 100% không hardcoded strings.
- Đạt điểm 100/100 Binh Pháp trước khi bàn giao.

## 📋 Danh sách Task

### Giai đoạn 1: Quét & Phân tích (Scout/Research)
- [ ] [TASK-01] Quét sâu `src/hooks/` - Audit logic & debt.
- [ ] [TASK-02] Quét sâu `src/store/` - Audit state management.
- [ ] [TASK-03] Quét sâu `src/context/` - Audit context providers.
- [ ] [TASK-04] Tìm kiếm các truy vấn Supabase thiếu error handling.
- [ ] [TASK-05] Quét hardcoded strings trong `src/components/`.
- [ ] [TASK-06] Quét hardcoded strings trong `src/pages/`.
- [ ] [TASK-07] Kiểm tra độ phủ Type Safety (tìm `: any`).
- [ ] [TASK-08] Kiểm tra cấu trúc `src/lib/` và `src/services/`.
- [ ] [TASK-09] Audit hiệu năng & Production readiness (Vite config, build size).
- [ ] [TASK-10] Kiểm tra bảo mật (Env vars, Supabase keys exposure).

### Giai đoạn 2: Sửa lỗi (Liquidation)
- [ ] Fix lỗi Supabase error handling.
- [ ] Chuyển đổi strings sang i18n keys.
- [ ] Refactor hooks/stores/context nếu cần.

### Giai đoạn 3: Xác thực (Verification)
- [ ] Chạy `npm run build` để kiểm tra lỗi type/compile.
- [ ] Chạy unit tests.
- [ ] Cập nhật `tasks/lessons.md`.
- [ ] Báo cáo tổng kết 100/100 Binh Pháp.
