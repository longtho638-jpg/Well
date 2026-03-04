# Đóng Góp Cho WellNexus

Cảm ơn bạn đã quan tâm đóng góp cho WellNexus! Đây là hướng dẫn chi tiết để giúp bạn bắt đầu.

---

## 📋 Mục lục

- [Thiết Lập Môi Trường](#-thiết-lập-môi-trường)
- [Quy Trình Phát Triển](#-quy-trình-phát-triển)
- [Pull Request Guidelines](#-pull-request-guidelines)
- [Commit Convention](#-commit-convention)
- [Testing Requirements](#-testing-requirements)
- [Code Standards](#-code-standards)
- [Câu Hỏi Thường Gặp](#-câu-hỏi-thường-gặp)

---

## 🛠️ Thiết Lập Môi Trường

### Yêu cầu hệ thống

- **Node.js:** 18+ (khuyến nghị 22+)
- **npm:** 9+ hoặc **pnpm:** 9+
- **Git:** Phiên bản mới nhất
- **Code editor:** VS Code (khuyến nghị)

### Các bước thiết lập

#### 1. Clone repository

```bash
git clone https://github.com/longtho638-jpg/Well.git
cd Well
```

#### 2. Cài đặt dependencies

```bash
# Sử dụng pnpm (khuyến nghị)
pnpm install

# Hoặc npm
npm install
```

#### 3. Cấu hình environment

```bash
# Copy file mẫu
cp .env.example .env.local

# Chỉnh sửa .env.local
code .env.local
```

**Biến môi trường BẮT BUỘC:**

```env
# Supabase (bắt buộc)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Resend Email (tùy chọn cho dev)
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini AI (tùy chọn cho dev)
VITE_GEMINI_API_KEY=<your-gemini-key>
```

**Lấy Supabase credentials:**

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project (hoặc tạo mới)
3. Settings → API
4. Copy `Project URL` → `VITE_SUPABASE_URL`
5. Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`

#### 4. Setup database

```bash
# Chạy migrations
npx supabase db push

# Hoặc tạo database schema thủ công:
# 1. Mở Supabase Dashboard → SQL Editor
# 2. Chạy các migration files trong supabase/migrations/
```

#### 5. Chạy development server

```bash
# Start dev server
npm run dev

# Mở browser tại http://localhost:5173
```

#### 6. Xác minh setup

```bash
# Chạy tests
npm run test:run

# Build project
npm run build

# Kiểm tra TypeScript
npm run typecheck
```

---

## 🔄 Quy Trình Phát Triển

### Branch Strategy

```
main            → Production-ready code
├── feature/*   → Tính năng mới (ví dụ: feature/auth-improvement)
├── bugfix/*    → Sửa bug (ví dụ: bugfix/login-redirect)
├── hotfix/*    → Sửa lỗi production khẩn cấp
└── docs/*      → Cập nhật tài liệu
```

### Workflow chi tiết

#### 1. Tạo feature branch

```bash
# Cập nhật main branch
git checkout main
git pull origin main

# Tạo branch mới
git checkout -b feature/ten-tinh-nang
```

**Đặt tên branch:**

| Loại | Format | Ví dụ |
|------|--------|-------|
| Feature | `feature/<mô-tả>` | `feature/oauth-login` |
| Bugfix | `bugfix/<mô-tả>` | `bugfix/wallet-balance` |
| Hotfix | `hotfix/<mô-tả>` | `hotfix/critical-auth` |
| Docs | `docs/<mô-tả>` | `docs/update-readme` |

#### 2. Phát triển tính năng

```bash
# Code với hot-reload
npm run dev

# Chạy tests trong watch mode
npm run test

# Type check khi lưu file
npm run typecheck
```

#### 3. Commit changes

```bash
# Stage changes
git add src/components/LoginForm.tsx
git add src/hooks/useAuth.ts

# Commit với message theo convention
git commit -m "feat(auth): add OAuth2 login support"
```

#### 4. Push và tạo Pull Request

```bash
# Push branch lên remote
git push -u origin feature/ten-tinh-nang

# Tạo PR từ GitHub UI
# Hoặc dùng CLI:
gh pr create --title "feat(auth): add OAuth2 login" --body "Description..."
```

---

## 📥 Pull Request Guidelines

### PR Checklist

Trước khi tạo PR, đảm bảo bạn đã kiểm tra:

- [ ] Code follows project style (eslint pass)
- [ ] Tests added/updated cho tính năng mới
- [ ] Documentation cập nhật (nếu cần)
- [ ] Không có console.log trong production code
- [ ] Không có commented-out code
- [ ] TypeScript compile thành công (0 errors)
- [ ] Build thành công (`npm run build`)
- [ ] Tests pass locally (`npm run test:run`)

### PR Template

```markdown
## Mô tả

<!-- Mô tả ngắn gọn những gì bạn đã làm -->

## Thay đổi chính

<!-- List các thay đổi chính -->

- Updated component X to handle Y
- Added new hook for Z
- Fixed bug #123

## Loại thay đổi

<!-- Đánh dấu loại thay đổi -->

- [ ] 🐛 Bug fix (non-breaking)
- [ ] ✨ New feature (non-breaking)
- [ ] 💥 Breaking change
- [ ] 📝 Documentation update
- [ ] 🧪 Tests only
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security fix

## Testing

<!-- Mô tả cách bạn đã test -->

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests pass

## Screenshots (nếu có)

<!-- Kéo thả screenshots vào đây -->

## Related Issues

<!-- Link đến các issues liên quan -->

Closes #123
Related to #456
```

### PR Review Process

1. **Tạo PR** → GitHub tự động chạy CI
2. **CI Pass** → Tests, build, lint phải thành công
3. **Code Review** → Maintainerson sẽ review code
4. **Address Comments** → Sửa theo góp ý
5. **Merge** → PR được merge vào main

**Thời gian review:** 1-3 ngày làm việc

---

## 📝 Commit Convention

Chúng tôi sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Khi nào dùng | Ví dụ |
|------|--------------|-------|
| `feat` | Tính năng mới | `feat(wallet): add transaction history` |
| `fix` | Sửa bug | `fix(auth): resolve logout redirect` |
| `docs` | Tài liệu | `docs(readme): update installation` |
| `style` | Code style (formatting) | `style(components): fix indentation` |
| `refactor` | Refactor code | `refactor(api): simplify error handling` |
| `test` | Thêm/sửa tests | `test(auth): add login test cases` |
| `chore` | Maintenance tasks | `chore(deps): update vitest` |
| `perf` | Performance improvements | `perf(render): lazy load components` |
| `ci` | CI/CD changes | `ci(workflow): add smoke tests` |

### Examples

```bash
# Feature mới
git commit -m "feat(subscription): add Pro plan upgrade flow"

# Sửa bug
git commit -m "fix(referral): correct 8-level commission calculation"

# Documentation
git commit -m "docs(readme): add Vietnamese translation"

# Refactor
git commit -m "refactor(api): extract error handling to middleware"
```

### Commit Message Guidelines

- **Subject line:** Tối đa 50 ký tự, viết thì hiện tại
- **Body:** Wrap ở 72 ký tự, giải thích **tại sao** không phải **cái gì**
- **Footer:** Link issues (Closes #123, Fixes #456)

---

## 🧪 Testing Requirements

### Test Coverage Requirements

| Module | Coverage Target |
|--------|-----------------|
| Utils | 90%+ |
| Services | 85%+ |
| Hooks | 80%+ |
| Components | 75%+ |
| Pages | 70%+ |
| **Overall** | **80%+** |

### Running Tests

```bash
# Chạy tất cả tests
npm run test:run

# Chạy với coverage report
npm run test:coverage

# Chạy specific test file
npm run test src/utils/commission.test.ts

# Chạy trong watch mode (dev)
npm run test
```

### Writing Tests

```typescript
// Example: commission.test.ts
import { calculateCommission } from './commission';

describe('calculateCommission', () => {
  it('should calculate 25% for level 1-6', () => {
    // Arrange
    const saleAmount = 1000000;
    const level = 1;

    // Act
    const commission = calculateCommission(saleAmount, level);

    // Assert
    expect(commission).toBe(250000);
  });

  it('should calculate 21% for level 8 (CTV)', () => {
    // Arrange
    const saleAmount = 1000000;
    const level = 8;

    // Act
    const commission = calculateCommission(saleAmount, level);

    // Assert
    expect(commission).toBe(210000);
  });
});
```

### Test File Naming

- Test files: `*.test.ts` hoặc `*.spec.ts`
- Test directories: `__tests__/` hoặc cùng folder với file được test
- Describe blocks: Mô tả chức năng đang test
- It blocks: Mô tả hành vi cụ thể

---

## 📐 Code Standards

### TypeScript

- **Strict mode:** Bật toàn bộ strict options
- **No `any` types:** Sử dụng proper types hoặc `unknown`
- **No `@ts-ignore`:** Fix type errors properly

```typescript
// ❌ BAD
function process(data: any) { ... }

// ✅ GOOD
interface UserData {
  id: string;
  name: string;
}

function process(data: UserData) { ... }
```

### File Organization

- **File size:** < 200 lines (split nếu lớn hơn)
- **File naming:** kebab-case (`user-profile.tsx`)
- **Component files:** PascalCase (`UserProfile.tsx`)
- **Utility files:** camelCase (`stringUtils.ts`)

### Code Style

```typescript
// ✅ Use 2-space indentation
// ✅ Semicolons required
// ✅ Single quotes for strings
// ✅ Trailing commas in multiline objects

const config = {
  apiUrl: 'https://api.wellnexus.vn',
  timeout: 5000,
};
```

### Imports

```typescript
// ✅ Order: React → Third-party → Internal → Styles
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import styles from './Component.module.css';
```

### Comments

```typescript
// ✅ Comment complex logic
/**
 * Calculate 8-level commission based on rank and sale amount
 * @param amount - Total sale amount in VND
 * @param level - Commission level (1-8)
 * @param rank - User rank (THIEN_LONG, DAI_SU, etc.)
 * @returns Commission amount in VND
 */
export function calculateCommission(
  amount: number,
  level: number,
  rank: string
): number {
  // Implementation...
}
```

---

## ❓ Câu Hỏi Thường Gặp

### Q: Làm sao để bắt đầu đóng góp?

**A:** Bắt đầu với [Good First Issues](https://github.com/longtho638-jpg/Well/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22). Đây là những issues đơn giản, phù hợp cho người mới.

### Q: Tôi gặp lỗi khi cài đặt dependencies?

**A:** Thử các bước sau:

```bash
# Xóa node_modules và lock file
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Install lại
npm install
```

### Q: Bao lâu thì PR được review?

**A:** Thông thường 1-3 ngày làm việc. Nếu lâu hơn, comment vào PR để tag maintainers.

### Q: Tôi có thể test code trên production không?

**A:** KHÔNG! Test code trên staging environment trước. Production chỉ dành cho released code.

### Q: Làm sao để join team contributors?

**A:** Sau khi có 3-5 PRs được merge, bạn có thể apply để trở thành contributor chính thức. Liên hệ maintainer qua email hoặc GitHub Discussions.

---

## 📧 Contact

| Mục | Liên hệ |
|-----|---------|
| 🐛 Bug reports | [GitHub Issues](https://github.com/longtho638-jpg/Well/issues) |
| 💬 General questions | [GitHub Discussions](https://github.com/longtho638-jpg/Well/discussions) |
| 📧 Email | contributors@wellnexus.vn |
| 💼 Security issues | security@wellnexus.vn |

---

## 🙏 Cảm Ơn Đóng Góp

Mọi đóng góp đều được ghi nhận trong:
- [Project Changelog](./docs/project-changelog.md)
- [GitHub Contributors](https://github.com/longtho638-jpg/Well/graphs/contributors)
- [Release Notes](https://github.com/longtho638-jpg/Well/releases)

**WellNexus là của cộng đồng, vì cộng đồng!** ❤️

---

**Cập nhật:** 2026-03-04 | **Version:** 3.0.0
