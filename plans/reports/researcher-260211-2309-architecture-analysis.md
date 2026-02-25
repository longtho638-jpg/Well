# Báo cáo Phân tích Kiến trúc & Đề xuất Cải tiến

**Ngày:** 11/02/2026
**Dự án:** WellNexus Distributor Portal
**Người thực hiện:** Researcher Agent (Antigravity)

## 1. Tổng quan Kiến trúc Hiện tại (Current Architecture)

Dựa trên việc phân tích codebase (`src/`), cấu hình (`vite.config.ts`, `tsconfig.json`) và các dependencies, kiến trúc hiện tại của WellNexus được đánh giá như sau:

### 1.1. Mô hình (Pattern)
*   **Layered Architecture (Kiến trúc phân lớp):** Dự án đang tổ chức theo loại file (`components`, `pages`, `hooks`, `services`, `utils`). Đây là mô hình cổ điển của React.
*   **Client-Side Rendering (CSR):** Sử dụng Vite + React, toàn bộ logic render diễn ra phía client.
*   **State Management:**
    *   **Global Client State:** Sử dụng **Zustand** (`src/store/`). Đã bắt đầu áp dụng pattern "Slices" để chia nhỏ state, nhưng vẫn gom về một `useStore` khổng lồ trong `src/store/index.ts`.
    *   **Server State:** Đang bị trộn lẫn vào Global Client State. Ví dụ: `fetchProducts`, `fetchTransactions` được gọi và lưu trực tiếp vào Zustand store. Đây là một anti-pattern trong React hiện đại (2025-2026).
*   **Data Layer:** Tương tác trực tiếp với Supabase qua `src/services/`.

### 1.2. Cấu trúc Module
*   **`src/components`:** Chứa UI components, phân chia chưa rõ ràng giữa "dumb UI" (chỉ hiển thị) và "smart components" (có logic).
*   **`src/pages`:** Chứa các entry point của router.
*   **`src/utils`:** "Ngăn kéo thập cẩm". Chứa quá nhiều logic business (ví dụ: `commission-logic`, `tokenomics`) bị trộn lẫn với utility thuần túy (`format`, `date`).
*   **`src/locales`:** Monolith translation files (`vi.ts`, `en.ts`). File `vi.ts` đã lên tới gần 3000 dòng.

## 2. Các Vấn đề Kiến trúc (Architectural Smells)

### 🔴 Severity: High (Cần xử lý sớm)

1.  **I18n Monolith (God File):**
    *   **Vấn đề:** File `src/locales/vi.ts` quá lớn (2849 dòng).
    *   **Hậu quả:** Tăng bundle size khởi động (phải tải toàn bộ text dù chỉ ở trang login), khó maintain, dễ merge conflict.
    *   **Smell:** Large Class/File.

2.  **Server State trong Client Store:**
    *   **Vấn đề:** Lưu trữ dữ liệu từ API (`products`, `transactions`) trực tiếp trong Zustand store (`src/store/index.ts`).
    *   **Hậu quả:** Phải tự quản lý loading state (`isLoading`), error state, caching, deduping, và re-fetching. Code store trở nên phức tạp không cần thiết với logic "fetch-then-set".
    *   **Smell:** Inappropriate Intimacy (giữa UI state và Data fetching).

3.  **Thư mục `utils` quá tải (Dumpster Fire):**
    *   **Vấn đề:** Logic nghiệp vụ quan trọng (`commission-logic.test.ts`, `tokenomics.ts`) nằm chung với các hàm format đơn giản.
    *   **Hậu quả:** Khó tìm kiếm logic nghiệp vụ ("Business Logic không có nhà"). Khi cần sửa cách tính hoa hồng, dev phải bới trong `utils` thay vì một domain module rõ ràng.
    *   **Smell:** Shotgun Surgery (thay đổi 1 logic nghiệp vụ phải sửa nhiều file utils rời rạc).

### 🟡 Severity: Medium (Cần cải thiện)

1.  **Cấu trúc thư mục theo Type (Layered) thay vì Feature:**
    *   **Vấn đề:** Để sửa tính năng "Auth", dev phải nhảy qua `src/pages/Login`, `src/components/auth`, `src/services/auth`, `src/store/slices/authSlice`.
    *   **Hậu quả:** Context switching cao, khó đóng gói (encapsulate) tính năng.

2.  **Legacy Artifacts:**
    *   **Vấn đề:** Tồn tại song song `src/store.ts` (legacy export) và `src/store/index.ts` (modular).
    *   **Hậu quả:** Gây nhầm lẫn cho dev mới (hoặc AI agent) khi import.

## 3. Nghiên cứu & Đề xuất Best Practices (2026 Standard)

### 3.1. React/TypeScript Patterns
*   **Feature-Sliced Design (FSD) Lite:** Chuyển dịch dần từ cấu trúc Layered sang Feature-based.
    *   *Cũ:* `src/components/auth/LoginForm.tsx`
    *   *Mới:* `src/features/auth/components/LoginForm.tsx`, `src/features/auth/api/login.ts`, `src/features/auth/stores/authStore.ts`.
*   **Separation of State:**
    *   **Client State (UI):** Dùng Zustand (Sidebar open/close, theme, form input tạm thời).
    *   **Server State (Data):** Dùng **TanStack Query (React Query)**. Tự động cache, re-fetch, handle loading/error. Xóa bỏ 50% code trong Zustand store hiện tại.

### 3.2. I18n Architecture
*   **Namespacing (Chia nhỏ):** Không dùng 1 file `vi.ts`. Chia thành:
    *   `common.json`: Button, label chung.
    *   `auth.json`: Login, Register text.
    *   `dashboard.json`: Text cho dashboard.
*   **Lazy Loading:** Chỉ load file `auth.json` khi vào trang Login. Dùng `i18next-http-backend` hoặc dynamic import.

### 3.3. Supabase Integration
*   **Typed Schema:** Generate TypeScript types từ Database schema tự động.
    *   `npx supabase gen types typescript --project-id ... > src/types/supabase.ts`
*   **Service Layer mỏng:** Service chỉ nên là wrapper gọi Supabase SDK, logic xử lý dữ liệu nên nằm ở Custom Hooks (dùng React Query) hoặc Domain functions.

## 4. Lộ trình Refactoring (Roadmap)

### Giai đoạn 1: Dọn dẹp & Tối ưu cấp thiết (Short-term)
1.  **Consolidate Store:** Xóa bỏ sự nhập nhằng giữa `src/store.ts` và `src/store/index.ts`. Chỉ giữ lại 1 entry point duy nhất.
2.  **Split I18n:** Refactor `vi.ts` và `en.ts` thành các namespaces nhỏ hơn. Cập nhật `i18n.ts` để support multiple resources.
3.  **Strict Type Check:** Fix các `any` tiềm ẩn trong `src/utils`.

### Giai đoạn 2: Kiến trúc lại State & Data (Medium-term)
1.  **Introduce TanStack Query:** Cài đặt React Query.
2.  **Migrate Data Fetching:** Chuyển `fetchProducts`, `fetchTransactions` từ Zustand sang `useQuery`.
3.  **Slim Down Zustand:** Xóa các slice chỉ dùng để chứa data API. Zustand chỉ còn giữ session user và UI state.

### Giai đoạn 3: Modularization (Long-term)
1.  **Refactor to Features:** Tạo thư mục `src/features/`.
2.  **Migrate Business Logic:** Di chuyển logic từ `src/utils` về đúng feature (VD: `src/features/commission/utils/calculation.ts`).
3.  **Barrel Exports:** Tối ưu hóa import bằng `index.ts` sạch sẽ cho từng feature.

## 5. Kết luận
Kiến trúc hiện tại của WellNexus đủ tốt cho giai đoạn MVP nhưng đang bắt đầu bộc lộ các vấn đề về khả năng mở rộng (Scalability) và bảo trì (Maintainability). Việc tách biệt Server State ra khỏi Client State và chia nhỏ I18n là hai bước đi quan trọng nhất cần thực hiện ngay để đảm bảo performance và DX (Developer Experience).
