# 10x Deep Scan & Tech Debt Eradication Plan

## Mục tiêu
Thực hiện DEEP 10x SCAN toàn bộ dự án Well, tìm và triệt tiêu mọi nợ kỹ thuật (TODO, FIXME, HACK, dead code, circular deps). 
Đặc biệt tập trung:
- hooks, stores, context, types, pages, components, utils, config
- i18n translations
- Supabase error handling

**Quy tắc:** Chỉ sửa TỐI ĐA 5 file. Nếu nhiều hơn, báo cáo phần còn lại.

## Các bước thực hiện
- [ ] 1. Khảo sát codebase (Deep Scan) bằng subagents và grep.
  - [ ] Tìm TODO/FIXME/HACK.
  - [ ] Quét Supabase error handling.
  - [ ] Quét i18n translations missing/hardcoded.
  - [ ] Quét dead code và circular dependencies (cơ bản).
- [ ] 2. Tổng hợp danh sách Top 5 file nợ kỹ thuật nghiêm trọng nhất cần fix ngay (ưu tiên hooks/stores/context, Supabase, i18n).
- [ ] 3. Tiến hành fix triệt để nguyên nhân gốc rễ trên 5 file này.
- [ ] 4. Verification: Chạy test, type check, linting để đảm bảo không gãy code.
- [ ] 5. Cập nhật `tasks/lessons.md` với bài học rút ra sau khi fix.
- [ ] 6. Báo cáo danh sách các file nợ kỹ thuật còn lại (nếu có).
