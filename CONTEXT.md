# PROJECT: WELLNEXUS (VIBE CODING EDITION)

**Version:** 0.1 (Bootstrap / No-Engineer Mode)
**Architecture:** Serverless Agentic HealthFi
**Philosophy:** Sun Tzu + Honeycomb + Blue Ocean

## 1. TECH STACK (NON-NEGOTIABLE)

Chúng ta sử dụng bộ công cụ "Zero-Ops" để một người có thể cân cả hệ thống:

  * **IDE/Assistant:** Gemini CLI / Antigravity (Google).
  * **Frontend:** Next.js 14 (App Router) -> Deploy **Vercel**.
  * **Backend/Database:** **Supabase** (Postgres, Auth, Realtime, Edge Functions).
  * **Background Workers:** **Render.com** (Python/Node scripts cho tính toán hoa hồng phức tạp).
  * **Transactional Email:** **Resend.com**.
  * **Blockchain (Lite):** Supabase Ledger (Giai đoạn 1) -> Polygon Private (Giai đoạn 2).

## 2. SYSTEM ARCHITECTURE (DUAL-ENTITY LOGIC)

Hệ thống phải tách bạch logic để đảm bảo pháp lý (Dual-Entity):

1.  **Entity A (Trading):** Xử lý Tiền thật (VND), Đơn hàng, Ship hàng.
2.  **Entity B (Tech/Loyalty):** Xử lý Point, Token, Gamification, Agentic AI.

## 3. DATABASE SCHEMA (SUPABASE POSTGRES)

*Copy đoạn này vào Gemini và bảo nó: "Generate SQL migration file for Supabase based on this schema"*

### A. Core Users (Honeycomb Structure)

  * **`profiles`**:
      * `id` (uuid, ref auth.users)
      * `role` (enum: 'founder', 'distributor', 'customer')
      * `referral_code` (unique string)
      * `sponsor_id` (uuid, recursive ref to profiles - *Người bảo trợ*)
      * `honeycomb_id` (uuid - *Thuộc tổ ong nào*)
      * `status` (active/churn_risk/banned)
      * `risk_score` (int 0-100 - *Do Agent tính*)

### B. Commerce (Entity A)

  * **`products`**: `id`, `name`, `price_vnd`, `margin_vnd` (lãi gộp), `inventory`.
  * **`orders`**: `id`, `user_id`, `total_vnd`, `status`, `payment_proof_url`.

### C. HealthFi & Loyalty (Entity B - Web3 Lite)

  * **`wallets`**:
      * `user_id` (uuid)
      * `point_balance` (bigint - *Nexus Points*)
      * `pending_cashback` (bigint)
      * `wallet_address` (string - *Địa chỉ ví ảo*)
  * **`transactions`**:
      * `type` (enum: 'earn_mining', 'cashback', 'redeem')
      * `amount` (int)
      * `hash` (string - *giả lập hash blockchain*)

## 4. AGENTIC WORKFLOWS (THE BRAINS)

Các logic này sẽ chạy bằng **Supabase Edge Functions** hoặc **Render Cron Jobs**.

### Agent 1: Growth Sentinel (Sun Tzu Bot)

  * **Trigger:** Cronjob chạy mỗi sáng 08:00 AM.
  * **Logic:**
      * Quét bảng `orders` và `activity_logs`.
      * IF `last_login` > 3 days AND `last_order` > 30 days:
          * SET `profiles.status` = 'churn_risk'.
          * CALL Resend API -> Gửi email: "Subject: Chị [Name] ơi, khách hàng đang đợi..."
  * **File path:** `supabase/functions/agent-growth-sentinel/index.ts`

### Agent 2: The Bee (Reward Engine)

  * **Trigger:** Database Webhook (Khi có row mới trong `orders` với status='completed').
  * **Logic:**
      * Lấy `order.total_vnd`.
      * Tính điểm: `points = total_vnd * 0.05` (5%).
      * INSERT vào bảng `transactions`.
      * UPDATE `wallets.point_balance`.
      * Gửi Notif về App: "Ting ting! Bạn vừa đào được [X] Points."
  * **File path:** `supabase/functions/agent-reward/index.ts`

### Agent 3: The Guardian (Compliance)

  * **Trigger:** Khi user submit nội dung (bài đăng/comment).
  * **Logic:**
      * Dùng Gemini API (trong code) để check text.
      * Prompt: *"Does this text contain MLM forbidden words like 'lãi suất cam kết', 'đầu tư bao lời'?"*
      * IF Yes -> Reject insert -> Return Error "Vi phạm điều khoản cộng đồng".
  * **File path:** `supabase/functions/agent-guardian/index.ts`

## 5. DIRECTORY STRUCTURE (NEXT.JS)

Cấu trúc thư mục để Gemini biết nơi gen code:

```
/wellnexus-vibe
├── app/
│   ├── (auth)/          # Login/Register UI
│   ├── (dashboard)/     # Panel cho NPP (Xem hoa hồng, Cây hệ thống)
│   ├── api/             # Next.js API Routes (Gọi sang Render/Supabase)
│   └── shop/            # Giao diện mua hàng
├── lib/
│   ├── supabase/        # Supabase Client
│   ├── agents/          # Các hàm gọi AI (Growth, Guardian prompts)
│   └── utils/           # Hàm tính toán MLM (Helper)
├── supabase/
│   ├── functions/       # Nơi chứa code của 3 Agent trên
│   └── migrations/      # SQL tạo bảng
└── prompts/             # Lưu các prompt mẫu để dùng lại
```

-----

# HƯỚNG DẪN THỰC THI (COPY & PASTE VÀO GEMINI CLI)

Đây là các "lệnh thần chú" để bạn bắt đầu ngay bây giờ:

### Giai đoạn 1: Dựng khung (10 phút)

**Lệnh cho Gemini:**

> "I am building WellNexus based on the `CONTEXT.md` file above.
>
> 1.  Initialize a Next.js 14 project with Tailwind CSS and TypeScript.
> 2.  Create the folder structure exactly as defined in Section 5.
> 3.  Write the `schema.sql` file for Supabase based on Section 3. Ensure RLS (Row Level Security) policies allow users to only see their own data."

### Giai đoạn 2: Kết nối Supabase & Auth (30 phút)

**Lệnh cho Gemini:**

> "Generate a `lib/supabase/client.ts` file. Then, create a detailed Login page in `app/(auth)/login/page.tsx` using Supabase Auth (Magic Link). Style it with Tailwind, make it look clean and trustworthy (HealthTech vibe)."

### Giai đoạn 3: Viết Agent "The Bee" (Quan trọng nhất)

**Lệnh cho Gemini:**

> "Let's code the Reward Agent.
>
> 1.  Create a Supabase Edge Function `supabase/functions/agent-reward`.
> 2.  It should listen to a webhook from the `orders` table.
> 3.  When `status` changes to 'completed', calculate 5% of `total_vnd`.
> 4.  Update the `wallets` table and log a transaction.
> 5.  Use Resend to send an email notification to the user saying 'You earned points!'.
>     Provide the full TypeScript code."

### Giai đoạn 4: Dashboard quản lý (Tổ Ong)

**Lệnh cho Gemini:**

> "Build the Dashboard for a Distributor (NPP).
>
> 1.  In `app/(dashboard)/page.tsx`, fetch data from `wallets` and `network_tree`.
> 2.  Display a card showing 'Total Nexus Points' and 'Current Rank'.
> 3.  Display a list of their downline (F1) from `profiles` table.
> 4.  Use a chart library (Recharts) to show their point growth over the last 30 days."

-----

## CURRENT PROJECT STATUS (As of 2024-12-03)

**✅ COMPLETED:**
- Supabase integration with production database
- Agent-OS framework (22 agents: 2 custom + 20 ClaudeKit)
- Real-time KPI tracking
- Agent Dashboard UI
- Vercel deployment pipeline
- Database schema (6 tables with RLS policies)

**🎯 ARCHITECTURE ALIGNMENT:**
The current codebase already implements many concepts from this context:
- ✅ Supabase backend
- ✅ Agent-based architecture (GeminiCoachAgent, SalesCopilotAgent)
- ✅ Real-time features (via Zustand + planned Supabase subscriptions)
- ✅ Vercel deployment

**📋 NEXT STEPS (To align with this CONTEXT):**
1. Migrate current React/Vite app to Next.js 14 (if needed)
2. Implement "The Bee" reward engine
3. Add "Growth Sentinel" churn detection
4. Build Honeycomb network tree visualization
5. Integrate Resend for transactional emails

**🔗 REFERENCES:**
- Supabase URL: https://zumgrvmwmpstsigefuau.supabase.co
- Vercel Project: well
- GitHub: https://github.com/longtho638-jpg/Well

-----

**LƯU Ý CUỐI CÙNG CHO VIBE CODING:**

1.  **Gặp lỗi?** Copy nguyên lỗi đó dán vào Gemini, thêm câu: *"Fix this for me, explain why it broke."*
2.  **Đừng tự viết CSS:** Hãy bảo Gemini *"Make it look like Apple Health app, minimal and white"* (Làm cho nó giống app Apple Health, tối giản và trắng).
3.  **Deploy:** Khi code xong logic nào, gõ `git push`. Vercel sẽ lo phần còn lại.
