# Báo Cáo Phân Tích Test Coverage & Chất Lượng

**Ngày:** 26/02/2026
**Người thực hiện:** Antigravity Tester
**Dự án:** WellNexus Distributor Portal

## 1. Tổng Quan Metrics (Current Coverage)

Hiện tại, độ bao phủ test (coverage) của dự án đang ở mức **RẤT THẤP**. Hầu hết các luồng nghiệp vụ quan trọng chưa được bảo vệ bởi automated tests.

| Metric | Tỷ lệ (%) | Đánh giá |
| :--- | :--- | :--- |
| **Statements** | ~14% | 🔴 Nguy hiểm |
| **Branches** | ~24% | 🔴 Nguy hiểm |
| **Functions** | ~13% | 🔴 Nguy hiểm |
| **Lines** | ~14% | 🔴 Nguy hiểm |

**Trạng thái Build:** ❌ **FAILED** (Exit code 1)
- Có test case đang fail, chặn quy trình CI/CD.

## 2. Top 10 File Quan Trọng Chưa Được Test (Critical Untested Files)

Các file này chứa logic cốt lõi nhưng coverage gần như bằng 0. Rủi ro lỗi nghiệp vụ là rất cao.

| File Path | Coverage | Mức độ Nghiêm trọng |
| :--- | :--- | :--- |
| `src/contexts/AuthContext.tsx` | 10.93% | 🚨 Critical (Auth Flow) |
| `src/services/authService.ts` | 14.28% | 🚨 Critical (Auth Logic) |
| `src/services/orderService.ts` | 5.00% | 🚨 Critical (Money Flow) |
| `src/hooks/useCart.ts` | 3.73% | 🚨 Critical (Shopping Cart) |
| `src/services/payment/payos-client.ts` | 5.88% | 🚨 Critical (Payment Integration) |
| `src/store/slices/walletSlice.ts` | 2.32% | 🚨 Critical (Wallet Management) |
| `src/components/Dashboard/DashboardLayout.tsx` | 0.00% | 🔴 High (Main UI Layout) |
| `src/services/productService.ts` | 5.55% | 🔴 High (Product Logic) |
| `src/hooks/useCheckout.ts` | 0.00% | 🔴 High (Checkout Flow) |
| `src/services/referral-service.ts` | 50.84% | 🟡 Medium (Referral Logic) |

## 3. Vấn Đề Chất Lượng Test (Test Quality Issues)

### 3.1. Failed Tests (Cần Fix Ngay)
- **`src/components/ui/Button.test.tsx`**: Fail do thiếu cấu hình `i18next` trong môi trường test (`NO_I18NEXT_INSTANCE`).
- **`src/agents/custom/__tests__/AgencyOSAgent.test.ts`**: Fail (cần điều tra thêm, có thể do mock policy check).

### 3.2. Cảnh Báo (Warnings)
- **React Router Future Flags**: Cảnh báo về `v7_startTransition` và `v7_relativeSplatPath`. Cần update config router trong test setup.

### 3.3. Test Gaps
- **Thiếu Integration Tests**: Hầu như không có test kiểm tra sự kết hợp giữa các module (ví dụ: Cart -> Checkout -> Payment).
- **Thiếu E2E Tests**: Chưa có kịch bản kiểm thử luồng người dùng thực tế (Login -> Mua hàng -> Thanh toán).
- **Hardcoded Values**: Một số test cũ (nếu có) có thể đang dùng hardcoded strings thay vì translation keys (vi phạm i18n rule).

## 4. Kế Hoạch Cải Thiện (Actionable Plan)

Để đạt mục tiêu an toàn cho Production, cần thực hiện các bước sau theo thứ tự ưu tiên:

### Giai đoạn 1: Fix & Secure (Ngay lập tức)
1. **Fix `src/components/ui/Button.test.tsx`**: Cấu hình `i18nForTests` để mock translation.
2. **Fix `AgencyOSAgent.test.ts`**: Debug và sửa lỗi logic test.
3. **Setup Test Environment chuẩn**: Config `vitest` để suppress các warning không cần thiết và xử lý React Router flags.

### Giai đoạn 2: Critical Flows (Trong tuần này)
Viết Unit/Integration tests cho các module "Money Flow" & "Auth Flow":
1. **Auth**: `AuthContext`, `useAuth`, `authService`.
2. **Cart & Checkout**: `useCart`, `cartStore`, `orderService`.
3. **Payment**: `payos-client` (Mock API calls cẩn thận).

### Giai đoạn 3: Coverage Expansion (Tuần tiếp theo)
1. Tăng coverage cho các UI Components cơ bản (`Button`, `Input`, `Modal`).
2. Viết test cho `Wallet` và `Referral` logic.
3. Thiết lập E2E tests cơ bản với Playwright (Login flow).

## 5. Kết Luận
Chất lượng test hiện tại **CHƯA ĐẠT** yêu cầu để deploy an toàn. Cần dừng feature work mới để tập trung fix test nền tảng và phủ coverage cho các phần critical.

**Recommendation:** Chuyển sang mode `/fix:test` để sửa lỗi build ngay lập tức.
