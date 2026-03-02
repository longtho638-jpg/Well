# WellNexus User SOPs — Quy Trinh Van Hanh Nguoi Dung

> SOPs cho TAT CA user flows (non-admin). Giao khach hang.

---

## 1. DANG KY TAI KHOAN

**Route:** `/signup` → `/confirm-email`

| Buoc | Hanh dong | Ket qua |
|------|-----------|---------|
| 1 | Truy cap wellnexus.vn/signup | Form dang ky hien thi |
| 2 | Nhap: Ho ten, Email, Mat khau, Ma gioi thieu (optional) | Validate realtime |
| 3 | Nhan "Dang Ky" | Chuyen den trang xac nhan email |
| 4 | Mo email, click link xac nhan | Tai khoan kich hoat |
| 5 | Dang nhap tai /login | Vao Dashboard |

**Luu y:**
- Mat khau toi thieu 8 ky tu
- Ma gioi thieu tu dong dien neu truy cap qua link `/ref/:id`
- Kiem tra spam folder neu khong nhan email

---

## 2. DANG NHAP / QUEN MAT KHAU

**Route:** `/login`, `/forgot-password`, `/reset-password`

| Buoc | Hanh dong |
|------|-----------|
| Dang nhap | Nhap email + mat khau → "Dang Nhap" |
| Quen MK | Click "Quen mat khau" → Nhap email → Check email → Dat lai |
| Reset MK | Click link trong email → Nhap mat khau moi → Xac nhan |

---

## 3. DASHBOARD CHINH

**Route:** `/dashboard`

Trang tong quan sau khi dang nhap. Hien thi:
- **HeroCard**: Tong doanh thu, hoa hong, rank hien tai
- **StatsGrid**: So lieu KPI (doanh so, doi nhom, vi)
- **RevenueBreakdown**: Bieu do doanh thu theo thang
- **DailyQuestHub**: Nhiem vu hang ngay de nhan thuong
- **AchievementGrid**: Thanh tuu da dat duoc
- **ValuationCard**: Dinh gia kinh doanh ca nhan

**Hanh dong nguoi dung:** Xem tong quan → Click vao tung muc de xem chi tiet

---

## 4. SAN GIAO DICH (MARKETPLACE)

**Route:** `/dashboard/marketplace`, `/dashboard/product/:id`

| Buoc | Hanh dong |
|------|-----------|
| 1 | Xem danh sach san pham |
| 2 | Loc theo gia, danh muc, AI goi y |
| 3 | Click san pham → Trang chi tiet |
| 4 | "Them vao gio" hoac "Mua Ngay" |
| 5 | Thanh toan tai `/checkout` |
| 6 | Xac nhan → `/checkout/success` |

**AI Recommendation:** He thong AI tu dong goi y san pham phu hop.

---

## 5. VI TIEN / RUT TIEN

**Route:** `/dashboard/withdrawal`

| Buoc | Hanh dong | Luu y |
|------|-----------|-------|
| 1 | Xem so du kha dung | Hien thi tren Withdrawal page |
| 2 | Nhap so tien rut | Toi thieu 2,000,000 VND |
| 3 | Nhap thong tin ngan hang | Ten NH, STK, Ten chu TK |
| 4 | Xac nhan rut tien | Gui yeu cau |
| 5 | Cho xu ly | 24-48 gio |

**Quick Amount:** Nut 25%, 50%, 75%, Max de chon nhanh.
**Chinh sach:** Xu ly trong 24-48 gio. Ten tai khoan phai khop voi ten dang ky.

---

## 6. GIOI THIEU BAN BE (REFERRAL)

**Route:** `/dashboard/referral`

| Buoc | Hanh dong |
|------|-----------|
| 1 | Lay link gioi thieu ca nhan |
| 2 | Chia se link qua Zalo, Facebook, etc. |
| 3 | Ban be dang ky qua link |
| 4 | Nhan hoa hong khi ban be mua hang |

**Commission:** Tu dong tinh theo cap bac (Member 21%, Startup 25%, ...).

---

## 7. MANG LUOI (NETWORK)

**Route:** `/dashboard/network`

Hien thi cay mang luoi doi nhom:
- So luong thanh vien truc tiep va gian tiep
- Doanh so doi nhom theo thang
- Bieu do mang luoi

---

## 8. DOI NHOM (TEAM)

**Route:** `/dashboard/team`

Quan ly doi nhom:
- Danh sach thanh vien
- Rank va doanh so tung nguoi
- Ho tro thanh vien (chat, Zalo)

---

## 9. KIEM TRA SUC KHOE (HEALTH CHECK)

**Route:** `/dashboard/health-check`, `/dashboard/health-coach`

| Buoc | Hanh dong |
|------|-----------|
| 1 | Lam bai kiem tra suc khoe (5 cau) |
| 2 | Xem ket qua diem so |
| 3 | Nhan goi y san pham AI |
| 4 | Ket noi tu van qua Zalo |

**Health Coach:** Tu van chuyen sau ve suc khoe + san pham phu hop.

---

## 10. BANG XEP HANG (LEADERBOARD)

**Route:** `/dashboard/leaderboard`

Xem vi tri cua minh trong bang xep hang:
- Doanh so ca nhan
- Doanh so doi nhom
- Rank progression

---

## 11. CONG CU MARKETING

**Route:** `/dashboard/marketing-tools`

Cac cong cu ho tro ban hang:
- **Affiliate Link Section**: Tao va chia se link ban hang
- **Gift Card**: Tao the qua tang
- **Marketing Materials**: Tai lieu quang cao

---

## 12. AI COPILOT

**Route:** `/dashboard/copilot`

Tro ly AI ho tro:
- Tra loi cau hoi ve san pham
- Goi y chien luoc ban hang
- Phan tich du lieu kinh doanh

---

## 13. GOI DICH VU (SUBSCRIPTION)

**Route:** `/dashboard/subscription`

| Buoc | Hanh dong |
|------|-----------|
| 1 | Xem cac goi (Starter/Growth/Premium/Master) |
| 2 | Chon goi phu hop |
| 3 | Thanh toan qua Polar.sh |
| 4 | Kich hoat tinh nang premium |

---

## 14. CAI DAT & HO SO

**Route:** `/dashboard/settings`, `/dashboard/profile`

- **Profile**: Cap nhat thong tin ca nhan, avatar
- **Settings**: Cai dat ngon ngu (VI/EN), thong bao, bao mat

---

## 15. TRANG CONG KHAI

| Route | Muc dich |
|-------|---------|
| `/` | Landing page — gioi thieu WellNexus |
| `/venture` | Thong tin co hoi kinh doanh |
| `/ref/:id` | Link gioi thieu — tu dong dien ma khi dang ky |

---

## LUU Y CHUNG

1. **Ngon ngu**: Chuyen doi VI/EN tai Settings
2. **Bao mat**: Dang xuat tu dong sau 2 gio khong hoat dong
3. **Ho tro**: Lien he qua Zalo hoac AI Copilot
4. **Mobile**: Responsive — hoat dong tren moi thiet bi
