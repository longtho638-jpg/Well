# WellNexus COO SOPs — Quy Trinh Van Hanh Truong Dieu Hanh

> SOPs cho COO — tap trung VAN HANH, CHUOI CUNG UNG, CHAM SOC KHACH HANG, QUY TRINH.
> CEO SOPs: chien luoc. Founder SOPs: daily platform. COO SOPs: operations excellence.
> Cap nhat: 2026-03-03

---

## MUC LUC

1. [Van Hanh Hang Ngay](#1-van-hanh-hang-ngay)
2. [Quan Ly Don Hang](#2-quan-ly-don-hang)
3. [Chuoi Cung Ung](#3-chuoi-cung-ung)
4. [Cham Soc Khach Hang](#4-cham-soc-khach-hang)
5. [Quan Ly Partner Network](#5-quan-ly-partner-network)
6. [Chat Luong & SLA](#6-chat-luong--sla)
7. [Tu Dong Hoa Quy Trinh](#7-tu-dong-hoa-quy-trinh)
8. [Bao Cao Van Hanh](#8-bao-cao-van-hanh)

---

## 1. VAN HANH HANG NGAY

### 1.1 Daily Ops Checklist (7:30 - 8:30)

| # | Hanh dong | Cong cu | Uu tien |
|---|-----------|---------|---------|
| 1 | Kiem tra don hang moi qua dem | Admin Orders | P0 |
| 2 | Xu ly don hang pending > 24h | Admin Orders → Process | P0 |
| 3 | Kiem tra thanh toan PayOS | PayOS Dashboard | P0 |
| 4 | Review khieu nai khach hang | Email/Zalo/Hotline | P1 |
| 5 | Kiem tra ton kho san pham | Admin Products | P1 |
| 6 | Duyet yeu cau rut tien partner | Admin Finance | P1 |
| 7 | Cap nhat trang thai giao hang | Doi tac van chuyen | P2 |

### 1.2 Afternoon Check (14:00)

| # | Hanh dong |
|---|-----------|
| 1 | Follow up don hang dang giao |
| 2 | Xu ly don bi tra ve / hoan |
| 3 | Cap nhat partner co van de |
| 4 | Kiem tra SLA metrics |

### 1.3 End-of-Day (17:00)

| # | Hanh dong |
|---|-----------|
| 1 | Tong ket don hang trong ngay |
| 2 | Bao cao bat thuong cho CEO |
| 3 | Chuan bi checklist ngay mai |

---

## 2. QUAN LY DON HANG

### 2.1 Vong doi don hang

```
Khach dat hang → Pending
  → Thanh toan (COD/PayOS) → Confirmed
    → Dong goi → Processing
      → Giao hang → Shipping
        → Nhan hang → Completed
          → Commission tu dong tinh
```

### 2.2 Xu ly don hang

**Route:** `/admin/orders`

| Trang thai | Hanh dong COO | SLA |
|------------|---------------|-----|
| Pending | Xac nhan don, lien he KH neu can | < 2h |
| Confirmed | Chuyen kho dong goi | < 4h |
| Processing | Giao cho don vi van chuyen | < 24h |
| Shipping | Theo doi tracking | 2-5 ngay |
| Completed | Verify nhan hang, trigger commission | Auto |
| Cancelled | Tim ly do, lien he KH | < 2h |
| Returned | Xu ly hoan tien/doi tra | < 48h |

### 2.3 Xu ly don bi huy / tra hang

| Buoc | Hanh dong |
|------|-----------|
| 1 | Tiep nhan yeu cau huy/tra (email, Zalo, hotline) |
| 2 | Xac minh ly do (loi san pham, doi y, giao sai) |
| 3 | Phe duyet hoac tu choi |
| 4 | Huong dan KH gui tra (neu tra hang) |
| 5 | Nhan hang ve, kiem tra chat luong |
| 6 | Hoan tien hoac doi san pham |
| 7 | Cap nhat trang thai don → Returned/Cancelled |
| 8 | Ghi chep bao cao |

---

## 3. CHUOI CUNG UNG

### 3.1 Quan ly nha cung cap

| Hang muc | Quy trinh |
|----------|-----------|
| Danh gia NCC | Chat luong, gia, thoi gian giao, MOQ |
| Dat hang | PO → NCC xac nhan → Giao hang → Kiem tra |
| Thanh toan NCC | Theo hop dong (COD/chuyen khoan/30-60 ngay) |
| Danh gia dinh ky | Hang quy: chat luong, on-time delivery rate |

### 3.2 Quan ly ton kho

| Metric | Nguong | Hanh dong |
|--------|--------|-----------|
| Stock < Reorder Point | Canh bao | Dat hang bo sung |
| Stock = 0 | Khan cap | An san pham, dat hang gap |
| Stock > 3x ban binh quan | Du thua | Khuyen mai giam gia |
| San pham het han < 30 ngay | Canh bao | Flash sale hoac tra NCC |

### 3.3 Van chuyen & giao hang

| Doi tac | Khu vuc | Thoi gian | Chi phi |
|---------|---------|-----------|---------|
| GHN | Toan quoc | 2-5 ngay | 15-30K |
| GHTK | Toan quoc | 2-4 ngay | 15-25K |
| Grab Express | Noi thanh | 1-2h | 20-50K |
| Tu giao | Ban kinh 10km | Trong ngay | 0 |

### 3.4 KPI chuoi cung ung

| KPI | Muc tieu |
|-----|----------|
| On-time delivery rate | > 95% |
| Order accuracy | > 99% |
| Return rate | < 5% |
| Stock-out frequency | < 2%/thang |
| NCC on-time delivery | > 90% |

---

## 4. CHAM SOC KHACH HANG

### 4.1 Kenh ho tro

| Kenh | Thoi gian phan hoi | Nguoi phu trach |
|------|---------------------|-----------------|
| Zalo OA | < 30 phut (gio lam viec) | CS Team |
| Email | < 4h | CS Team |
| Hotline | Ngay | CS Team |
| Facebook | < 1h | Marketing + CS |
| In-app Copilot | Realtime (AI) | Auto |

### 4.2 Phan loai & xu ly khieu nai

| Muc do | Mo ta | SLA | Escalation |
|--------|-------|-----|------------|
| P0 | Mat tien, bao mat | < 1h | COO + CEO |
| P1 | Don hang sai/hong | < 4h | COO |
| P2 | Cham giao hang | < 24h | CS Lead |
| P3 | Hoi thong tin, gop y | < 48h | CS Team |

### 4.3 Flow xu ly khieu nai

| Buoc | Hanh dong |
|------|-----------|
| 1 | Tiep nhan & ghi nhan (ticket) |
| 2 | Phan loai muc do (P0-P3) |
| 3 | Phan cong xu ly |
| 4 | Lien he KH xac nhan van de |
| 5 | Giai quyet (hoan tien/doi/bu) |
| 6 | Thong bao KH ket qua |
| 7 | Follow up sau 3 ngay |
| 8 | Dong ticket + bao cao |

### 4.4 Chinh sach hoan tien

| Truong hop | Xu ly | Thoi gian |
|------------|-------|-----------|
| San pham loi/hong | Hoan 100% + doi moi | 3-5 ngay |
| Giao sai san pham | Doi dung + mien phi ship | 3-5 ngay |
| KH doi y (chua mo) | Hoan 100% - phi ship | 7-14 ngay |
| KH doi y (da mo) | Hoan 80% | 7-14 ngay |
| Giao cham > 7 ngay | Giam 10% don tiep | Ngay |

---

## 5. QUAN LY PARTNER NETWORK

### 5.1 Onboarding partner moi

| Ngay | Hanh dong |
|------|-----------|
| Ngay 1 | Gui Welcome kit (tai lieu, link, QR code) |
| Ngay 2-3 | Call 1:1 gioi thieu platform |
| Ngay 7 | Check: da mua hang chua? da gioi thieu ai? |
| Ngay 14 | Review hieu suat, ho tro neu can |
| Ngay 30 | Danh gia: active hay can can thiep |

### 5.2 Dao tao partner

| Chuong trinh | Noi dung | Hinh thuc |
|--------------|----------|-----------|
| Basic | Cach dung app, dat hang, chia se link | Video + PDF |
| Intermediate | Marketing tools, doi nhom, commission | Webinar |
| Advanced | Leadership, dao tao team, chien luoc | Workshop |
| Monthly update | San pham moi, chinh sach moi | Newsletter |

### 5.3 Quan ly partner inactive

| Tieu chi | Dinh nghia | Hanh dong |
|----------|------------|-----------|
| Warm | Khong giao dich 15-30 ngay | Nhac nho, uu dai |
| Cold | Khong giao dich 31-60 ngay | Call truc tiep |
| Dormant | Khong giao dich > 60 ngay | Win-back campaign |
| Churned | Khong phan hoi > 90 ngay | Archive, bao cao CEO |

---

## 6. CHAT LUONG & SLA

### 6.1 SLA noi bo

| Quy trinh | SLA | Do luong |
|-----------|-----|---------|
| Xu ly don hang | < 2h xac nhan | Admin Orders timestamp |
| Phan hoi KH | < 30 phut (gio lam viec) | CS tool tracking |
| Duyet rut tien | < 24h | Admin Finance |
| Xu ly khieu nai P0 | < 1h | Ticket system |
| Xu ly tra hang | < 48h | Order status |

### 6.2 Quality checklist (hang tuan)

| # | Kiem tra | Pass/Fail |
|---|---------|-----------|
| 1 | Tat ca don P0 xu ly dung SLA |  |
| 2 | Khong co don pending > 48h |  |
| 3 | Ti le hoan thanh don > 80% |  |
| 4 | Khong co san pham stock-out |  |
| 5 | CSAT score > 4.0/5 |  |

---

## 7. TU DONG HOA QUY TRINH

### 7.1 Da tu dong hoa

| Quy trinh | Cong cu | Trang thai |
|-----------|--------|------------|
| Commission calculation | Bee 2.0 engine | ✅ Auto |
| Email thong bao | Resend + Edge Functions | ✅ Auto |
| Rank upgrade | Business logic | ✅ Auto |
| AI action suggestions | Agent-OS | ✅ Auto |
| i18n validation | CI pipeline | ✅ Auto |

### 7.2 Can tu dong hoa (Roadmap)

| Quy trinh | Hien tai | Muc tieu |
|-----------|----------|----------|
| Dat hang NCC | Manual PO | Auto reorder khi < reorder point |
| Tracking giao hang | Manual update | API doi tac van chuyen |
| CS ticket routing | Manual | AI phan loai + routing |
| Partner inactive alert | Manual check | Auto email/SMS trigger |
| Bao cao hang ngay | Manual export | Auto dashboard email |

---

## 8. BAO CAO VAN HANH

### 8.1 Daily report (gui CEO 18:00)

```
=== DAILY OPS REPORT ===
Date: [YYYY-MM-DD]

Don hang: [new] moi | [completed] hoan thanh | [cancelled] huy
Doanh thu: [amount] VND
Rut tien: [approved]/[pending] yeu cau
CS tickets: [resolved]/[open]
Partner: [new] moi | [active] hoat dong
Van de: [issues if any]
```

### 8.2 Weekly report (gui CEO Thu 2)

| Metric | Tuan nay | Tuan truoc | % thay doi |
|--------|----------|------------|------------|
| Don hang moi |  |  |  |
| Doanh thu |  |  |  |
| Ti le hoan thanh |  |  |  |
| CSAT score |  |  |  |
| Partner moi |  |  |  |
| Khieu nai |  |  |  |

### 8.3 Monthly report

| Phan | Noi dung |
|------|----------|
| Executive summary | Tong quan thang |
| Operations metrics | Don hang, giao hang, tra hang |
| Customer metrics | CSAT, NPS, khieu nai |
| Partner metrics | Active, inactive, churn |
| Supply chain | Ton kho, NCC, chi phi |
| Issues & actions | Van de + ke hoach xu ly |
| Next month plan | Muc tieu + hanh dong |

---

## PHU LUC

### Lien ket SOPs khac

| Tai lieu | File |
|----------|------|
| CEO SOPs | `docs/ceo-sops.md` |
| Founder SOPs | `docs/founder-sops.md` |
| Admin SOPs | `docs/admin-sops.md` |
| User SOPs | `docs/user-sops.md` |
| Payment SOPs | `docs/payment-sops.md` |
