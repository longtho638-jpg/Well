# Researcher Report: Well RaaS Production Requirements & Binh Phap Verification

## Summary
Nghiên cứu yêu cầu triển khai production, cấu hình môi trường và các quy tắc "GREEN" Binh Phap cho dự án Well RaaS.

## 1. Production Requirements
- **Hosting Platform**: Vercel (Primary: `wellnexus.vn`).
- **Framework Stack**: React 19, TypeScript 5.9.3, Vite 7.3.1.
- **Backend Service**: Supabase (URL: `jcbahdioqoepvoliplqy.supabase.co`).
- **Build Command**: `npm run build` (Injected `NODE_OPTIONS=--max-old-space-size=4096`).
- **Output Directory**: `dist`.
- **Quality Gates**:
  - 0 TypeScript errors.
  - 349+ tests passing (`npm run test:run`).
  - Lint check passing (`npm run lint`).
  - i18n validation passing (`npm run i18n:validate`).

## 2. Environment Configuration (Vercel/Local)
Các biến môi trường BẮT BUỘC phải cấu hình trên Vercel:
- `VITE_SUPABASE_URL`: URL của project Supabase.
- `VITE_SUPABASE_ANON_KEY`: Anon/public key từ Supabase.
- `VITE_API_URL`: Base URL cho API.
- `VITE_ADMIN_EMAILS`: Danh sách email admin (phân cách bằng dấu phẩy).
- `VITE_SENTRY_DSN`: (Optional) DSN cho Sentry error tracking.

**Supabase Edge Functions Secrets**:
- `RESEND_API_KEY`: Key cho dịch vụ email Resend.

## 3. "GREEN" Binh Pháp CI/CD Rules
Tuân thủ nghiêm ngặt `binh-phap-cicd.md` và `CLAUDE.md` của project:

### Rule #0: KHÔNG BÁO "DONE" KHI CHƯA GREEN
- Tuyệt đối cấm pattern "Push and Done".
- Chỉ báo hoàn thành sau khi verify site sống và hoạt động đúng.

### Mandatory Verification Pipeline (3 Bước)
1. **CI/CD Status**: Poll GitHub Actions cho đến khi báo `success` (timeout 5p).
2. **Vercel Deploy Check**: `curl -sI https://wellnexus.vn` phải trả về HTTP 200.
3. **Smoke Test**: Verify visual và chức năng chính bằng browser thực tế.

### BANNED Actions
- ❌ CẤM dùng `vercel --prod` hoặc `vercel deploy`.
- ✅ CHỈ dùng `git push origin main` để trigger pipeline tự động.

### Required Report Format
```markdown
## Verification Report
- Build: ✅ exit code 0
- Tests: ✅ [N] tests passed
- Git Push: ✅ [commit_hash] → main
- CI/CD: ✅ GitHub Actions [status] [conclusion]
- Deploy: ✅ Vercel [URL] [ready_state]
- Production: ✅ HTTP [status_code]
- Timestamp: [actual_time]
```

## 4. Well-Specific Rules (Added 2026-02-03)
- **i18n Sync Protocol**: Kiểm tra key tồn tại trong cả `vi.ts` và `en.ts`. Không để hardcoded strings.
- **Visual Verification**: Phải có screenshot/video xác nhận site hoạt động (không màn hình đen) trước khi báo Done.

## Unresolved Questions
- Link GitHub Repo chính thức của Well (trong `binh-phap-cicd.md` đang để ví dụ là `sophia-ai-factory`). Cần xác nhận repo phục vụ việc poll `gh run list`.
- Danh sách URL staging để chạy preview test trước khi merge vào main.
