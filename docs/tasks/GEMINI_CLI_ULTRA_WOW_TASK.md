# ULTRA WOW EXECUTION - MASTER CLI TASK

> **APPROVED:** Complete platform transformation to ultra-premium dark wellness tech aesthetic

---

## EXECUTION ORDER

1. ✅ Global Foundation (Design System + Particles)
2. Hero Section Ultra
3. Dashboard Command Center
4. Marketplace Luxury
5. All Remaining Pages Sync
6. Final Polish & Testing

---

## PHASE 1: GLOBAL FOUNDATION

### Step 1.1: Update Design System CSS

**File:** `src/styles/design-system.css`

**ADD to end of file:**

```css
/* ============================================
   ULTRA WOW ADDITIONS - Dark Premium Theme
   ============================================ */

/* Dramatic Gradients */
:root {
  --gradient-hero: linear-gradient(135deg, 
    #00897B 0%,
    #26A69A 25%,
    #B794F6 50%,
    #9F7AEA 75%,
    #FF6B58 100%
  );
  
  --gradient-dark-bg: linear-gradient(135deg, 
    #0F172A 0%, 
    #1E293B 50%, 
    #0F172A 100%
  );
  
  --gradient-card: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  
  --gradient-text-ultra: linear-gradient(135deg,
    #00897B 0%,
    #9F7AEA 50%,
    #FF6B58 100%
  );
  
  --gradient-glow-teal: radial-gradient(circle at center,
    rgba(0, 137, 123, 0.4) 0%,
    rgba(0, 137, 123, 0) 70%
  );
  
  --gradient-glow-coral: radial-gradient(circle at center,
    rgba(255, 107, 88, 0.4) 0%,
    rgba(255, 107, 88, 0) 70%
  );
}

/* Ultra Premium Shadows */
--shadow-ultra: 
  0 50px 100px -20px rgba(0, 137, 123, 0.3),
  0 30px 60px -30px rgba(159, 122, 234, 0.3),
  0 -2px 6px 0 rgba(255, 255, 255, 0.1) inset;

--shadow-glow-teal: 0 0 60px rgba(0, 137, 123, 0.6);
--shadow-glow-coral: 0 0 60px rgba(255, 107, 88, 0.6);
--shadow-glow-violet: 0 0 60px rgba(159, 122, 234, 0.6);

/* Glassmorphism Ultra */
.glass-ultra {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 8px 32px 0 rgba(0, 137, 123, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.glass-dark {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

/* 3D Transform Effects */
.card-3d {
  transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1),
              box-shadow 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  transform-style: preserve-3d;
}

.card-3d:hover {
  transform: perspective(1000px) rotateX(-5deg) rotateY(5deg) translateY(-10px);
  box-shadow: var(--shadow-ultra);
}

/* Gradient Text Ultra */
.gradient-text-ultra {
  background: var(--gradient-text-ultra);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Dark Background */
.bg-dark-ultra {
  background: var(--gradient-dark-bg);
}

/* Button Ultra */
.btn-ultra {
  position: relative;
  background: linear-gradient(135deg, #FF6B58, #FF8A7A);
  border: none;
  color: white;
  font-weight: 700;
  padding: 1.5rem 3rem;
  border-radius: 1rem;
  font-size: 1.25rem;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(255, 107, 88, 0.6), 
              0 20px 40px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.btn-ultra:hover {
  transform: scale(1.05);
  box-shadow: 0 0 100px rgba(255, 107, 88, 0.8),
              0 30px 60px rgba(0, 0, 0, 0.4);
}

.btn-ultra:active {
  transform: scale(0.95);
}

/* Floating Animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

/* Glow Pulse */
@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.5;
    filter: blur(100px);
  }
  50% {
    opacity: 0.8;
    filter: blur(120px);
  }
}

.animate-glow-pulse {
  animation: glow-pulse 8s ease-in-out infinite;
}

/* Text Glow */
.text-glow {
  text-shadow: 0 0 80px currentColor;
}
```

### Step 1.2: Create Particle Background Component

**File:** `src/components/ParticleBackground.tsx`

```typescript
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const colors = ['rgba(0, 137, 123, 0.5)', 'rgba(159, 122, 234, 0.5)', 'rgba(255, 107, 88, 0.5)'];

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;

        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-30"
    />
  );
};
```

### Step 1.3: Create Cursor Glow Component

**File:** `src/components/CursorGlow.tsx`

```typescript
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CursorGlow: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className="fixed w-96 h-96 rounded-full pointer-events-none z-50 mix-blend-screen"
      style={{
        background: 'radial-gradient(circle, rgba(0,137,123,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        left: position.x - 192,
        top: position.y - 192
      }}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
};
```

---

## PHASE 2: LANDING PAGE ULTRA

**File:** `src/pages/LandingPage.tsx`

### Replace Hero Section (lines ~272-358)

```tsx
{/* ULTRA WOW HERO */}
<section className="relative min-h-screen flex items-center overflow-hidden bg-dark-ultra">
  {/* Particle Background */}
  <ParticleBackground />
  
  {/* Animated Gradient Blobs */}
  <motion.div
    className="absolute w-[800px] h-[800px] rounded-full top-0 right-0 animate-glow-pulse"
    style={{
      background: 'radial-gradient(circle, rgba(0,137,123,0.4) 0%, transparent 70%)'
    }}
    animate={{
      x: ['-10%', '10%', '-10%'],
      y: ['-5%', '5%', '-5%'],
      scale: [1, 1.3, 1]
    }}
    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
  />
  
  <motion.div
    className="absolute w-[700px] h-[700px] rounded-full bottom-0 left-0 animate-glow-pulse"
    style={{
      background: 'radial-gradient(circle, rgba(255,107,88,0.3) 0%, transparent 70%)'
    }}
    animate={{
      x: ['10%', '-10%', '10%'],
      y: ['5%', '-5%', '5%'],
      scale: [1, 1.2, 1]
    }}
    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
  />

  {/* Content */}
  <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
    {/* Ultra Large 3D Headline */}
    <motion.h1
      className="font-display font-black leading-none mb-12"
      style={{
        fontSize: 'clamp(4rem, 15vw, 12rem)',
        background: 'linear-gradient(135deg, #00897B, #9F7AEA, #FF6B58)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 80px rgba(0,137,123,0.5), 0 0 120px rgba(159,122,234,0.3)',
        fontFamily: "'Clash Display', sans-serif"
      }}
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      Transform
      <br />
      Health Into
      <br />
      <span className="text-white text-glow">Wealth</span>
    </motion.h1>

    {/* 3D Floating Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
      {[
        { value: '1M+', label: 'Active Users', color: '#00897B', delay: 0.3 },
        { value: '$50M', label: 'Revenue', color: '#9F7AEA', delay: 0.5 },
        { value: '500+', label: 'Products', color: '#FF6B58', delay: 0.7 }
      ].map((stat, idx) => (
        <motion.div
          key={idx}
          className="glass-ultra card-3d p-8 rounded-3xl relative overflow-hidden group"
          initial={{ opacity: 0, y: 100, rotateX: -45 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: stat.delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ 
            scale: 1.1, 
            rotateY: 10,
            boxShadow: `0 0 60px ${stat.color}60`
          }}
        >
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at top right, ${stat.color}30, transparent)`
            }}
            transition={{ duration: 0.3 }}
          />
          <div 
            className="text-7xl font-black mb-2 relative z-10"
            style={{
              background: `linear-gradient(135deg, ${stat.color}, #FFFFFF)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {stat.value}
          </div>
          <div className="text-white/70 text-sm relative z-10">{stat.label}</div>
        </motion.div>
      ))}
    </div>

    {/* Ultra Premium CTA */}
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.6 }}
    >
      <motion.button
        onClick={handleJoin}
        className="btn-ultra group relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="relative z-10 flex items-center gap-3">
          <Rocket className="w-7 h-7" />
          Start Your Journey
          <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
        </span>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-coral-600 to-amber-500 rounded-xl"
          initial={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    </motion.div>

    {/* Scroll Indicator */}
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2"
      animate={{ y: [0, 15, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ChevronDown className="w-12 h-12 text-white/30" />
    </motion.div>
  </div>
</section>
```

### Add Imports to Top of LandingPage.tsx

```typescript
import { ParticleBackground } from '@/components/ParticleBackground';
import { Rocket, ChevronDown } from 'lucide-react';
```

---

## PHASE 3: DASHBOARD COMMAND CENTER

**File:** `src/pages/Dashboard.tsx`

### Wrap entire dashboard in dark container (line ~50)

```tsx
<div className="min-h-screen bg-dark-ultra relative overflow-hidden">
  <ParticleBackground />
  <CursorGlow />
  
  <div className="relative z-10 p-6">
    {/* Existing content but update stats cards */}
  </div>
</div>
```

### Replace Stats Grid (find existing stats cards ~line 100)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {[
    { 
      label: 'Total Balance', 
      value: formatVND(walletData.total),
      icon: Wallet,
      gradientStart: '#00897B',
      gradientEnd: '#26A69A',
      change: '+12.5%'
    },
    { 
      label: 'Available', 
      value: formatVND(walletData.available),
      icon: DollarSign,
      gradientStart: '#10B981',
      gradientEnd: '#34D399',
      change: '+8.2%'
    },
    { 
      label: 'Pending', 
      value: formatVND(walletData.pending),
      icon: Clock,
      gradientStart: '#F59E0B',
      gradientEnd: '#FBBF24',
      change: '+15.3%'
    },
    { 
      label: 'Team Volume', 
      value: formatVND(user?.teamVolume || 0),
      icon: Users,
      gradientStart: '#9F7AEA',
      gradientEnd: '#B794F6',
      change: '+22.1%'
    }
  ].map((stat, idx) => {
    const Icon = stat.icon;
    return (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: idx * 0.1, duration: 0.6 }}
        className="relative group"
      >
        <div className="glass-ultra card-3d rounded-3xl p-8 relative overflow-hidden">
          {/* Hover Gradient */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at top right, ${stat.gradientStart}30, transparent)`
            }}
            transition={{ duration: 0.3 }}
          />

          <div className="relative z-10">
            {/* Icon with Glow */}
            <div 
              className="w-20 h-20 rounded-2xl mb-6 flex items-center justify-center transform group-hover:scale-110 transition-transform"
              style={{
                background: `linear-gradient(135deg, ${stat.gradientStart}, ${stat.gradientEnd})`,
                boxShadow: `0 0 40px ${stat.gradientStart}60`
              }}
            >
              <Icon className="w-10 h-10 text-white" />
            </div>

            {/* Value with Gradient */}
            <div
              className="text-5xl font-black mb-2"
              style={{
                background: `linear-gradient(135deg, ${stat.gradientStart}, ${stat.gradientEnd})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {stat.value}
            </div>

            <div className="text-white/60 text-sm mb-4">{stat.label}</div>

            {/* Change Indicator */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-semibold text-sm">{stat.change}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  })}
</div>
```

### Add Imports

```typescript
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';
import { TrendingUp } from 'lucide-react';
```

---

## PHASE 4: MARKETPLACE LUXURY

**File:** `src/pages/Marketplace.tsx`

### Wrap in dark container

```tsx
<div className="min-h-screen bg-dark-ultra relative overflow-hidden">
  <ParticleBackground />
  
  <div className="relative z-10 p-6">
    {/* Content */}
  </div>
</div>
```

### Update Product Grid (find existing product map)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {products.map((product, idx) => (
    <motion.div
      key={product.id}
      className="group relative"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
    >
      <div className="card-3d glass-ultra rounded-3xl overflow-hidden relative">
        {/* Image Container */}
        <div className="relative h-80 overflow-hidden">
          <motion.img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.2 }}
            transition={{ duration: 0.6 }}
          />

          {/* Gradient Overlay on Hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent flex items-end p-6"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="inline w-5 h-5 mr-2" />
              Add to Cart
            </motion.button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-white/60 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>

          {/* Price with Gradient */}
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-3xl font-black mb-1"
                style={{
                  background: 'linear-gradient(135deg, #00897B, #9F7AEA)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {formatVND(product.price)}
              </div>
              <div className="text-emerald-400 text-sm font-semibold">
                Earn {product.commissionRate}% commission
              </div>
            </div>

            {/* Quick View Button */}
            <motion.button
              className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-white shadow-lg"
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Floating NEW Badge */}
      {product.isNew && (
        <motion.div
          className="absolute -top-3 -right-3 px-4 py-2 rounded-full text-white text-xs font-bold shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #FF6B58, #FBBF24)'
          }}
          animate={{ rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          NEW
        </motion.div>
      )}
    </motion.div>
  ))}
</div>
```

---

## PHASE 5: SYNC ALL REMAINING PAGES

Apply dark theme + particles to:

1. **VenturePage.tsx**
2. **CopilotPage.tsx**
3. **LeaderDashboard.tsx**
4. **ReferralPage.tsx**
5. **HealthCoach.tsx**
6. **HealthCheck.tsx**
7. **Leaderboard.tsx**
8. **MarketingTools.tsx**
9. **AgentDashboard.tsx**
10. **Admin pages** (Overview, CMS, Partners, Finance, PolicyEngine, OrderManagement)

**Template for each:**

```tsx
<div className="min-h-screen bg-dark-ultra relative overflow-hidden">
  <ParticleBackground />
  
  <div className="relative z-10 p-6">
    {/* Existing content - update cards to glass-ultra */}
  </div>
</div>
```

**Find and Replace:**
- `bg-white` → `glass-ultra`
- `bg-slate-50` → `bg-dark-ultra`
- `text-slate-900` → `text-white`
- `border-slate-200` → `border-white/20`

---

## PHASE 6: FINAL POLISH

### Step 6.1: Update App.tsx for Page Transitions

```tsx
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CursorGlow } from './components/CursorGlow';

const App: React.FC = () => {
  const location = useLocation();
  
  return (
    <ThemeProvider>
      <ToastProvider>
        <CursorGlow />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes location={location}>
              {/* routes */}
            </Routes>
          </motion.div>
        </AnimatePresence>
      </ToastProvider>
    </ThemeProvider>
  );
};
```

### Step 6.2: Update index.html for Dark Meta Theme

```html
<!-- Add to <head> -->
<meta name="theme-color" content="#0F172A">
<meta name="color-scheme" content="dark">
```

---

## BUILD & DEPLOY

```bash
# Test build
npm run build

# Commit
git add -A
git commit -m "🌌 ULTRA WOW - Complete Dark Premium Transformation | 3D Effects | Particles | Glassmorphism"

# Deploy
git push
```

---

## SUCCESS VERIFICATION

- [ ] All pages have dark gradient background
- [ ] Particles visible on key pages
- [ ] 3D card tilt on hover works
- [ ] Glassmorphism ultra blur effect
- [ ] Cursor glow follows mouse
- [ ] Hero headline is 12rem on desktop
- [ ] All text gradients render properly
- [ ] Stats cards have glowing shadows on hover
- [ ] Product cards have parallax image zoom
- [ ] CTA button has intense coral glow
- [ ] Page transitions are smooth 0.5s
- [ ] Mobile responsive (particles off on mobile for performance)

---

**READY FOR EXECUTION - Copy to Gemini CLI**
