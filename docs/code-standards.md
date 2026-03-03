# Tiêu Chuẩn Lập Trình WellNexus

## Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
3. [Tên Biến và Hàm](#tên-biến-và-hàm)
4. [React Components](#react-components)
5. [TypeScript](#typescript)
6. [CSS & TailwindCSS](#css--tailwindcss)
7. [Kiểm Thử](#kiểm-thử)
8. [Bảo Mật](#bảo-mật)
9. [Quy Tắc Commit](#quy-tắc-commit)

## Tổng Quan
Tài liệu này mô tả các tiêu chuẩn lập trình được sử dụng trong dự án WellNexus. Tất cả các thành viên trong đội ngũ phát triển cần tuân thủ các quy tắc này để đảm bảo chất lượng và tính nhất quán của mã nguồn.

## Cấu Trúc Thư Mục
```
src/
├── agents/                 # 24+ AI agents cho hệ thống Agent-OS
├── components/            # React UI components theo chức năng
│   ├── ui/               # UI components cơ bản (Button, Modal, ...)
│   ├── dashboard/        # Components cho dashboard
│   ├── marketplace/      # Components cho thị trường
│   └── ...
├── hooks/                # React custom hooks
├── pages/                # Page components
├── services/             # API services và business logic
├── store/                # Zustand stores
├── types/                # TypeScript types/interfaces
├── utils/                # Utility functions
├── locales/              # Translation files (vi.ts, en.ts)
└── lib/                  # Third-party library configurations
```

## Tên Biến và Hàm
- Sử dụng `camelCase` cho biến và hàm: `userName`, `calculateCommission`
- Sử dụng `PascalCase` cho component và type: `UserProfile`, `UserType`
- Sử dụng `CONSTANT_CASE` cho hằng số: `MAX_COMMISSION_RATE`
- Tên biến phải mô tả rõ ràng mục đích: `isLoggedIn` thay vì `status`
- Tránh tên biến quá ngắn trừ khi trong scope nhỏ: `i` trong vòng lặp

## React Components
### Functional Components
- Sử dụng arrow function cho components đơn giản:
```typescript
const Button = ({ children, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{children}</button>;
};
```

- Với components phức tạp, sử dụng function declaration:
```typescript
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useUser(userId);
  
  if (!user) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Component Structure
```typescript
// 1. Imports
import React from 'react';
import { motion } from 'framer-motion';

// 2. Type definitions
interface Props {
  title: string;
  description?: string;
}

// 3. Component declaration
export const MyComponent: React.FC<Props> = ({ title, description }) => {
  // 4. Hooks
  const { t } = useTranslation();

  // 5. Event handlers
  const handleClick = () => {
    // logic
  };

  // 6. Component body
  return (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
};

// 7. Export
export default MyComponent;
```

## TypeScript
- Sử dụng strict mode: `strict: true` trong tsconfig.json
- Không sử dụng `any` trừ khi thực sự cần thiết
- Định nghĩa type cho tất cả props và biến trả về
- Sử dụng Union Types thay vì `any`:
```typescript
// Good
type Status = 'loading' | 'success' | 'error';

// Bad
type Status = any;
```

- Sử dụng interface thay vì type cho objects phức tạp:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}
```

## CSS & TailwindCSS
### Cấu Trúc Lớp (Class Structure)
- Sắp xếp lớp theo thứ tự logic: `position → display → sizing → margin → padding → border → background → text → other`
```html
<div className="relative flex w-full max-w-md mx-auto my-4 p-6 border border-gray-200 bg-white text-gray-900 rounded-lg">
```

### Thiết Kế Aura Elite
- Sử dụng hiệu ứng glassmorphism:
```html
<div className="bg-zinc-950/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
```

- Gradient và màu sắc:
```html
<div className="bg-gradient-to-br from-teal-500/10 to-indigo-500/5">
```

### Responsive Design
- Sử dụng các lớp responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
```html
<div className="text-base md:text-lg lg:text-xl">
```

## Kiểm Thử
### Unit Tests
- Mỗi hàm logic quan trọng cần có unit test
- Sử dụng Vitest và React Testing Library
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('MyComponent', () => {
  it('should render title correctly', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```

### Component Tests
- Kiểm tra hành vi của component
- Kiểm tra các trạng thái khác nhau (loading, success, error)
- Kiểm tra sự kiện (click, change, submit)

## Bảo Mật
### Quản Lý Dữ Liệu Nhạy Cảm
- Không lưu thông tin nhạy cảm trong localStorage
- Không hardcode API keys trong mã nguồn
- Sử dụng Supabase Auth cho xác thực
- Áp dụng RLS (Row Level Security) cho database

### Xác Thực và Ủy Quyền
- Mỗi API yêu cầu xác thực phù hợp
- Sử dụng JWT tokens từ Supabase
- Kiểm tra quyền hạn trước khi thực hiện hành động nhạy cảm

### Sanitization
- Sử dụng DOMPurify cho nội dung HTML:
```typescript
import DOMPurify from 'dompurify';
const sanitizedHTML = DOMPurify.sanitize(dirtyHTML);
```

## Quy Tắc Commit
### Convention
- Sử dụng conventional commits: `<type>(<scope>): <description>`
- Các loại commit:
  - `feat`: Thêm tính năng mới
  - `fix`: Sửa lỗi
  - `docs`: Cập nhật tài liệu
  - `style`: Thay đổi định dạng không ảnh hưởng logic
  - `refactor`: Cải thiện mã nguồn không thay đổi logic
  - `test`: Thêm hoặc sửa test
  - `chore`: Cập nhật cấu hình, dependencies

### Ví Dụ
```bash
feat(auth): add password strength indicator
fix(marketplace): resolve cart calculation issue
refactor(dashboard): improve commission calculation logic
docs(readme): update installation instructions
```

### Quy Trình
1. Viết test trước khi thực hiện thay đổi (TDD nếu phù hợp)
2. Thực hiện thay đổi mã nguồn
3. Đảm bảo tất cả test vẫn vượt qua
4. Commit với mô tả rõ ràng
5. Push và tạo Pull Request với mô tả chi tiết
