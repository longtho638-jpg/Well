# 🚀 Hướng Dẫn Deploy WellNexus

## Cách 1: Deploy Lên Vercel (Khuyên Dùng - Miễn Phí)

### Bước 1: Tạo Tài Khoản Vercel
1. Truy cập https://vercel.com
2. Đăng nhập bằng GitHub account của bạn

### Bước 2: Import Repository
1. Click **"Add New Project"**
2. Chọn repository **Well** của bạn
3. Vercel sẽ tự động detect Vite framework

### Bước 3: Cấu Hình Environment Variables (Tùy chọn)
Nếu muốn dùng AI Coach:
- Thêm biến: `VITE_GEMINI_API_KEY`
- Giá trị: API key từ https://ai.google.dev/

### Bước 4: Deploy
1. Click **"Deploy"**
2. Đợi 2-3 phút
3. Xong! Bạn sẽ có URL dạng: `wellnexus.vercel.app`

### Auto Deploy
Mỗi khi push code lên GitHub, Vercel sẽ tự động deploy lại.

---

## Cách 2: Deploy Lên Netlify

### Deploy Nhanh
```bash
# 1. Cài Netlify CLI
npm install -g netlify-cli

# 2. Build project
npm run build

# 3. Deploy
netlify deploy --prod --dir=dist
```

### Hoặc qua Web UI
1. Truy cập https://app.netlify.com
2. Kéo thả thư mục `dist` vào
3. Xong!

---

## Cách 3: Deploy Lên Firebase Hosting

### Bước 1: Cài Firebase CLI
```bash
npm install -g firebase-tools
```

### Bước 2: Đăng Nhập
```bash
firebase login
```

### Bước 3: Init Project
```bash
firebase init hosting
```
- Chọn **"Use an existing project"**
- Public directory: **`dist`**
- Single-page app: **Yes**

### Bước 4: Deploy
```bash
npm run build
firebase deploy
```

---

## Cách 4: Deploy Lên GitHub Pages

### Bước 1: Sửa vite.config.ts
Thêm base URL:
```ts
export default defineConfig({
  base: '/Well/', // Tên repository của bạn
  // ...
})
```

### Bước 2: Cài gh-pages
```bash
npm install --save-dev gh-pages
```

### Bước 3: Thêm script vào package.json
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### Bước 4: Deploy
```bash
npm run deploy
```

### Bước 5: Bật GitHub Pages
1. Vào Settings > Pages
2. Source: **gh-pages branch**
3. URL: `https://longtho638-jpg.github.io/Well/`

---

## 📝 Lưu Ý Quan Trọng

### Environment Variables
- File `.env` **KHÔNG BAO GIỜ** commit lên Git
- Chỉ commit `.env.example`
- Trên hosting platform, thêm biến qua Web UI

### Production Build
Kiểm tra build trước khi deploy:
```bash
npm run build
npm run preview
```

### Domain Tùy Chỉnh
Cả 3 platform đều hỗ trợ custom domain miễn phí:
- Vercel: Settings > Domains
- Netlify: Domain settings
- Firebase: Hosting > Add custom domain

---

## 🆘 Troubleshooting

### Lỗi "404 Not Found" khi refresh
**Nguyên nhân:** SPA routing không được config đúng

**Giải pháp:**
- **Vercel:** Đã có trong `vercel.json` ✅
- **Netlify:** Tạo file `public/_redirects`:
  ```
  /*    /index.html   200
  ```
- **Firebase:** Đã có trong `firebase.json` ✅

### Lỗi Environment Variables không load
**Giải pháp:**
1. Kiểm tra tên biến phải bắt đầu bằng `VITE_`
2. Restart dev server sau khi thay đổi `.env`
3. Re-deploy nếu đang ở production

### Build Size Quá Lớn (>500KB warning)
**Đây là cảnh báo bình thường.** Nếu muốn optimize:
```bash
npm run build -- --minify esbuild
```

---

## ✅ Checklist Trước Khi Deploy

- [ ] `npm run build` chạy thành công
- [ ] `npm run preview` hiển thị đúng
- [ ] Không có lỗi TypeScript (`npx tsc --noEmit`)
- [ ] File `.env` không commit lên Git
- [ ] Environment variables đã thêm trên hosting platform

---

## 🎯 Khuyến Nghị

**Cho MVP/Demo:** Vercel hoặc Netlify (dễ nhất)
**Cho Production:** Firebase Hosting (tích hợp tốt với Firebase services)
**Cho Open Source:** GitHub Pages (miễn phí, không limit)
