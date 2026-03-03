# Tech Stack - Dự Án WellNexus

## 1. Tổng Quan
Dự án WellNexus là một nền tảng sức khỏe RaaS (Retail-as-a-Service) sử dụng công nghệ hiện đại với hệ sinh thái React và Supabase để xây dựng trải nghiệm người dùng tuyệt vời và hệ thống backend mạnh mẽ.

## 2. Frontend
- **Framework:** React 19.2.4 - Thư viện JavaScript mạnh mẽ cho việc xây dựng giao diện người dùng
- **Ngôn ngữ lập trình:** TypeScript 5.9.3 - Ngôn ngữ siêu tập của JavaScript với kiểu dữ liệu tĩnh giúp phát hiện lỗi sớm và cải thiện chất lượng code
- **Bundler/Build Tool:** Vite 7.3.1 - Công cụ build nhanh với hot-module replacement giúp tăng hiệu suất phát triển
- **UI Library:** TailwindCSS - Framework CSS theo hướng utility-first giúp xây dựng giao diện đẹp mắt một cách hiệu quả
- **Component Icons:** Lucide React - Bộ biểu tượng đơn giản, nhất quán với hơn 1000 icon
- **Hiệu ứng:** Framer Motion - Thư viện tạo hiệu ứng động tiên tiến cho React

## 3. Quản Lý Trạng Thái và Thư Viện Phụ Trợ
- **State Management:** Zustand - Thư viện quản lý trạng thái nhẹ và dễ sử dụng cho React
- **Form Handling:** React Hook Form - Thư viện xử lý form hiệu quả với xác thực dễ dàng
- **Validation:** Zod - Thư viện xác thực schema mạnh mẽ
- **Utility Classes:** clsx - Công cụ kết hợp các class name một cách hiệu quả
- **UI Utilities:** Tailwind Merge - Hợp nhất class names một cách an toàn
- **Charting:** Recharts - Thư viện biểu đồ dựa trên D3 và React
- **Tree Visualization:** react-d3-tree - Thư viện hiển thị cây tổ chức trực quan

## 4. Backend & Cơ Sở Dữ Liệu
- **Backend-as-a-Service:** Supabase - Giải pháp mã nguồn mở thay thế Firebase với PostgreSQL
- **Database:** PostgreSQL - Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, hỗ trợ RLS (Row Level Security)
- **Authentication:** Supabase Auth - Hệ thống xác thực người dùng tích hợp sẵn
- **Real-time:** Supabase Realtime - Hỗ trợ cập nhật dữ liệu thời gian thực

## 5. API & Integration
- **HTTP Client:** @supabase/supabase-js - Thư viện chính thức của Supabase
- **AI SDK:** @ai-sdk từ Vercel hỗ trợ các nhà cung cấp Anthropic, Google, OpenAI
- **Routing:** React Router DOM - Điều hướng giữa các trang trong ứng dụng SPA
- **Email:** Resend - Dịch vụ gửi email giao dịch hiện đại
- **SEO:** React Helmet Async - Quản lý tiêu đề và meta tag

## 6. Testing
- **Testing Framework:** Vitest - Công cụ test nhanh chóng, tương thích với Jest
- **Testing Libraries:**
  - @testing-library/react - Thư viện test cho React components
  - @testing-library/jest-dom - Các matcher cho kiểm thử DOM
  - @testing-library/user-event - Mock sự kiện người dùng
- **E2E Testing:** Playwright - Framework kiểm thử đa nền tảng
- **Coverage:** vitest với hỗ trợ v8

## 7. Security
- **XSS Protection:** DOMPurify - Thư viện lọc nội dung HTML để ngăn chặn XSS
- **Monitoring:** Sentry React - Công cụ theo dõi lỗi và hiệu suất
- **Authentication Security:** Supabase Auth với xác thực dựa trên JWT

## 8. Localization & Internationalization
- **i18n:** i18next với react-i18next - Hỗ trợ đa ngôn ngữ cho ứng dụng
- **Language Detection:** i18next-browser-languagedetector - Tự động phát hiện ngôn ngữ trình duyệt
- **Backend Loader:** i18next-http-backend - Tải file dịch từ backend

## 9. UI/UX Enhancement
- **Animation:** Framer Motion - Thư viện tạo hiệu ứng động mạnh mẽ
- **Scroll Control:** react-scroll - Thư viện điều khiển cuộn trang
- **PDF Generation:** @react-pdf/renderer - Tạo tài liệu PDF từ React components
- **Icons & Illustrations:** Lucide React - Bộ icon đồng nhất

## 10. Development Tools
- **Linting:** ESLint - Công cụ phát hiện và sửa lỗi lập trình
- **Code Formatting:** Husky với lint-staged - Giúp giữ chất lượng code trong quá trình commit
- **Development Environment:** Node.js 18+, npm 9+
- **IDE Recommendations:** VSCode với extension phù hợp cho React, TypeScript, TailwindCSS

## 11. Build & Deployment
- **Build Tool:** Vite với cấu hình tối ưu cho TypeScript
- **Deployment:** Vercel - Nền tảng triển khai tối ưu cho ứng dụng React
- **CI/CD:** GitHub Actions tích hợp tự động kiểm thử và triển khai
- **Monitoring:** Lighthouse CI - Theo dõi hiệu suất trong quá trình phát triển

## 12. Đặc Điểm Kinh Doanh
- **Tokenomics:** Hệ thống token kép (SHOP + GROW) cho hệ sinh thái thương mại
- **Commission System:** Cơ chế hoa hồng đa cấp 8 cấp (21-25%) cho mạng lưới đối tác
- **PWA:** Ứng dụng web có thể cài đặt như ứng dụng native
- **Theming:** Hỗ trợ chủ đề sáng/tối với hiệu ứng chuyển đổi mượt mà

## 13. Tuân Thủ & Truy Cập
- **Accessibility:** Tuân thủ ARIA và hỗ trợ điều hướng bàn phím
- **SEO:** Tối ưu hóa đầy đủ với meta tags, sơ đồ trang web và JSON-LD
- **Security:** RLS trong Supabase, xác thực JWT, và các biện pháp bảo vệ XSS