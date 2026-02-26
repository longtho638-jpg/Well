# Báo cáo Nghiên cứu Kỹ thuật: Nợ kỹ thuật i18n (i18n Technical Debt)

## Tóm tắt (Summary)
Dựa trên phân tích mã nguồn và các tệp ngôn ngữ (`vi.ts`, `en.ts`) tại `/Users/macbookprom1/archive-2026/Well/src/locales/`, chúng tôi đã xác định được các vấn đề chính về nợ kỹ thuật liên quan đến i18n.

## Các vấn đề chính (Key Issues)

### 1. Khối mã chết (Dead Blocks)
- **`landingpage`**: Khối này tồn tại trong cả `vi.ts` và `en.ts` nhưng **không được sử dụng** trong bất kỳ tệp `.ts` hoặc `.tsx` nào. Hệ thống hiện đang sử dụng khối `landing` để thay thế.
- **`leaderdashboard`**: **Cần giữ lại**. Khối này đang được sử dụng rộng rãi (hơn 40 lần) trong các thành phần liên quan đến Dashboard cho Leader.

### 2. Chuỗi ký tự bị Hardcoded (Hardcoded Strings)
Nhiều thành phần UI vẫn chứa văn bản tiếng Việt trực tiếp thay vì sử dụng hàm `t()`. Các tệp điển hình bao gồm:
- `src/components/health/ContextSidebar.tsx` (ví dụ: 'Mất ngủ', 'Stress công việc')
- `src/components/health/ChatSidebar.tsx` (ví dụ: 'Tư vấn chứng mất ngủ')
- `src/components/admin/AdminSecuritySettings.tsx` (ví dụ: 'Hôm nay', 'Chrome trên macOS')
- `src/components/admin/FounderRevenueGoal.tsx` (ví dụ: 'Mở rộng đội partner')

### 3. Thiếu bản dịch (Missing Translations)
Một số khóa trong tệp i18n được đánh dấu là `[MISSING]`:
- `common.pending`
- `common.you`

## Chiến lược dọn dẹp (Cleanup Strategy)

### Giai đoạn 1: Loại bỏ mã chết
1. Xóa hoàn toàn khối `landingpage` khỏi `src/locales/vi.ts` và `src/locales/en.ts`.
2. Kiểm tra lại lần cuối để đảm bảo không có logic động nào gọi đến `landingpage`.

### Giai đoạn 2: Trích xuất Hardcoded Strings
1. Duyệt qua các tệp đã xác định và chuyển các chuỗi văn bản sang tệp i18n.
2. Ưu tiên các khối `admin`, `health`, và `common`.

### Giai đoạn 3: Chuẩn hóa và Đồng bộ
1. Bổ sung các bản dịch còn thiếu cho `common.pending`, `common.you`.
2. Đảm bảo cấu trúc khóa giữa `vi.ts` và `en.ts` là hoàn toàn khớp nhau (1:1).
3. Chạy lệnh kiểm tra `i18n-sync` (nếu có) hoặc dùng script grep để xác nhận không còn raw keys.

## Câu hỏi chưa giải đáp (Unresolved Questions)
- Có các module cũ nào khác ngoài `landingpage` đã bị thay thế hoàn toàn không?
- Quy trình tự động hóa nào được ưu tiên để duy trì sự đồng bộ giữa các tệp ngôn ngữ trong tương lai?

---
*Báo cáo được tạo bởi Researcher Subagent - 2026-02-26*
