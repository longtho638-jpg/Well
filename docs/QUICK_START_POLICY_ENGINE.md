# ⚡ QUICK START: Policy Engine

## 🎯 Access the Command Center

### Local Development:
```
http://localhost:5173/admin/policy-engine
```

### Production (Vercel):
```
https://[your-domain].vercel.app/admin/policy-engine
```

---

## 🔓 Step-by-Step Usage

### 1️⃣ Unlock Editing Mode
- Click **"MỞ KHÓA"** (red button, top right)
- Button turns green: **"ĐANG CHỈNH SỬA"**

### 2️⃣ Configure Business Policy

**Left Panel - Policy Settings:**

| Setting | Description | Range | Sweet Spot |
|---------|-------------|-------|------------|
| **Hoa Hồng Cơ Bản** | Base commission for all | 10-30% | **15-20%** |
| **Quỹ Thưởng Tinh Hoa** | Elite bonus pool | 0-15% | **5-8%** |
| **Mốc White-Label** | Revenue to get own brand | 100M-2B VND | **1B VND** |
| **Phí Vendor** | SaaS fee after spin-off | 10-40% | **20-25%** |
| **Top Elite** | Number of elite partners | 50-500 | **200** |
| **12 Tướng** | Zodiac leaders | 6-20 | **12** |

### 3️⃣ Run Financial Simulation

**Right Panel - Simulation:**

1. Enter **"Doanh Thu Dự Kiến"** (Expected Revenue)
   - Example: `5000000000` (5 billion VND)

2. Click **"CHẠY MÔ PHỎNG"** (green button)

3. Review results:
   - **Tổng Doanh Thu:** Total revenue
   - **Hoa Hồng Cơ Bản:** Base payout
   - **Thưởng Tinh Hoa:** Elite bonus
   - **Tổng Chi Trả:** Total payout
   - **Lợi Nhuận Platform:** Platform profit
   - **Tỷ Suất Lợi Nhuận:** Profit margin %

### 4️⃣ Optimize for Profit

**Goal:** Achieve **50-70% profit margin**

**If profit margin is too low (<30%):**
- Decrease Base Commission
- Decrease Elite Bonus Pool
- Increase Vendor Fee

**If profit margin is too high (>80%):**
- Increase Base Commission (attract better talent)
- Increase Elite Bonus Pool (reward top performers)

### 5️⃣ Save Configuration

- Click **"LƯU CHÍNH SÁCH"** (yellow button)
- System saves to Firestore (currently console.log)
- Editing mode auto-locks

---

## 🎨 Visual Guide

### Policy Engine Layout:

```
┌────────────────────────────────────────────────────────────┐
│  POLICY ENGINE                          [MỞ KHÓA/UNLOCK]  │
│  Trung tâm quyền lực                                       │
├─────────────────────────┬──────────────────────────────────┤
│                         │                                  │
│  CẤU HÌNH CHÍNH SÁCH    │    MÔ PHỎNG DÒNG TIỀN           │
│                         │                                  │
│  ▓▓▓▓▓▓░░░░ 15%        │    Doanh Thu Dự Kiến:           │
│  Hoa Hồng Cơ Bản       │    [5,000,000,000 VND]          │
│                         │                                  │
│  ▓▓░░░░░░░░ 5%         │    [CHẠY MÔ PHỎNG]              │
│  Quỹ Thưởng Tinh Hoa   │                                  │
│                         │    ┌──────────────────────────┐ │
│  Mốc White-Label:       │    │ KẾT QUẢ MÔ PHỎNG        │ │
│  [1,000,000,000]        │    │                          │ │
│                         │    │ Tổng Doanh Thu: 5B VND   │ │
│  ▓▓▓▓░░░░░░ 20%        │    │ Hoa Hồng: 750M VND       │ │
│  Phí Vendor (SaaS)      │    │ Elite Bonus: 250M VND    │ │
│                         │    │ ─────────────────────    │ │
│  Top Elite: [200]       │    │ Chi Trả: 1B VND          │ │
│  12 Tướng: [12]         │    │ Lợi Nhuận: 4B VND        │ │
│                         │    │ Margin: 80%              │ │
│  [LƯU CHÍNH SÁCH]       │    └──────────────────────────┘ │
└─────────────────────────┴──────────────────────────────────┘
```

---

## 💡 Pro Tips

### For Strategic Planning:
1. **Run multiple scenarios** with different revenue inputs
2. **Test extreme cases:** What if revenue is 100B VND?
3. **Find break-even point:** Minimum revenue to be profitable

### For Sales Demos:
1. **Let prospect control the sliders** (hands-on experience)
2. **Show white-label trigger** (aspirational goal)
3. **Emphasize profit margin** (proves business viability)

### For VC Pitches:
1. **Highlight SaaS fee** (recurring revenue)
2. **Show scaling economics** (margin improves with Vendors)
3. **Demonstrate control** (can optimize policy anytime)

---

## 🚨 Warning Indicators

### Watch for red alerts in UI:

⚠️ **"Hoa hồng quá cao → Lợi nhuận thấp → VC không thích"**
- Reduce Base Commission or Elite Pool

⚠️ **"Elite Pool quá thấp → Không hút được quân tài"**
- Increase Elite Bonus Pool to 5-8%

⚠️ **"White-label trigger quá cao → Không ai đủ điều kiện"**
- Lower threshold to realistic level (1B VND is good)

---

## 🔄 Example Configurations

### Conservative (High Margin):
```
Base Commission:     15%
Elite Pool:          3%
White-Label:         2B VND
Vendor Fee:          25%
→ Profit Margin:     ~82%
```

### Aggressive (Fast Growth):
```
Base Commission:     22%
Elite Pool:          8%
White-Label:         500M VND
Vendor Fee:          18%
→ Profit Margin:     ~70%
```

### Balanced (Recommended):
```
Base Commission:     18%
Elite Pool:          5%
White-Label:         1B VND
Vendor Fee:          20%
→ Profit Margin:     ~77%
```

---

## 📞 Troubleshooting

### Problem: Policy Engine not loading
**Solution:** Check route in `src/App.tsx:31`

### Problem: Sliders not moving
**Solution:** Click "MỞ KHÓA" first

### Problem: Simulation not updating
**Solution:** Click "CHẠY MÔ PHỎNG" after changing inputs

### Problem: Save button not appearing
**Solution:** Must unlock first, then button appears

---

## 🎓 Training Resources

### For Your Team:
1. **Demo Video:** (TODO: Record walkthrough)
2. **FAQ:** See `THE_ELITE_PROTOCOL.md#faq`
3. **Scripts:** See `THE_ELITE_PROTOCOL.md#appendix`

### For Prospects:
1. **Show, don't tell:** Let them use the engine
2. **Ask questions:** "What commission rate would you set?"
3. **Paint the vision:** "This will be your platform"

---

**Built with:** React + TypeScript + Framer Motion + Tailwind
**Access Level:** Admin only (TODO: Add auth)
**Last Updated:** 2025-11-21

---

*Quyền lực không phải là thứ được cho. Quyền lực là thứ được tạo ra.*
