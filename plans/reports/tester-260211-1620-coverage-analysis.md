# Báo Cáo Phân Tích Test Coverage & Chất Lượng

**Ngày:** 11/02/2026
**Người thực hiện:** Antigravity Tester
**Dự án:** WellNexus Distributor Portal

## 1. Tổng Quan Metrics (Current Coverage)

Sau khi fix môi trường test (`setup.ts`), các test đã chạy thành công nhưng độ bao phủ vẫn **RẤT THẤP**. Dự án chưa đạt chuẩn an toàn cho Production.

| Metric | Tỷ lệ (%) | Target | Đánh giá |
| :--- | :--- | :--- | :--- |
| **Statements** | **14.47%** | 70% | 🔴 Nguy hiểm |
| **Branches** | **24.16%** | 70% | 🔴 Nguy hiểm |
| **Functions** | **13.04%** | 70% | 🔴 Nguy hiểm |
| **Lines** | **14.65%** | 70% | 🔴 Nguy hiểm |

**Trạng thái Build:**
- **Tests:** ✅ PASSED (Các test case hiện có đều pass)
- **Coverage:** ❌ FAILED (Không đạt ngưỡng 70%)

## 2. Top 10 Critical Files Có Coverage Thấp Nhất

Những file này chứa logic nghiệp vụ cốt lõi nhưng gần như không được test bảo vệ.

| Priority | File Path | Coverage (Stmts) | Rủi ro Nghiệp vụ |
| :--- | :--- | :--- | :--- |
| 1 | `src/hooks/useWallet.ts` | 1.96% | 🚨 Critical (Nạp/Rút tiền) |
| 2 | `src/store/slices/walletSlice.ts` | 2.32% | 🚨 Critical (State quản lý ví) |
| 3 | `src/services/orderService.ts` | 5.00% | 🚨 Critical (Tạo đơn hàng) |
| 4 | `src/services/productService.ts` | 5.55% | 🔴 High (Danh sách sản phẩm) |
| 5 | `src/services/payment/payos-client.ts` | 5.88% | 🚨 Critical (Thanh toán PayOS) |
| 6 | `src/services/email-service.ts` | 5.88% | 🟡 Medium (Gửi mail thông báo) |
| 7 | `src/store/slices/uiSlice.ts` | 5.55% | 🟡 Medium (UI State) |
| 8 | `src/store/slices/cartStore.ts` | 10.34% | 🔴 High (Giỏ hàng) |
| 9 | `src/contexts/AuthContext.tsx` | ~11% | 🚨 Critical (Phân quyền user) |
| 10 | `src/services/referral-service.ts` | 50.84% | 🟡 Medium (Hoa hồng - đã có test nhưng chưa đủ) |

## 3. Phân Tích Chất Lượng Test

### 3.1. Cải thiện đã thực hiện
- ✅ **Fix Test Environment**: Đã mock `i18next` và suppress warning của `React Router v7` trong `src/test/setup.ts`.
- ✅ **Stabilize Tests**: `src/components/ui/Button.test.tsx` và các unit test cơ bản đã pass.

### 3.2. Vấn đề tồn đọng
- **Thiếu Integration Tests**: Các module quan trọng như `Wallet`, `Order`, `Payment` hoạt động rời rạc, chưa có test kiểm tra sự tương tác.
- **Mocking Strategy**: Nhiều service đang phụ thuộc vào `supabase-js` trực tiếp, cần mock strategy thống nhất để tránh gọi real API khi test.
- **UI Tests**: Các component phức tạp như `DashboardLayout` chưa được test.

## 4. Kế Hoạch Cải Thiện (Actionable Plan)

Để đạt mục tiêu coverage > 70% và đảm bảo an toàn cho tính năng Wallet/Payment sắp tới:

### Giai đoạn 1: Bảo vệ "Money Flow" (Ưu tiên cao nhất)
Tập trung viết test cho các file liên quan đến tiền và thanh toán.
- [ ] Unit Test `src/hooks/useWallet.ts` & `walletSlice.ts`
- [ ] Unit Test `src/services/orderService.ts`
- [ ] Integration Test `payos-client.ts` (Mock API)

### Giai đoạn 2: Bảo vệ "Auth Flow" & "Core UX"
- [ ] Unit Test `src/hooks/useCart.ts` & `cartStore.ts`
- [ ] Unit Test `src/services/productService.ts`
- [ ] Integration Test cho luồng Login -> Dashboard

### Giai đoạn 3: Coverage Expansion
- [ ] Bổ sung test cho các UI components còn lại
- [ ] Nâng coverage của `referral-service.ts` lên > 80%

## 5. Kết Luận
Hệ thống hiện tại **rất dễ bị regression** khi sửa đổi code liên quan đến Ví và Thanh toán. Cần tạm dừng feature mới để trả nợ kỹ thuật về test (Tech Debt Payment).

**Next Step Recommendation:**
Chạy lệnh `/cook` với prompt: "Implement unit tests for walletSlice and useWallet hook to improve coverage"
