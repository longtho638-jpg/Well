# WellNexus Developer Knowledge Base (AGENTS.md)

Tài liệu này tổng hợp các kiến thức kỹ thuật quan trọng, các quy ước ngầm (tribal knowledge) và các pattern đặc thù của dự án WellNexus. Được thiết kế để hỗ trợ các Agent AI và lập trình viên mới nắm bắt nhanh context mà không cần mò mẫm lại từ đầu.

## 1. Quy trình Triển khai & Scripting (Deployment)

### Quy trình Build chuẩn
Dự án sử dụng quy trình build tiêu chuẩn của Vite với các bước kiểm tra nghiêm ngặt:
- **Lệnh chính:** `npm run build` (bao gồm `tsc` và `vite build`).
- **Pre-build Checks:**
  - `sitemap:generate`: Tạo sitemap tự động.
  - `i18n:validate`: **Quan trọng**. Script này (`scripts/validate-i18n-keys.mjs`) bắt buộc mọi key trong code phải có trong cả file `vi.ts` và `en.ts`. Build sẽ thất bại nếu thiếu key.
- **Preview:** Sử dụng `npm run preview` để chạy thử bản build production tại local (port 4173), thường dùng cho Lighthouse CI.

### Scripting Convention
- Các script tiện ích nằm trong thư mục `scripts/`.
- Sử dụng `tsx` để thực thi (TypeScript Execution).
- Tuân thủ chuẩn **ESM** (ECMAScript Modules). Ví dụ: sử dụng `import.meta.url` thay vì `require.main` để kiểm tra file execution.
- **Lưu ý Git Submodule:** Nếu gặp lỗi CI exit code 128 liên quan đến submodule (như `agencyos-starter`), cần chạy `git rm --cached <path>` để loại bỏ reference hỏng.

## 2. Kiến trúc Frontend & Patterns

### State Management
- **Global State:** Sử dụng **Zustand** (`src/store.ts`) cho trạng thái phiên làm việc (Auth, User Profile). `useStore` có tích hợp trực tiếp với Supabase cho một số luồng dữ liệu.
- **Data Fetching:** Sử dụng **Service Pattern** kết hợp với **Standard React Hooks** (`useState`, `useEffect`, `useCallback`).
  - *Lưu ý quan trọng:* Dự án **KHÔNG** sử dụng React Query (TanStack Query) như một số tài liệu cũ có thể đề cập. Không cố gắng import `QueryClientProvider`.
  - Pattern chuẩn: Gọi service async trong `useEffect`, handle loading/error state thủ công hoặc qua custom hook (ví dụ: `src/hooks/useProducts.ts`).

### Network Visualization (Sơ đồ hệ thống)
Dự án sử dụng hai component riêng biệt cho việc hiển thị mạng lưới đa cấp, tùy thuộc vào context:
1.  **`NetworkTree` (Recursive):** Sử dụng đệ quy thuần React. Thường dùng trong `LeaderDashboard` cho cái nhìn tổng quan dạng danh sách lồng nhau.
2.  **`NetworkTreeDesktop` (D3-based):** Sử dụng thư viện `react-d3-tree`. Dùng trong `NetworkPage` để hiển thị biểu đồ cây trực quan, có khả năng zoom/pan.

### Modal & Portals
- Các Modal global (như `AddMemberModal`) thường sử dụng `ReactDOM.createPortal` để render trực tiếp vào `document.body`, tránh vấn đề về z-index và overflow của parent container.
- Sử dụng pattern `callback ref` để merge ref khi làm việc với `framer-motion` và `forwardRef`.

### Performance & Lazy Loading
- Các route và component nặng (như PDF generation, Admin pages) được **Lazy Load** triệt để trong `src/App.tsx`.
- Sử dụng `Suspense` bao bọc với fallback là `PageSpinner` hoặc `SectionSpinner` (định nghĩa nội bộ trong `src/App.tsx`).
- **Vite Config:** Cấu hình `manualChunks` trong `vite.config.ts` được tinh chỉnh để tách riêng các vendor lớn (`framer-motion`, `lucide-react`) giúp tối ưu caching.

## 3. Testing Standards

### Unit Testing (Vitest)
- **Mocking:** Khi test component có animation phức tạp, cần mock `framer-motion` bằng `vi.mock` với factory function để tránh lỗi hoisting.
- **Async Logic:** Các hàm utility như `debounceAsync` (`src/utils/async.ts`) cần test kỹ việc xử lý Promise để tránh treo (hung promises).

### E2E Testing (Playwright)
- Toàn bộ test E2E nằm trong thư mục `e2e/`.
- Dùng để kiểm tra luồng người dùng (User Flows) và layout shift (CLS).

## 4. Business Logic Context

### Policy Engine (Cơ chế Chính sách)
- File logic chính: `src/hooks/usePolicyEngine.ts`.
- **Metrics:** Tính toán "Strategic Forecast" bao gồm:
  - **Strategic Candidates:** 1.5% số lượng partner.
  - **Projected SaaS Revenue:** (Candidates * WhiteLabelGMV * 20%). Mặc định WhiteLabel GMV là $1B.
- Logic này chạy hoàn toàn ở client-side state để mô phỏng trước khi lưu config xuống DB.

### Data Types & Enums
- **User Ranks:** Trong Database lưu dạng số (0, 1, 2...). Trong Code sử dụng Enum (`UserRank`). Cần ép kiểu tường minh khi map dữ liệu từ DB lên UI (ví dụ: `rank as number`).
- **Transactions:** Phân biệt rõ `FinanceTransaction` (nghiệp vụ tài chính nội bộ) và `SupabaseTransaction` (log giao dịch DB) để tránh nhầm lẫn type.

## 5. UX & Accessibility (A11y)

### Cumulative Layout Shift (CLS)
- Tất cả thẻ `<img>` (đặc biệt là Trust Badges, Avatar) **BẮT BUỘC** phải có thuộc tính `width` và `height` rõ ràng.
- Sử dụng `loading="lazy"` cho ảnh dưới màn hình đầu tiên (below the fold).

### Loading States
- **Skeleton:** Sử dụng `aria-hidden='true'` vì chỉ mang tính trang trí.
- **Spinner (Active):** Sử dụng `role='status'` kèm text `sr-only` (Screen Reader Only) để thông báo trạng thái đang tải cho người khiếm thị.

---
*Tài liệu này được cập nhật tự động bởi Strategic Brain (Level 6 AGI) dựa trên quá trình phân tích codebase thực tế.*
