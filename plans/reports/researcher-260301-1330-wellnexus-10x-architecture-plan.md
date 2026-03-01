# Báo cáo: WellNexus 10x Architecture Metamorphosis (Binh Pháp Ch.11)

**Mã số:** researcher-260301-1330-wellnexus-10x-architecture-plan
**Ngày:** 01/03/2026
**Tác giả:** Antigravity Planning Specialist
**Trạng thái:** Sẵn sàng thực thi

## 1. Phân tích hiện trạng (Codebase Scan)

### 1.1 Cấu trúc thư mục & Dependency
- **Framework:** React 19 + Vite + TypeScript.
- **State Management:** Zustand (đang chuyển dịch sang Vibe Agent Registry).
- **Backend:** Supabase (Auth, DB, Realtime).
- **AI Integration:** Vercel AI SDK (Google/OpenAI).
- **Kiến trúc lõi:** `src/lib/vibe-agent/` là "trái tim" mới, chứa các adapter cho 10+ kiến trúc hàng đầu (Temporal, Netdata, n8n, Biome, v.v.).

### 1.2 Nhận diện "Cửu Địa" (Ch.11)
- **Tán Địa (Scattered Ground):** Logic nghiệp vụ cũ (src/services/orderService.ts) đang rời rạc so với Vibe SDK mới.
- **Khinh Địa (Light Ground):** Các file pattern 10x (n8n, netdata, zx) đã có khung nhưng chưa được "wire-up" hoàn toàn vào UI.
- **Tử Địa (Deadly Ground):** Hệ thống billing và thanh toán (vibe-payment) - nơi sai sót dẫn đến tổn thất trực tiếp.

## 2. Chiến lược 10x: Netdata-Inspired Observability

Kiến trúc Netdata được ánh xạ vào `agent-metrics-collector-netdata-pattern.ts` để giải quyết vấn đề "Black Box" của Agent.

### 2.1 Thành phần lõi (Mapping)
- **Ring Buffer (Database):** Lưu trữ 300 data points/metric trong RAM (không tốn query database).
- **Dimensions:** Phân rã metric latency thành p50, p95, p99.
- **Health.d (Alarms):** Định nghĩa ngưỡng cảnh báo ngay trong code service (declarative alarms).

### 2.2 Tích hợp sâu
Mọi `BaseService` (từ Cal.com pattern) sẽ tự động ghi log vào `agentMetricsCollector` mỗi khi thực thi:
```typescript
// Ý tưởng tích hợp vào BaseService.ts
const start = performance.now();
try {
  const result = await this.implementation(input);
  agentMetricsCollector.record(`${this.constructor.name}.latency`, performance.now() - start);
  return result;
} catch (e) {
  agentMetricsCollector.record(`${this.constructor.name}.error-rate`, 1);
  throw e;
}
```

## 3. Lộ trình triển khai (Implementation Plan)

### Giai đoạn 1: Khởi tạo Metrics Lõi (Netdata Pattern)
- Kích hoạt `initDefaultAgentCharts()` trong `main.tsx`.
- Gắn collector vào `orderService.ts` và `authService.ts`.

### Giai đoạn 2: Durable Workflows (Temporal Pattern)
- Chuyển đổi quy trình Order (Create -> Pay -> Confirm) thành workflow có trạng thái trong `workflow-execution-context.ts`.
- Đảm bảo tính "Idempotency" (không trùng lặp) khi Supabase Realtime bị ngắt quãng.

### Giai đoạn 3: Credential & Isolation (n8n + Electron Pattern)
- Sử dụng `agentCredentialManager` để quản lý API Key của đối tác Well.
- Đóng gói logic Agent qua `vibeAgentBridge` để bảo mật lớp UI.

### Giai đoạn 4: Dashboard Observability
- Xây dựng UI Component `AgentStatusGrid` hiển thị các Chart từ Netdata pattern.
- Tích hợp `agentStatusPage` (Uptime-Kuma pattern) để hiển thị công khai tình trạng hệ thống.

## 4. Đánh giá rủi ro (Risk Assessment)
- **M1 Resource:** Việc giữ 300 data points cho 50+ metrics có thể tốn ~20MB RAM. Daemon cooling cần được giám sát chặt chẽ.
- **Type Safety:** Cần xóa bỏ hoàn toàn `any` trong `agent-registry` để tránh lỗi runtime khi chuyển đổi data.

### Critical Files for Implementation
- `src/lib/vibe-agent/agent-metrics-collector-netdata-pattern.ts`
- `src/lib/vibe-agent/index.ts`
- `src/lib/vibe-agent/services/base-service.ts`
- `src/services/orderService.ts`
