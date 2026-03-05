# CLAUDE.md - Well Distributor Portal

This file provides guidance to Claude Code when working with code in this repository.

## Role & Responsibilities

You are the **Worker Agent** for the Well project, receiving tasks from the **Admin Controller (Antigravity)**. Your role is to execute tasks using claudekit-engineer commands.

## Workflows

- Primary workflow: `./.claude/rules/primary-workflow.md`
- Development rules: `./.claude/rules/development-rules.md`
- Orchestration protocols: `./.claude/rules/orchestration-protocol.md`
- Documentation management: `./.claude/rules/documentation-management.md`

**IMPORTANT:** Analyze the skills catalog in `./.claude/skills/` and activate skills needed for the task.
**IMPORTANT:** Follow strictly the development rules in `./.claude/rules/development-rules.md`.

## Available Commands (claudekit-engineer)

Use these slash commands for efficient task execution:

| Command              | Description                    | Power |
| -------------------- | ------------------------------ | ----- |
| `/ck:cook:auto:fast` | Quick implement (trust me bro) | 1     |
| `/ck:plan:fast`      | No-research planning           | 2     |
| `/ck:fix:fast`       | Quick bug fix                  | 1     |
| `/ck:fix:test`       | Run tests & fix failures       | 2     |
| `/ck:git:cp`         | Commit & push                  | 0     |
| `/ck:docs:update`    | Update documentation           | 3     |
| `/ck:watzup`         | Wrap up work                   | 1     |

## Work Context

```
Work Context: /Users/macbookprom1/Well
Reports: /Users/macbookprom1/Well/plans/reports/
Plans: /Users/macbookprom1/Well/plans/
```

## Project Info

- **Project:** WellNexus Distributor Portal
- **Stack:** React, TypeScript, Vite, Zustand, Framer Motion
- **Design:** Aura Elite (Glassmorphism, dark gradients)
- **Deployment:** Vercel (wellnexus.vn)

## Development Principles

- **YAGNI**: You Aren't Gonna Need It - avoid over-engineering
- **KISS**: Keep It Simple, Stupid - prefer simple solutions
- **DRY**: Don't Repeat Yourself - eliminate code duplication

## [IMPORTANT] Before Any Task

1. Read `./README.md` for context
2. Check `./plans/` for existing work
3. Follow Aura Elite design patterns
4. Maintain TypeScript strict mode (0 errors)

## 🚨 CRITICAL RULES (MANDATORY - Added 2026-02-03)

### Rule 1: i18n SYNC PROTOCOL

**Khi thêm/sửa bất kỳ t('key') nào trong code:**

1. **PHẢI** kiểm tra key đó tồn tại trong cả `vi.ts` VÀ `en.ts`
2. **PHẢI** đảm bảo key path CHÍNH XÁC giữa code và translation files
3. **PHẢI** grep toàn bộ codebase tìm t() calls VÀ so sánh với locales
4. **KHÔNG ĐƯỢC** để hardcoded strings trong JSX - tất cả phải dùng t()
5. **SAU KHI FIX** - phải build + verify browser để confirm không còn raw keys

**Ví dụ BUG đã xảy ra:**

- Code dùng `t('landing.roadmap.stages.metropolis.name')`
- Nhưng `vi.ts` có `empire` thay vì `metropolis` → Raw key hiện trên production!

### Rule 2: PRODUCTION VERIFICATION PROTOCOL

**KHÔNG TIN BÁO CÁO - PHẢI XÁC THỰC!**

1. Sau mỗi deploy, PHẢI verify bằng browser thực tế
2. Check Console errors, Network tab, Visual rendering
3. Chỉ báo "DONE" khi đã XÁC THỰC bằng screenshot/video
4. Nếu CC CLI báo "success" nhưng site broken → FIX NGAY, không tin report

### Rule 3: SKILL ACTIVATION PROTOCOL

**PHẢI activate skills trước khi implement:**

1. Check `.claude/skills/` cho task hiện tại
2. Activate skill phù hợp (cook, i18n, testing, etc.)
3. Follow skill workflow CHÍNH XÁC

## Documentation

Keep docs updated in `./docs/` folder after major changes.


## 🔴 CẤM CI/CD POLLING LOOP (Added 2026-03-04)

**TUYỆT ĐỐI CẤM chạy while loop poll CI/CD status!**

Lý do: Vòng lặp `while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; gh run list...sleep 30; done` tốn ~12,500 tokens → context cháy 0% → crash.

**LUẬT:**
1. **CẤM** `while` loop poll `gh run list` hoặc bất kỳ CI/CD status check nào
2. **CHỈ ĐƯỢC** check CI/CD status **MỘT LẦN** duy nhất: `gh run list -L1 --json status,conclusion`
3. **SAU KHI** `git push`, báo cáo kết quả push và **DỪNG** — không poll
4. **CẤM** `sleep` trong bất kỳ loop nào — mỗi giây sleep = tokens lãng phí

```bash
# ❌ CẤM (burns 12K+ tokens):
MAX_ATTEMPTS=25; while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  STATUS=$(gh run list -L 1 --json status,conclusion); sleep 30
done

# ✅ ĐÚNG (chỉ 1 lần):
gh run list -L 1 --json status,conclusion -q ".[0]"
# Báo cáo kết quả và tiếp tục task khác
```



## 📜 HIẾN PHÁP ROIaaS — DNA TỐI THƯỢNG (BẮT BUỘC MỌI PHIÊN)

> **R = ROI = RaaS = ROIaaS** — Mọi dòng code phải quy đổi thành ROI.
> Chi tiết: `docs/HIEN_PHAP_ROIAAS.md` | Chiến lược: `docs/BINH_PHAP_MASTER.md`

**DUAL-STREAM BẮT BUỘC:** Mọi dự án PHẢI có 2 dòng doanh thu:
1. **Engineering ROI (Dev Key):** `RAAS_LICENSE_KEY` gate premium CLI/agents/models
2. **Operational ROI (User UI):** Subscription trên Web UI cho business users

**HƯ-THỰC (Binh Pháp Ch.6):**
- HƯ (Open): Source code, base patterns → Public GitHub, viral marketing
- THỰC (Closed): AI Brain, prod keys, trained models → Gated, thu tiền

**QUÂN LỆNH:** Mission nào không phục vụ ít nhất 1 dòng ROI → **REJECT**.

