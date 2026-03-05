# Hướng dẫn Tích hợp PayOS cho WellNexus RaaS Health Platform

## Tổng quan
PayOS được sử dụng làm cổng thanh toán chính cho nền tảng WellNexus RaaS Health.
Nó cung cấp khả năng tạo link thanh toán, webhook để cập nhật trạng thái đơn hàng tự động và chuyển khoản bằng mã QR (VietQR).

## 🔒 RaaS License Gating (ROIaaS Phase 1)
**PayOS Webhook & Commission Distribution bị gate behind RaaS license:**

- **License format:** `RAAS-{timestamp}-{hash}` (ví dụ: `RAAS-1709337600-a1b2c3d4e5f6`)
- **Env var:** `VITE_RAAS_LICENSE_KEY` trong `.env` hoặc `.env.production.local`
- **Features gated:**
  - `payosWebhook` - PayOS webhook handling
  - `commissionDistribution` - Commission dashboard & MLM distribution
- **Components:**
  - `src/lib/raas-gate.ts` - Core validation logic
  - `src/components/raas/LicenseGate.tsx` - Gate wrapper component
  - `src/pages/SubscriptionPage.tsx` - Wrapped với LicenseGate
  - `src/pages/CommissionDashboard.tsx` - Wrapped với LicenseGate
- **Behavior:** Users without valid license thấy upgrade modal với options "Contact Support" hoặc "Upgrade Now"

## Cấu hình (Environment Variables)
Cần cấu hình các biến môi trường sau trong Supabase Edge Functions và `.env.production.local` / `.env.local`:

```env
# Môi trường chạy PayOS
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# RaaS License (ROIaaS Phase 1 - REQUIRED for production)
VITE_RAAS_LICENSE_KEY=RAAS-XXXXXXXXXX-your-license-hash

# URL Callback & Cancel cho thanh toán
VITE_SITE_URL=https://wellnexus.vn
```

## Chức năng
1. **Tạo Link Thanh Toán (Payment Link):** Hệ thống tạo ra link thanh toán khi người dùng chọn mua sản phẩm/gói dịch vụ.
2. **Webhook & Callbacks:** PayOS sẽ gọi về hệ thống (thông qua Supabase Edge Functions) để thông báo cập nhật trạng thái đơn hàng:
   - Thành công: Cập nhật trạng thái trong database và phát hành/cập nhật quyền lợi cho người dùng (ví dụ: cấp token, đổi level, etc.).
   - Thất bại/Hủy: Cập nhật đơn hàng thành trạng thái `cancelled`.

## Bảo mật
- **Verify Webhook Checksum:** Mọi webhook call từ PayOS đều phải được verify chữ ký `PAYOS_CHECKSUM_KEY` để đảm bảo tính toàn vẹn và bảo mật của giao dịch.
- **Không Log Thông Tin Nhạy Cảm:** Tuyệt đối KHÔNG LOG các thông tin cấu hình `PAYOS_API_KEY` hay chi tiết nhạy cảm của khách hàng (PII) ra console/log files.

## Workflow Tích hợp
1. User nhấn "Thanh toán" tại Frontend.
2. Frontend gọi API Endpoint (Supabase Edge Function) để tạo giao dịch.
3. Edge Function lấy `PAYOS_*` keys từ secret của Supabase, gọi PayOS API, và trả về Checkout URL.
4. User thanh toán trên cổng PayOS.
5. PayOS gửi webhook về Edge Function của WellNexus.
6. Edge Function xác thực chữ ký (Checksum), cập nhật DB (ví dụ đổi status thành `PAID` và chia hoa hồng).
7. Gửi thông báo/email cho người dùng.

## Troubleshooting
- **Lỗi Checksum:** Đảm bảo `PAYOS_CHECKSUM_KEY` khớp giữa tài khoản PayOS và biến môi trường.
- **Webhook không gọi:** Kiểm tra cấu hình webhook URL trên dashboard PayOS xem đã trỏ đúng vào API Endpoint của Edge Function chưa.
