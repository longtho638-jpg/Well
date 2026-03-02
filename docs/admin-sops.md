# WellNexus Admin SOPs — Quy Trinh Van Hanh Quan Tri

> SOPs cho TAT CA admin flows. Chi danh cho admin (VITE_ADMIN_EMAILS whitelist).
> Route goc: `/admin` — bao ve boi `AdminRoute` component.

---

## TRUY CAP ADMIN

**Dieu kien:** Email dang nhap nam trong `VITE_ADMIN_EMAILS` (env var, case-insensitive).
**Backend:** Supabase RLS kiem tra role `admin`/`super_admin` — client-side check chi la UX gate.

| Buoc | Hanh dong |
|------|-----------|
| 1 | Dang nhap tai `/login` voi email admin |
| 2 | He thong tu dong nhan dien → hien nut Admin |
| 3 | Truy cap `/admin` → Admin Mission Control |

**Sidebar Navigation:** 8 module — Overview, CMS, Partners, Finance, Orders, Products, Policy Engine, Audit Log.

---

## 1. OVERVIEW (MISSION CONTROL)

**Route:** `/admin` (index)

Trang tong quan he thong. Hien thi:

| Metric | Mo ta |
|--------|-------|
| Global GMV | Tong doanh thu toan he thong |
| Active Bee Force | So luong partner dang hoat dong |
| AI Signal Pending | So luong action can xu ly |
| Ecosystem SLA | % uptime he thong |

**AI Action Center:**
- He thong AI tu dong de xuat hanh dong (approve/reject)
- Admin click Approve hoac Reject tren tung de xuat
- Khi het action → hien "Queue Exhausted"

**Live Pulse:**
- Bieu do tang truong realtime (AreaChart)
- Event log: AI scan, Policy lock, Security status

**Hanh dong admin:** Xem tong quan → Xu ly AI actions → Chuyen sang module cu the

---

## 2. CMS (CONTENT MANAGEMENT)

**Route:** `/admin/cms`

Quan ly noi dung da kenh voi 3 tab:

### 2.1 Banners

| Buoc | Hanh dong |
|------|-----------|
| 1 | Tab "Banners" → Danh sach banner hien tai |
| 2 | Click "Create Banner" → Form: title, subtitle, CTA text, CTA link, image URL, location, status |
| 3 | Chon location: `promotion` |
| 4 | Chon status: `draft` hoac `active` |
| 5 | Luu → Banner xuat hien tren Marketplace/Landing |

**Thao tac:** Sua (edit), Xoa (delete), Tim kiem theo ten.

### 2.2 Announcements (Thong bao)

| Buoc | Hanh dong |
|------|-----------|
| 1 | Tab "Announcements" → Danh sach thong bao |
| 2 | Click "Create Announcement" → Form: title, message, type (info/warning/error), target (all/partners), status |
| 3 | Toggle status: draft ↔ active |
| 4 | Xoa thong bao khong con can |

### 2.3 Templates (Mau email)

| Buoc | Hanh dong |
|------|-----------|
| 1 | Tab "Templates" → Danh sach email template |
| 2 | Xem template co san (read-only) |

**Stats dashboard:** Content Banners, Live Banners, Broadcasts, Total Templates.

---

## 3. PARTNERS (DOI TAC CRM)

**Route:** `/admin/partners`

Quan ly toan bo mang luoi doi tac (Bee Force).

### 3.1 Xem & Loc

| Buoc | Hanh dong |
|------|-----------|
| 1 | Xem danh sach partners voi stats: Total Nodes, Active, Growth |
| 2 | Tim kiem theo ten/email |
| 3 | Loc theo trang thai: All, Active, Inactive |
| 4 | Click partner → Modal chi tiet |

### 3.2 Thao tac don le

| Hanh dong | Mo ta |
|-----------|-------|
| Xem chi tiet | Modal: thong tin, rank, doanh so, doi nhom |
| Cap nhat | Sua thong tin partner (ten, trang thai, rank) |

### 3.3 Thao tac hang loat (Bulk Actions)

| Buoc | Hanh dong |
|------|-----------|
| 1 | Tick chon nhieu partner (checkbox) |
| 2 | Thanh Bulk Actions hien len (sticky) |
| 3 | Chon action: Activate / Deactivate / Export |
| 4 | Xac nhan → Thuc hien hang loat |

---

## 4. FINANCE (TAI CHINH)

**Route:** `/admin/finance`

Quan ly tai chinh: doanh thu, chi tra, giao dich.

### 4.1 Dashboard

| Metric | Mo ta |
|--------|-------|
| Revenue Inflow | Tong doanh thu vao |
| Treasury Payout | Tong chi tra ra |
| Pending | Giao dich cho xu ly |

### 4.2 Duyet giao dich

| Buoc | Hanh dong |
|------|-----------|
| 1 | Chon tab: "Revenue Inflow" hoac "Treasury Payout" |
| 2 | Loc theo rui ro: All / Security Passed / Quarantined |
| 3 | Xem tung giao dich: ID, loai, partner, so tien, trang thai, fraud score |
| 4 | Click "Approve" hoac "Reject" tren tung giao dich |
| 5 | Batch Approve: Click "Security Batch Commit" de duyet tat ca giao dich safe |

### 4.3 Export bao cao

| Buoc | Hanh dong |
|------|-----------|
| 1 | Click "Export CSV" |
| 2 | File CSV download: ID, Type, Partner, Amount, Status, Risk Score, Date |
| 3 | Ten file: `WellNexus_Treasury_YYYY-MM-DD.csv` |

---

## 5. ORDERS (QUAN LY DON HANG)

**Route:** `/admin/orders`

Duyet don hang va kich hoat hoa hong.

### 5.1 Dashboard

| Metric | Mo ta |
|--------|-------|
| Pending Orders | So don cho duyet |
| Total Value | Tong gia tri don cho |
| Est. Commission | Uoc tinh hoa hong |

### 5.2 Duyet don hang

| Buoc | Hanh dong |
|------|-----------|
| 1 | Xem danh sach don hang pending |
| 2 | Xem chi tiet: khach hang, san pham, so tien, hinh chung chuyen |
| 3 | Click "Xem bill" → Modal hinh anh chung chuyen |
| 4 | Click "Approve" → Don hoan tat, hoa hong kich hoat |
| 5 | Hoac Click "Reject" → Don bi tu choi |

**Quy tac an toan:** KHONG BAO GIO approve don khong co bank clearance xac nhan.

### 5.3 Xu ly backend

- Approve → `orderService.updateOrderStatus(id, 'completed')` → Event `well:order.completed`
- Reject → `orderService.updateOrderStatus(id, 'cancelled')` → Event `well:order.cancelled`
- Hoa hong tu dong tinh khi don `completed`

---

## 6. PRODUCTS (SAN PHAM)

**Route:** `/admin/products`

Quan ly catalog san pham va thong so DTTT (hoa hong).

### 6.1 Dashboard

| Metric | Mo ta |
|--------|-------|
| Total Inventory | Tong so san pham |
| Low Stock Alert | San pham sap het hang |
| Depleted Units | San pham het hang |

### 6.2 Quan ly san pham

| Buoc | Hanh dong |
|------|-----------|
| 1 | Tim kiem theo ten hoac SKU |
| 2 | Click "Edit" → Form inline: ten, gia, ton kho, DTTT |
| 3 | Sua xong → "Save" |
| 4 | Click "Delete" → Xoa san pham |
| 5 | Click "Add Product" → Tao san pham moi |

**DTTT Commission Logic:**
- DTTT = Don Tinh Thanh Toan (gia tri tinh hoa hong)
- Hoa hong theo cap bac: Member 21%, Startup 25%, ...
- Sua DTTT → anh huong truc tiep den hoa hong partner

---

## 7. POLICY ENGINE (CHIEN LUOC)

**Route:** `/admin/policy-engine`

Cau hinh chinh sach hoa hong, rank, va automation.

### 7.1 Commission Section

| Hanh dong | Mo ta |
|-----------|-------|
| Xem bang hoa hong | Ty le hoa hong theo rank |
| Dieu chinh ty le | Sua % hoa hong tung cap bac |

### 7.2 Bee Automation Section

| Hanh dong | Mo ta |
|-----------|-------|
| Cau hinh AI agent | Bat/tat automation |
| Dieu chinh thong so | Nguong tu dong xu ly |

### 7.3 Rank Ladder Section

| Hanh dong | Mo ta |
|-----------|-------|
| Xem bang rank | Dieu kien thang hang tung cap |
| Sua dieu kien | Doanh so ca nhan, doi nhom, so luong F1 |

### 7.4 Simulation Panel

| Buoc | Hanh dong |
|------|-----------|
| 1 | Nhap thong so gia dinh (doanh so, so F1, etc.) |
| 2 | Xem ket qua mo phong realtime |
| 3 | Dieu chinh cho den khi hai long |
| 4 | Click "Commit Configuration" → Luu chinh sach |

**Bao mat:** Policy changes duoc ky so (cryptographically signed). Moi thay doi ghi vao Audit Log.

---

## 8. AUDIT LOG (NHAT KY KIEM TOAN)

**Route:** `/admin/audit-log`

Nhat ky bat bien cho compliance va bao mat.

### 8.1 Dashboard

| Metric | Mo ta |
|--------|-------|
| Event Total | Tong so su kien |
| Today | Su kien hom nay |
| Unique Auth | So admin duy nhat |
| Policy Mods | So lan sua chinh sach |

### 8.2 Tim kiem & Loc

| Buoc | Hanh dong |
|------|-----------|
| 1 | Tim kiem theo ten admin hoac resource ID |
| 2 | Loc theo action: approve, reject, policy change, etc. |
| 3 | Loc theo admin cu the |
| 4 | Click vao dong → Inspector panel chi tiet |

### 8.3 Export

| Buoc | Hanh dong |
|------|-----------|
| 1 | Click "Export Dataset" |
| 2 | File CSV: Timestamp, Admin, Action, Resource, Details |
| 3 | Ten file: `WellNexus_AuditLog_YYYY-MM-DD.csv` |

**Ghi nhat ky tu dong:** Moi thao tac admin (approve/reject order, sua policy, sua partner) deu duoc log.

---

## 9. DUYET RUT TIEN (WITHDRAWAL ADMIN)

**Trong Finance module** — Admin duyet yeu cau rut tien tu partner.

| Buoc | Hanh dong | Ket qua |
|------|-----------|---------|
| 1 | Xem danh sach withdrawal requests (pending) | Hien thi ten, email, so tien, ngan hang |
| 2 | Kiem tra thong tin ngan hang | Ten TK phai khop ten dang ky |
| 3 | Click "Approve" | RPC `process_withdrawal_request` xu ly |
| 4 | Hoac Click "Reject" + ghi ly do | Email thong bao tu dong gui cho user |
| 5 | Sau khi chuyen khoan xong → "Complete" | Status → `completed` |

**Xu ly backend:**
- Approve → `process_withdrawal_request` RPC → Tru so du + Tao transaction
- Email tu dong gui: Approval hoac Rejection (co ly do)
- Moi thao tac ghi vao Audit Log

---

## BAO MAT ADMIN

| Lop | Mo ta |
|-----|-------|
| Client-side | `VITE_ADMIN_EMAILS` whitelist → `AdminRoute` component |
| Server-side | Supabase RLS kiem tra `role = 'admin'` tren moi query |
| Session | Secure session indicator tren header |
| Audit | Moi hanh dong ghi vao audit_log table |
| RPC | Thao tac nhay cam (withdrawal, policy) qua stored procedure |

---

## LUU Y CHUNG

1. **Quyen truy cap**: Chi email trong VITE_ADMIN_EMAILS moi vao duoc `/admin`
2. **Moi thao tac deu duoc ghi log**: Audit trail bat bien cho compliance
3. **Export CSV**: Co san o Finance va Audit Log
4. **Policy changes**: Ky so + ghi log truoc khi ap dung
5. **Withdrawal**: LUON kiem tra bank clearance truoc khi approve
6. **Responsive**: Admin panel ho tro mobile voi sidebar drawer
