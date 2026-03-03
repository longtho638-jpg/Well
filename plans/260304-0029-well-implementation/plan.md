# Kế Hoạch Triển Khai Song Song - Dự Án WellNexus

## Tổng Quan
Kế hoạch này mô tả cách tiếp cận song song để triển khai các thành phần chính của dự án WellNexus Distributor Portal. Các giai đoạn được thiết kế để có thể thực hiện đồng thời bởi các nhóm phát triển khác nhau.

## Mục Tiêu
- Triển khai đầy đủ hệ thống WellNexus Distributor Portal
- Đảm bảo tích hợp liền mạch giữa các thành phần
- Tối ưu hóa thời gian phát triển bằng cách thực hiện các công việc độc lập song song

## Đồ Thị Phụ Thuộc

```
Giai Đoạn 0: Thiết Lập Môi Trường
           ↓
Giai Đoạn 1: Thiết Lập Cơ Sở Dữ Liệu ↔ Giai Đoạn 2: Thiết Lập API
           ↓                           ↓
Giai Đoạn 3: Triển Khai UI/UX ↔ Giai Đoạn 4: Triển Khai Xác Thực
           ↓                           ↓
Giai Đoạn 5: Triển Khai Tính Năng Chính
           ↓
Giai Đoạn 6: Kiểm Thử & Tích Hợp
```

## Chi Tiết Giai Đoạn

### Giai Đoạn 0: Thiết Lập Môi Trường (phase-00-setup-environment.md)
**Trạng thái:** Chưa bắt đầu
**Ưu tiên:** Cao
**Mô tả:** Thiết lập môi trường phát triển, công cụ, và cấu hình ban đầu

**Yêu cầu chức năng:**
- Cài đặt Node.js 18+, npm 9+
- Cài đặt và cấu hình Supabase CLI
- Cài đặt công cụ phát triển (VSCode, extensions)

**Yêu cầu phi chức năng:**
- Môi trường phát triển nhất quán giữa các thành viên
- Quy trình thiết lập đơn giản, dễ dàng

**Kiến trúc:**
- Cấu hình môi trường phát triển cục bộ
- Cấu hình CI/CD cơ bản

**Tệp liên quan:**
- package.json
- .env.example
- .vscode/extensions.json
- .gitignore

**Bước thực hiện:**
1. Cài đặt Node.js 18+ và npm 9+
2. Cài đặt Supabase CLI
3. Cài đặt các công cụ phát triển cần thiết
4. Cấu hình .env.local từ .env.example
5. Thiết lập cấu hình VSCode
6. Thiết lập các công cụ hỗ trợ (ESLint, Prettier, Husky)

**Danh sách công việc:**
- [ ] Cài đặt môi trường Node.js
- [ ] Cài đặt Supabase CLI
- [ ] Cấu hình .env.local
- [ ] Thiết lập công cụ phát triển
- [ ] Kiểm tra môi trường hoạt động

**Tiêu chí hoàn thành:**
- Môi trường phát triển được thiết lập thành công
- npm install và npm run dev hoạt động bình thường

**Đánh giá rủi ro:**
- Phiên bản Node.js không tương thích
- Cài đặt công cụ thất bại do quyền hạn

**Xem xét bảo mật:**
- Không commit file .env vào repository
- Sử dụng biến môi trường cho các khóa bí mật

**Bước tiếp theo:**
- Chuyển sang Giai đoạn 1 và 2 cùng lúc

---

### Giai Đoạn 1: Thiết Lập Cơ Sở Dữ Liệu (phase-01-implement-database.md)
**Trạng thái:** Chưa bắt đầu
**Ưu tiên:** Cao
**Mô tả:** Thiết lập cấu trúc cơ sở dữ liệu và các chức năng liên quan đến Supabase

**Yêu cầu chức năng:**
- Cài đặt Supabase project
- Thiết lập schema cơ sở dữ liệu
- Cài đặt Row Level Security (RLS)
- Tạo stored procedures cho các chức năng chính

**Yêu cầu phi chức năng:**
- Hiệu suất truy vấn tối ưu
- An toàn bảo mật dữ liệu

**Kiến trúc:**
- Sử dụng PostgreSQL qua Supabase
- Thiết kế schema cho người dùng, sản phẩm, giao dịch, mạng lưới MLM
- Thiết lập RLS cho bảo mật cấp độ hàng

**Tệp liên quan:**
- supabase/config.toml
- supabase/migrations/*.sql
- src/lib/supabase.ts

**Bước thực hiện:**
1. Tạo project Supabase mới hoặc kết nối project hiện có
2. Thiết kế schema cơ sở dữ liệu (users, products, transactions, team_members, agent_logs)
3. Viết các tệp migration SQL
4. Thiết lập RLS cho các bảng
5. Cài đặt stored procedures cho các tính năng phức tạp
6. Tạo file client để kết nối với Supabase

**Danh sách công việc:**
- [ ] Thiết lập project Supabase
- [ ] Thiết kế schema cơ sở dữ liệu
- [ ] Viết tệp migration SQL
- [ ] Cài đặt Row Level Security
- [ ] Viết stored procedures
- [ ] Tạo Supabase client

**Tiêu chí hoàn thành:**
- Cơ sở dữ liệu được thiết lập hoàn chỉnh
- RLS hoạt động đúng cách
- Kết nối từ frontend thành công

**Đánh giá rủi ro:**
- Mất dữ liệu trong quá trình migration
- Vấn đề bảo mật nếu RLS không được thiết lập đúng

**Xem xét bảo mật:**
- Thiết lập RLS chặt chẽ
- Không lưu trữ khóa trực tiếp trong mã nguồn

**Bước tiếp theo:**
- Giai đoạn này có thể chạy song song với Giai đoạn 2
- Kết nối với Giai đoạn 4 khi cần xác thực người dùng

---

### Giai Đoạn 2: Thiết Lập API (phase-02-implement-api-endpoints.md)
**Trạng thái:** Chảo bắt đầu
**Ưu tiên:** Cao
**Mô tả:** Triển khai các endpoint API cho phép frontend tương tác với backend

**Yêu cầu chức năng:**
- Endpoint CRUD cho các tài nguyên chính
- Authentication và authorization
- API cho hệ thống hoa hồng và mạng lưới MLM
- Endpoint cho AI agents

**Yêu cầu phi chức năng:**
- Hiệu suất xử lý nhanh
- Xử lý lỗi phù hợp

**Kiến trúc:**
- Sử dụng Supabase Functions cho các endpoint phức tạp
- Sử dụng trực tiếp Supabase client cho các truy vấn đơn giản
- Tích hợp với hệ thống AI SDK

**Tệp liên quan:**
- supabase/functions/**/*.ts
- src/lib/api.ts
- src/services/*.ts

**Bước thực hiện:**
1. Thiết kế API endpoints cho các tài nguyên chính
2. Viết Supabase Functions nếu cần xử lý phức tạp
3. Tạo service layer trong frontend để gọi API
4. Xử lý xác thực và ủy quyền
5. Tích hợp với AI SDK
6. Thêm xử lý lỗi và log

**Danh sách công việc:**
- [ ] Thiết kế API endpoints
- [ ] Viết Supabase Functions
- [ ] Tạo service layer
- [ ] Xử lý xác thực/ủy quyền
- [ ] Tích hợp AI SDK
- [ ] Xử lý lỗi và log

**Tiêu chí hoàn thành:**
- Tất cả API endpoints hoạt động đúng
- Xác thực và ủy quyền hoạt động
- API trả về lỗi đúng định dạng

**Đánh giá rủi ro:**
- Lỗi bảo mật trong xác thực
- Hiệu suất kém khi có nhiều request

**Xem xét bảo mật:**
- Xác thực JWT đúng cách
- Kiểm tra quyền hạn cho từng endpoint
- Không tiết lộ thông tin nhạy cảm trong lỗi

**Bước tiếp theo:**
- Giai đoạn này có thể chạy song song với Giai đoạn 1
- Kết nối với Giai đoạn 3 và 4 để tích hợp

---

### Giai Đoạn 3: Triển Khai UI/UX (phase-03-implement-ui-components.md)
**Trạng thái:** Chưa bắt đầu
**Ưu tiên:** Trung bình
**Mô tả:** Phát triển các thành phần giao diện người dùng và trải nghiệm người dùng

**Yêu cầu chức năng:**
- Giao diện cho dashboard người dùng
- Giao diện cho sản phẩm và giỏ hàng
- Giao diện cho hệ thống hoa hồng và mạng lưới
- Giao diện cho các AI agents

**Yêu cầu phi chức năng:**
- Tốc độ tải nhanh
- Trải nghiệm người dùng mượt mà
- Tương thích với thiết bị di động (PWA)

**Kiến trúc:**
- Sử dụng React 19 và TypeScript
- Tích hợp TailwindCSS cho styling
- Framer Motion cho hiệu ứng
- Thiết kế theo hướng dẫn Aura Elite

**Tệp liên quan:**
- src/components/**
- src/pages/**
- src/styles/**
- src/hooks/**

**Bước thực hiện:**
1. Thiết kế các thành phần UI cơ bản theo hướng dẫn thiết kế
2. Triển khai các trang chính (home, dashboard, products, profile)
3. Tích hợp với API từ Giai đoạn 2
4. Thêm hiệu ứng hoạt ảnh với Framer Motion
5. Tối ưu hóa hiệu suất và khả năng truy cập
6. Đảm bảo hỗ trợ PWA

**Danh sách công việc:**
- [ ] Thiết kế thành phần UI cơ bản
- [ ] Triển khai các trang chính
- [ ] Tích hợp với API
- [ ] Thêm hiệu ứng hoạt ảnh
- [ ] Tối ưu hóa hiệu suất
- [ ] Cấu hình PWA

**Tiêu chí hoàn thành:**
- Giao diện người dùng hoạt động hoàn chỉnh
- Tuân thủ hướng dẫn thiết kế Aura Elite
- Hỗ trợ đầy đủ trên thiết bị di động
- Điểm Lighthouse cao

**Đánh giá rủi ro:**
- Trải nghiệm người dùng không mượt mà
- Hiệu suất kém trên thiết bị yếu

**Xem xét bảo mật:**
- Không hiển thị thông tin nhạy cảm không cần thiết
- Bảo vệ chống XSS với các nội dung động

**Bước tiếp theo:**
- Giai đoạn này có thể bắt đầu sau khi Giai đoạn 0 hoàn tất
- Cần dữ liệu từ Giai đoạn 1 và 2 để hiển thị

---

### Giai Đoạn 4: Triển Khai Xác Thực và Hồ Sơ Người Dùng (phase-04-implement-authentication.md)
**Trạng thái:** Chưa bắt đầu
**Ưu tiên:** Cao
**Mô tả:** Triển khai hệ thống xác thực người dùng và quản lý hồ sơ

**Yêu cầu chức năng:**
- Đăng ký, đăng nhập, đăng xuất
- Quản lý hồ sơ người dùng
- Quản lý quyền hạn người dùng
- Quản lý session và JWT tokens

**Yêu cầu phi chức năng:**
- Bảo mật xác thực cao
- Thời gian phản hồi nhanh

**Kiến trúc:**
- Sử dụng Supabase Auth
- Store Zustand cho quản lý trạng thái xác thực
- Hook tùy chỉnh cho xác thực

**Tệp liên quan:**
- src/hooks/useAuth.ts
- src/store/authStore.ts
- src/components/Auth/**
- src/pages/Login.tsx, Register.tsx

**Bước thực hiện:**
1. Thiết lập Supabase Auth
2. Tạo hook và store cho xác thực
3. Triển khai các thành phần xác thực
4. Tích hợp với UI từ Giai đoạn 3
5. Thêm xử lý lỗi và xác thực đầu vào
6. Thử nghiệm các trường hợp xác thực

**Danh sách công việc:**
- [ ] Thiết lập Supabase Auth
- [ ] Tạo hook và store xác thực
- [ ] Triển khai thành phần xác thực
- [ ] Tích hợp với UI
- [ ] Thêm xử lý lỗi
- [ ] Kiểm thử xác thực

**Tiêu chí hoàn thành:**
- Hệ thống xác thực hoạt động hoàn chỉnh
- Người dùng có thể đăng ký và đăng nhập
- Quản lý session hoạt động chính xác

**Đánh giá rủi ro:**
- Lỗ hổng bảo mật trong xác thực
- Vấn đề với quản lý session

**Xem xét bảo mật:**
- Bảo vệ chống lại CSRF
- Sử dụng JWT tokens an toàn
- Xử lý đăng xuất đúng cách

**Bước tiếp theo:**
- Giai đoạn này có thể chạy song song với Giai đoạn 2
- Cung cấp xác thực cho Giai đoạn 1, 2, 3

---

### Giai Đoạn 5: Triển Khai Tính Năng Chính (phase-05-implement-core-features.md)
**Trạng thái:** Chưa bắt đầu
**Ưu tiên:** Cao
**Mô tả:** Triển khai các tính năng chính của hệ thống như hoa hồng, mạng lưới MLM, AI agents

**Yêu cầu chức năng:**
- Hệ thống hoa hồng đa cấp Bee 2.0
- Mạng lưới đại lý MLM
- AI agents (Coach, Sales Copilot, Reward Engine)
- Tokenomics (SHOP + GROW)

**Yêu cầu phi chức năng:**
- Tính toán hoa hồng chính xác
- Hiệu suất xử lý cao cho hệ thống lớn

**Kiến trúc:**
- Kết hợp frontend, backend và AI services
- Sử dụng Supabase Functions cho tính toán phức tạp
- Tích hợp AI SDK cho các agents

**Tệp liên quan:**
- src/agents/**
- src/services/commissionService.ts
- src/services/mlmNetworkService.ts
- src/utils/tokenomics.ts

**Bước thực hiện:**
1. Triển khai logic tính toán hoa hồng
2. Thiết kế giao diện cho hệ thống MLM
3. Tạo các AI agents
4. Tích hợp hệ thống token kép
5. Thêm báo cáo và phân tích
6. Kiểm thử logic kinh doanh

**Danh sách công việc:**
- [ ] Triển khai logic hoa hồng
- [ ] Thiết kế giao diện MLM
- [ ] Tạo AI agents
- [ ] Tích hợp tokenomics
- [ ] Thêm báo cáo
- [ ] Kiểm thử logic kinh doanh

**Tiêu chí hoàn thành:**
- Hệ thống hoa hồng hoạt động chính xác
- Mạng lưới MLM được hiển thị và quản lý đúng
- AI agents hoạt động như mong đợi
- Hệ thống token kép hoạt động

**Đánh giá rủi ro:**
- Lỗi tính toán hoa hồng
- Hiệu suất kém khi mạng lưới lớn

**Xem xét bảo mật:**
- Bảo vệ chống gian lận hoa hồng
- Kiểm tra quyền hạn chính xác

**Bước tiếp theo:**
- Phụ thuộc vào hoàn thành của các giai đoạn trước
- Cần API (Giai đoạn 2) và xác thực (Giai đoạn 4)

---

### Giai Đoạn 6: Kiểm Thử & Tích Hợp (phase-06-integration-testing.md)
**Trạng thái:** Chưa bắt đầu
**Ưu tiên:** Cao
**Mô tả:** Kiểm thử toàn bộ hệ thống và tích hợp các thành phần

**Yêu cầu chức năng:**
- Kiểm thử tích hợp toàn bộ hệ thống
- Kiểm thử chấp nhận người dùng
- Kiểm thử hiệu suất

**Yêu cầu phi chức năng:**
- Đảm bảo chất lượng cao
- Hiệu suất đạt yêu cầu

**Kiến trúc:**
- Sử dụng Vitest, React Testing Library, Playwright
- Thiết lập pipeline CI/CD hoàn chỉnh

**Tệp liên quan:**
- __tests__/**
- playwright.config.ts
- vitest.config.ts

**Bước thực hiện:**
1. Viết unit test cho các thành phần chính
2. Viết integration test cho luồng nghiệp vụ
3. Viết E2E test cho các luồng chính
4. Thiết lập pipeline CI/CD
5. Thực hiện kiểm thử hiệu suất
6. Chuẩn bị cho triển khai sản xuất

**Danh sách công việc:**
- [ ] Viết unit test
- [ ] Viết integration test
- [ ] Viết E2E test
- [ ] Thiết lập CI/CD
- [ ] Kiểm thử hiệu suất
- [ ] Triển khai thử nghiệm

**Tiêu chí hoàn thành:**
- 90%+ code coverage
- Tất cả test đều vượt qua
- Hệ thống đạt yêu cầu hiệu suất
- Triển khai thành công

**Đánh giá rủi ro:**
- Vấn đề tích hợp giữa các thành phần
- Hiệu suất không đạt yêu cầu

**Xem xét bảo mật:**
- Kiểm thử bảo mật
- Xác minh tất cả xác thực hoạt động

**Bước tiếp theo:**
- Đây là giai đoạn cuối cùng trước sản xuất
- Kết thúc vòng lặp phát triển

---

## Chiến Lược Thực Thi

### Song Song Giai Đoạn 1 & 2
- DB team làm việc độc lập trên schema và RLS
- API team bắt đầu với endpoint mock nếu cần
- Hai team phối hợp để đảm bảo schema và API khớp nhau

### Song Song Giai Đoạn 3 & 4
- UI team có thể làm việc với mock data trước
- Auth team hoàn thành xác thực cơ bản để UI team tích hợp
- Phối hợp chặt chẽ để đảm bảo trải nghiệm người dùng liền mạch

### Kết Nối Các Giai Đoạn
- Giai đoạn 5 yêu cầu hoàn thành của 1, 2, 3, 4
- Giai đoạn 6 yêu cầu hoàn thành của tất cả giai đoạn trước