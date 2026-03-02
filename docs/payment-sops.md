# WellNexus Payment SOPs — Quy Trinh Thanh Toan

> SOPs chi tiet cho TAT CA payment flows. Giao khach hang.
> Payment provider: **PayOS** (QR code banking + COD)

---

## 1. THANH TOAN DON HANG (MARKETPLACE CHECKOUT)

**Route:** `/checkout` → `/checkout/success`

### 1.1 Flow COD (Thanh toan khi nhan hang)

| Buoc | Hanh dong | Ket qua |
|------|-----------|---------|
| 1 | Them san pham vao gio hang tai Marketplace | Gio hang cap nhat |
| 2 | Click "Thanh Toan" → chuyen den `/checkout` | Form checkout hien thi |
| 3 | Nhap thong tin khach: Ho ten, SDT, Email, Dia chi | Validate realtime |
| 4 | Chon phuong thuc "Thanh toan khi nhan hang (COD)" | Radio button active |
| 5 | Nhan "Dat Hang" | Don hang tao → chuyen `/checkout/success` |
| 6 | Nhan email xac nhan don hang (neu co email) | Email tu dong gui |

**Luu y:**
- Khong can dang nhap — guest checkout
- Dia chi gom: Duong, Phuong/Xa, Quan/Huyen, Tinh/TP
- Don hang luu vao `transactions` table voi status `pending`

### 1.2 Flow PayOS (Chuyen khoan QR)

| Buoc | Hanh dong | Ket qua |
|------|-----------|---------|
| 1 | Them san pham vao gio hang tai Marketplace | Gio hang cap nhat |
| 2 | Click "Thanh Toan" → chuyen den `/checkout` | Form checkout hien thi |
| 3 | Nhap thong tin khach hang | Validate realtime |
| 4 | Chon phuong thuc "Chuyen khoan ngan hang" | Radio button active |
| 5 | Nhan "Dat Hang" | Modal QR Payment hien thi |
| 6 | Mo app ngan hang → Quet ma QR | Chuyen khoan thanh cong |
| 7 | He thong tu dong kiem tra (poll moi 3 giay) | Khi PayOS xac nhan PAID → hien thanh cong |
| 8 | Chuyen tu dong sang `/checkout/success` | Don hang hoan tat |

**QR Payment Modal:**
- Hien thi: Ma QR, So tien, Ma don hang, Thoi gian con lai
- Thoi gian het han: **10 phut** (600 giay countdown)
- Tu dong poll PayOS status moi 3 giay
- Trang thai: `pending` → `success` hoac `failed`/`cancelled`
- Neu het thoi gian → tu dong bao "Payment expired"
- Dong modal khi dang cho → hoi xac nhan truoc khi huy

**Xu ly loi:**
- PayOS khong tao duoc link → Thong bao loi, quay lai checkout
- Thanh toan that bai → Hien icon X do, thong bao that bai
- Circuit breaker bao ve: neu PayOS loi nhieu lan → tu dong cat

---

## 2. DANG KY GOI DICH VU (SUBSCRIPTION)

**Route:** `/dashboard/subscription`

### 2.1 Cac goi dich vu

| Goi | Slug | Tinh nang chinh |
|-----|------|-----------------|
| Free | `free` | Dashboard, Marketplace, Hoa hong co ban |
| Basic | `basic` | + Rut tien, Health Coach |
| Pro | `pro` | + AI Copilot, Phan tich nang cao |
| Agency | `agency` | + White label, API access, Ho tro uu tien |

### 2.2 Flow dang ky/nang cap

| Buoc | Hanh dong | Ket qua |
|------|-----------|---------|
| 1 | Truy cap `/dashboard/subscription` | Danh sach goi hien thi |
| 2 | Chon chu ky: Thang hoac Nam | Gia cap nhat theo chu ky |
| 3 | Click "Nang cap" tren goi mong muon | Tao PayOS payment intent |
| 4 | Redirect sang trang thanh toan PayOS | Trang checkout PayOS |
| 5 | Hoan tat thanh toan | Redirect ve `/dashboard/subscription?status=success` |
| 6 | Subscription kich hoat tu dong | Tinh nang premium mo khoa |

**Luu y:**
- Goi Free khong can thanh toan
- Chi co the nang cap len goi cao hon hoac ha cap
- Goi hien tai hien thi nut "Current Plan" (disabled)
- Huy goi: Click "Huy goi" → Confirm dialog → Goi bi deactivate

### 2.3 Feature Gating (Phan quyen tinh nang)

| Tinh nang | Goi toi thieu |
|-----------|---------------|
| Dashboard | Free |
| Marketplace | Free |
| Hoa hong co ban | Free |
| Rut tien | Basic |
| Health Coach | Basic |
| AI Copilot | Pro |
| Phan tich nang cao | Pro |
| White label | Agency |
| API access | Agency |

---

## 3. RUT TIEN (WITHDRAWAL)

**Route:** `/dashboard/withdrawal`

### 3.1 Dieu kien rut tien

| Dieu kien | Gia tri |
|-----------|---------|
| So du toi thieu | 2,000,000 VND |
| So tien toi da | Toan bo so du kha dung |
| Gioi han moi lan | 500,000,000 VND |
| Goi toi thieu | Basic tro len |
| Ten tai khoan | Phai khop voi ten dang ky |

### 3.2 Flow rut tien

| Buoc | Hanh dong | Ket qua |
|------|-----------|---------|
| 1 | Truy cap `/dashboard/withdrawal` | Hien thi so du kha dung |
| 2 | Nhap so tien rut (hoac chon Quick Amount) | Validate toi thieu/toi da |
| 3 | Chon ngan hang tu danh sach VN banks | Dropdown voi shortName |
| 4 | Nhap so tai khoan (chi so) | Validate chi nhan so |
| 5 | Nhap ten chu tai khoan | Validate toi thieu 2 ky tu |
| 6 | Nhan "Rut tien" | Goi RPC `create_withdrawal_request` |
| 7 | Yeu cau duoc tao voi status `pending` | Hien thi trong Withdrawal History |
| 8 | Admin duyet → Chuyen khoan | Status chuyen sang `completed` |

**Quick Amount:** Nut 25%, 50%, 75%, Max de chon nhanh so tien.

**Chinh sach:**
- Xu ly trong 24-48 gio lam viec
- Thue TNCN 10% cho rut tien > 2,000,000 VND
- Server-side validation qua Supabase RPC (chong tamper)
- So du cap nhat realtime qua Supabase Realtime channel

### 3.3 Lich su rut tien

Hien thi danh sach cac yeu cau rut tien:
- So tien, Ngay tao, Trang thai (pending/completed/failed)
- Tu dong refresh khi co yeu cau moi (event `withdrawal-created`)

---

## 4. VI TIEN (WALLET)

### 4.1 Cau truc so du

| Loai | Mo ta | Nguon |
|------|-------|-------|
| Shop Balance (`shop_balance`) | So du kha dung de rut | Hoa hong, doanh so |
| Pending Cashback (`pending_cashback`) | Hoa hong chua thanh toan | Commission chua settle |
| Total Earnings | Tong thu nhap | shop_balance + pending_cashback |

### 4.2 Loai giao dich

| Type | Mo ta |
|------|-------|
| `sale` | Don hang tu Marketplace |
| `commission` | Hoa hong tu referral |
| `withdrawal` | Rut tien ve ngan hang |
| `bonus` | Thuong tu he thong |

### 4.3 Theo doi realtime

- Wallet su dung Supabase Realtime channel `wallet-updates-{userId}`
- Tu dong cap nhat khi co thay doi tren `users` table
- Khong can refresh trang de thay so du moi

---

## 5. XU LY LOI THANH TOAN

### 5.1 Checkout errors

| Loi | Nguyen nhan | Xu ly |
|-----|-------------|-------|
| "Failed to create payment link" | PayOS khong phan hoi | Thu lai hoac dung COD |
| "Payment expired" | Qua 10 phut chua thanh toan | Tao don moi |
| "Payment was cancelled" | Nguoi dung huy tren app NH | Tao don moi |
| Cart rong | Gio hang khong co san pham | Redirect ve Marketplace |

### 5.2 Withdrawal errors

| Loi | Nguyen nhan | Xu ly |
|-----|-------------|-------|
| "Minimum withdrawal" | So tien < 2,000,000 VND | Tang so tien |
| "Insufficient balance" | So tien > so du | Giam so tien |
| "Payout exceeds maximum" | So tien > 500,000,000 | Chia thanh nhieu lan |
| "Invalid payout amount" | So tien am hoac khong hop le | Nhap lai so tien hop le |

### 5.3 Subscription errors

| Loi | Nguyen nhan | Xu ly |
|-----|-------------|-------|
| "Invalid checkout URL" | URL khong hop le | Lien he support |
| Redirect fail | Mang cham hoac loi redirect | Thu lai |

---

## 6. BAO MAT THANH TOAN

- **Checkout URL validation:** Kiem tra protocol truoc khi redirect
- **RPC payout:** Rut tien qua stored procedure, khong cho phep client insert truc tiep
- **Circuit breaker:** PayOS client co circuit breaker chong cascade failure
- **Amount validation:** Server-side validate so tien (positive integer, < 500M)
- **Bank account:** So tai khoan chi nhan so (regex validation)
- **Supabase RLS:** Row Level Security tren transactions table

---

## LUU Y CHUNG

1. **Payment Provider**: PayOS — ho tro QR banking cho ngan hang VN
2. **Guest Checkout**: Khong can dang nhap de mua hang
3. **Subscription**: Can dang nhap de dang ky/nang cap goi
4. **Withdrawal**: Can goi Basic+ va so du toi thieu 2M VND
5. **Realtime**: So du vi cap nhat tu dong, khong can refresh
6. **Mobile**: Tat ca payment flows responsive tren moi thiet bi
