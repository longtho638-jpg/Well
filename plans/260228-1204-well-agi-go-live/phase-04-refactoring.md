# Phase 04: Component Refactoring — Well AGI Go Live

## Tổng Quan
- **Trạng thái**: Pending
- **Mục tiêu**: Tuân thủ quy tắc file < 200 lines của dự án bằng cách tách các thành phần/dịch vụ quá lớn thành các modules nhỏ gọn, dễ bảo trì hơn.

## Các File Cần Tách (Candidates)

1. **`withdrawal-service.ts` (~406 lines)**:
   - Tách logic tính toán phí/thuế sang `withdrawal-utils.ts`.
   - Tách logic gọi API/Supabase sang một base service nếu có thể.
2. **`PremiumEffects.tsx` (~445 lines) & `UltimateEffects.tsx` (~433 lines)**:
   - Tách các sub-components (animation wrappers, specific effect layers) ra các file riêng biệt.
   - Tách logic tính toán animation (framer-motion variants) sang `effect-constants.ts` hoặc `use-effects-logic.ts`.
3. **`HealthCheck.tsx` (~334 lines)**:
   - Tách logic quét/kiểm tra hệ thống thành một custom hook `useHealthCheckLogic.ts`.
   - Chia nhỏ UI hiển thị trạng thái từng phần thành các sub-components nhỏ.

## Các Bước Thực Hiện

- [ ] Phân tích cấu trúc logic trong từng file lớn để tìm điểm tách tự nhiên.
- [ ] Tiến hành tách logic/UI, đảm bảo không làm gãy functional hiện tại (verify bằng tests).
- [ ] Cập nhật các imports liên quan.
- [ ] Chạy lại `npm test` để xác nhận việc refactoring không gây lỗi.

## Tiêu Chí Thành Công
- Không còn file nào vượt quá 250-300 lines (mục tiêu lý tưởng là < 200 lines).
- Build và Tests vẫn PASS 100%.
- Cấu trúc thư mục gọn gàng, logic tập trung.
