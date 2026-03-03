# Hướng Dẫn Thiết Kế - Dự Án WellNexus

## 1. Giới Thiệu
Dự án WellNexus sử dụng phong cách thiết kế Aura Elite với các yếu tố glassmorphism và dark gradients. Tài liệu này cung cấp hướng dẫn chi tiết về thiết kế, màu sắc, typography và các thành phần UI để đảm bảo tính nhất quán trong toàn bộ ứng dụng.

## 2. Nguyên Tắc Thiết Kế

### 2.1. Glassmorphism
- Sử dụng hiệu ứng làm mờ (blur) để tạo hiệu ứng kính trong suốt
- Áp dụng lớp overlay với độ mờ alpha thấp (10-20%)
- Kết hợp với hiệu ứng drop shadow nhẹ để tạo chiều sâu
- Độ trong suốt (opacity) nên ở mức 0.1-0.2 cho lớp overlay

### 2.2. Dark Gradients
- Sử dụng gradient tối làm nền chính
- Phối hợp màu xanh đậm, tím tối và đen với các mức độ khác nhau
- Gradient nên có sự chuyển màu mượt mà và tự nhiên
- Đảm bảo độ tương phản đủ cao giữa văn bản và nền

## 3. Bảng Màu

### 3.1. Màu Chính
- Primary Dark: #0f172a (Slate 900 - Nền tối)
- Primary Gradient Start: #1e293b (Slate 800)
- Primary Gradient End: #0f172a (Slate 900)
- Secondary Dark: #1e293b (Slate 800)

### 3.2. Màu Accent
- Aqua Accent: #06b6d4 (Teal 400 - cho các liên kết và hành động)
- Emerald Glow: #10b981 (Emerald 500 - cho trạng thái thành công)
- Amber Highlight: #f59e0b (Amber 500 - cho cảnh báo)
- Rose Glow: #ec4899 (Pink 500 - cho trạng thái đặc biệt)

### 3.3. Glassmorphism Elements
- Glass Panel: rgba(30, 41, 59, 0.2) với backdrop-filter: blur(10px)
- Glass Border: rgba(255, 255, 255, 0.1)
- Glass Hover: rgba(30, 41, 59, 0.3)

## 4. Typography

### 4.1. Font Chính
- Font Family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif
- Sử dụng hệ thống font weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)

### 4.2. Cỡ Chữ
- Heading 1: 2.5rem (40px) - weight: 700
- Heading 2: 2rem (32px) - weight: 700
- Heading 3: 1.75rem (28px) - weight: 600
- Heading 4: 1.5rem (24px) - weight: 600
- Body Large: 1.125rem (18px) - weight: 400
- Body Regular: 1rem (16px) - weight: 400
- Body Small: 0.875rem (14px) - weight: 400
- Caption: 0.75rem (12px) - weight: 400

## 5. Components

### 5.1. Glass Card
- Background: rgba(30, 41, 59, 0.2)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Backdrop-filter: blur(10px)
- Padding: 1.5rem
- Border-radius: 1rem
- Shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)

### 5.2. Buttons
- Primary Button:
  - Background: linear-gradient(135deg, #06b6d4, #ec4899)
  - Color: white
  - Border-radius: 0.5rem
  - Padding: 0.75rem 1.5rem
  - Transition: all 0.3s ease
  - Hover: transform: scale(1.05)

- Secondary Button:
  - Background: transparent
  - Border: 1px solid rgba(6, 182, 212, 0.5)
  - Color: #06b6d4
  - Border-radius: 0.5rem
  - Padding: 0.75rem 1.5rem

### 5.3. Input Fields
- Background: rgba(15, 23, 42, 0.5)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Border-radius: 0.5rem
- Padding: 0.75rem 1rem
- Backdrop-filter: blur(10px)
- Focus: border-color: #06b6d4

### 5.4. Navigation
- Top Navigation: Glass panel với height 4rem
- Sidebar: Glass panel chiếm 1/4 width màn hình trên desktop
- Mobile Menu: Slide-in từ trái với backdrop-filter

## 6. Layout

### 6.1. Grid System
- Sử dụng 12-column grid system
- Gap: 1.5rem
- Container max-width: 1200px (desktop), full-width (mobile)

### 6.2. Spacing
- Base unit: 1rem (16px)
- Multiples: 0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, 3rem, 4rem
- Negative margins và padding được sử dụng để cân bằng layout

## 7. Animation & Interactions

### 7.1. Micro-interactions
- Button hover: scale(1.03) with transition 0.2s
- Card hover: lift effect with translateY(-5px)
- Glass opacity change: transition 0.3s

### 7.2. Page Transitions
- Fade in/out: opacity transition 0.3s
- Slide transitions: translateX/Y with cubic-bezier easing

## 8. Responsive Design

### 8.1. Breakpoints
- Mobile: max-width 640px
- Tablet: 641px - 1024px
- Desktop: min-width 1025px

### 8.2. Adaptive Elements
- Cards: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop)
- Navigation: Hamburger menu (mobile), sidebar (desktop)
- Typography: Scale down on mobile devices

## 9. Accessibility
- Contrast ratio tối thiểu 4.5:1 cho văn bản thường và 3:1 cho tiêu đề
- Hỗ trợ bàn phím cho tất cả các thành phần tương tác
- ARIA labels cho các thành phần động
- Focus indicators rõ ràng

## 10. Hình Ảnh và Biểu Tượng

### 10.1. Images
- Nền mờ (blur) với glass panels
- Hình ảnh được crop để phù hợp với layout
- Sử dụng hiệu ứng fade nhẹ khi tương tác

### 10.2. Icons
- Sử dụng Lucide React icons
- Kích thước: 1rem (small), 1.25rem (normal), 1.5rem (large)
- Màu sắc: Tùy chỉnh theo trạng thái và theme
