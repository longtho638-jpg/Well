---
phase: 4
title: "Performance Optimization + Mekong-cli SDK Integration"
priority: P2
status: pending
effort: 4h
dependencies: [phase-01, phase-02, phase-03]
---

# Phase 4: Performance Optimization + Mekong-cli SDK Integration

## Context Links

- **System Architecture**: `./docs/system-architecture.md` (Performance section)
- **Vite Config**: `./vite.config.ts`
- **Agent-OS**: `./src/agents/` (24+ agents)
- **Current Build**: `npm run build` (~3.2s)

---

## Overview

**Priority:** P2 - Medium
**Status:** ⏳ Pending
**Effort:** 4 hours

**Description:** Optimize application performance through code splitting, bundle size reduction, and Lighthouse audit fixes. Integrate Mekong-cli Hub SDK for centralized agent orchestration.

**Problem:**
- Large initial bundle size (all routes loaded upfront)
- CSS not split by route (monolithic stylesheet)
- Lighthouse Performance score < 90
- No centralized agent orchestration (agents isolated)
- Missing Mekong-cli Hub SDK integration

**Solution:**
- Implement route-based code splitting with React.lazy
- Configure manualChunks in Vite for optimal bundling
- Fix Core Web Vitals (LCP, FID, CLS)
- Integrate Mekong-cli Hub SDK for agent communication
- Set up agent registry and event bus

---

## Key Insights

1. **Quick Win**: React.lazy() already supported, just needs implementation
2. **Bundle Size**: Target 70% reduction in initial bundle (500KB → 150KB gzipped)
3. **LCP Target**: < 2.5s (currently ~3.2s on 3G)
4. **Agent Isolation Problem**: 24 agents operate independently, no coordination
5. **Mekong-cli Benefits**: Centralized orchestration, agent discovery, event-driven communication

---

## Requirements

### Functional Requirements
- Route-based lazy loading (Dashboard, Marketplace, Network, etc.)
- CSS code splitting per route
- Image optimization (WebP format, lazy loading)
- Mekong-cli Hub SDK connected to agent registry
- Agent event bus for inter-agent communication
- Agent health monitoring dashboard

### Non-Functional Requirements
- Initial bundle < 150KB (gzipped)
- Route chunk < 50KB each (gzipped)
- LCP < 2.5s on Fast 3G
- FID < 100ms
- CLS < 0.1
- Lighthouse Performance: 90+
- Agent event latency < 100ms

---

## Architecture

### Code Splitting Strategy
```
Initial Bundle (Critical)
├── React Core (~45KB)
├── Router (~20KB)
├── Auth (~15KB)
├── Common Components (~30KB)
├── Design Tokens (~10KB)
└── i18n (~20KB)
Total: ~140KB gzipped

Route Chunks (Lazy Loaded)
├── Dashboard.chunk.js (~40KB)
├── Marketplace.chunk.js (~35KB)
├── Network.chunk.js (~45KB)
├── Wallet.chunk.js (~30KB)
└── Admin.chunk.js (~50KB)
```

### Mekong-cli Hub Architecture
```
┌─────────────────────────────────┐
│  WellNexus Application          │
│  ├─ UI Components               │
│  └─ Business Logic              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Mekong-cli Hub SDK             │
│  ├─ Agent Registry              │
│  ├─ Event Bus                   │
│  ├─ Health Monitor              │
│  └─ Task Queue                  │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┬─────────┬──────────┐
    ▼                 ▼         ▼          ▼
┌─────────┐     ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Sales   │     │ Reward  │ │ Coach   │ │ 21 More │
│ Copilot │     │ Engine  │ │ Agent   │ │ Agents  │
└─────────┘     └─────────┘ └─────────┘ └─────────┘
```

### Event Flow
```
User Action (Buy Product)
    │
    ▼
┌─────────────────────────┐
│  UI emits event         │
│  "order.created"        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Mekong Hub receives    │
│  Routes to agents       │
└────────┬────────────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Reward  │ │ Email   │ │ Analytics│
│ Engine  │ │ Service │ │ Agent   │
└─────────┘ └─────────┘ └─────────┘
```

---

## Related Code Files

### Files to Modify
- `vite.config.ts` → Add manualChunks configuration
- `src/App.tsx` → Implement React.lazy for routes
- `src/main.tsx` → Preload critical chunks
- `src/components/*` → Optimize images, add lazy loading
- `src/agents/index.ts` → Register with Mekong Hub

### Files to Create
- `src/lib/mekong-hub-client.ts` (NEW)
- `src/agents/agent-registry.ts` (NEW)
- `src/utils/performance-monitor.ts` (NEW)
- `scripts/analyze-bundle-size.ts` (NEW)

### Files to Delete
- None

---

## Implementation Steps

### Step 1: Configure Vite Code Splitting (30 min)
**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ /* ... existing config ... */ }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', '@radix-ui/react-dialog'],
          'vendor-state': ['zustand', '@tanstack/react-query'],

          // Feature chunks
          'agent-os': [
            './src/agents/sales-coach',
            './src/agents/sales-copilot',
            './src/agents/reward-engine',
          ],
          'charts': ['recharts', 'd3'],
          'utils': ['date-fns', 'zod', 'clsx'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB
    cssCodeSplit: true, // Split CSS by route
    sourcemap: false, // Disable sourcemaps in production (smaller bundle)
  },
  optimizeDeps: {
    include: ['react', 'react-dom'], // Pre-bundle dependencies
  },
})
```

### Step 2: Implement Route-Based Lazy Loading (45 min)
**File:** `src/App.tsx`

```typescript
import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/error-boundary'
import { LoadingScreen } from '@/components/loading-screen'

// Eagerly loaded (critical path)
import { Layout } from '@/components/layout'
import { Login } from '@/pages/Login'

// Lazy loaded routes (on-demand)
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Marketplace = lazy(() => import('@/pages/Marketplace'))
const NetworkPage = lazy(() => import('@/pages/NetworkPage'))
const Wallet = lazy(() => import('@/pages/Wallet'))
const Profile = lazy(() => import('@/pages/Profile'))
const AdminPanel = lazy(() => import('@/pages/admin'))

// Agent-OS dashboard (heavy component)
const AgentDashboard = lazy(() => import('@/pages/AgentDashboard'))

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="network" element={<NetworkPage />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="profile" element={<Profile />} />
              <Route path="agents" element={<AgentDashboard />} />
              <Route path="admin/*" element={<AdminPanel />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
```

**File:** `src/components/loading-screen.tsx`

```typescript
import { AURA_ELITE } from '@/lib/design-tokens'
import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className={`min-h-screen flex items-center justify-center ${AURA_ELITE.glass.dark}`}>
      <div className="text-center">
        <Loader2 className={`w-16 h-16 mx-auto ${AURA_ELITE.animations.spin} text-purple-400`} />
        <p className={`mt-4 ${AURA_ELITE.text.body}`}>Loading...</p>
      </div>
    </div>
  )
}
```

### Step 3: Create Mekong-cli Hub Client (1h)
**File:** `src/lib/mekong-hub-client.ts`

```typescript
/**
 * Mekong-cli Hub SDK Client
 * Centralized agent orchestration and event bus
 */

type AgentId = string
type EventType = string
type EventHandler = (payload: any) => void | Promise<void>

interface Agent {
  id: AgentId
  name: string
  description: string
  capabilities: string[]
  status: 'idle' | 'busy' | 'error'
  lastActive: Date
}

interface AgentTask {
  id: string
  agentId: AgentId
  type: string
  payload: any
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
}

class MekongHubClient {
  private agents: Map<AgentId, Agent> = new Map()
  private eventHandlers: Map<EventType, Set<EventHandler>> = new Map()
  private taskQueue: AgentTask[] = []
  private wsConnection: WebSocket | null = null

  constructor(private hubUrl: string = 'wss://hub.mekong.ai') {}

  /**
   * Connect to Mekong Hub WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wsConnection = new WebSocket(this.hubUrl)

      this.wsConnection.onopen = () => {
        console.log('✅ Connected to Mekong Hub')
        resolve()
      }

      this.wsConnection.onerror = (error) => {
        console.error('❌ Mekong Hub connection error:', error)
        reject(error)
      }

      this.wsConnection.onmessage = (event) => {
        const message = JSON.parse(event.data)
        this.handleHubMessage(message)
      }
    })
  }

  /**
   * Register an agent with the Hub
   */
  registerAgent(agent: Omit<Agent, 'status' | 'lastActive'>): void {
    const fullAgent: Agent = {
      ...agent,
      status: 'idle',
      lastActive: new Date(),
    }

    this.agents.set(agent.id, fullAgent)

    // Notify Hub of new agent
    this.sendToHub({
      type: 'agent.register',
      payload: fullAgent,
    })

    console.log(`✅ Registered agent: ${agent.name}`)
  }

  /**
   * Emit event to Hub (event bus)
   */
  emit(eventType: EventType, payload: any): void {
    this.sendToHub({
      type: 'event.emit',
      eventType,
      payload,
      timestamp: new Date().toISOString(),
    })

    // Also trigger local handlers
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload)
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error)
        }
      })
    }
  }

  /**
   * Subscribe to events
   */
  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }

    this.eventHandlers.get(eventType)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler)
    }
  }

  /**
   * Dispatch task to specific agent
   */
  async dispatchTask(agentId: AgentId, type: string, payload: any): Promise<AgentTask> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    const task: AgentTask = {
      id: crypto.randomUUID(),
      agentId,
      type,
      payload,
      status: 'pending',
      createdAt: new Date(),
    }

    this.taskQueue.push(task)

    // Update agent status
    agent.status = 'busy'
    agent.lastActive = new Date()

    // Send to Hub
    this.sendToHub({
      type: 'task.dispatch',
      payload: task,
    })

    return task
  }

  /**
   * Get agent health status
   */
  getAgentHealth(): Array<Agent> {
    return Array.from(this.agents.values())
  }

  /**
   * Handle messages from Hub
   */
  private handleHubMessage(message: any): void {
    switch (message.type) {
      case 'task.completed':
        this.handleTaskCompleted(message.payload)
        break
      case 'task.failed':
        this.handleTaskFailed(message.payload)
        break
      case 'event.broadcast':
        this.handleEventBroadcast(message.eventType, message.payload)
        break
      default:
        console.warn('Unknown Hub message type:', message.type)
    }
  }

  /**
   * Handle task completion
   */
  private handleTaskCompleted(task: AgentTask): void {
    const agent = this.agents.get(task.agentId)
    if (agent) {
      agent.status = 'idle'
      agent.lastActive = new Date()
    }

    // Remove from queue
    const index = this.taskQueue.findIndex(t => t.id === task.id)
    if (index !== -1) {
      this.taskQueue.splice(index, 1)
    }

    // Emit completion event
    this.emit(`task.completed.${task.type}`, task)
  }

  /**
   * Handle task failure
   */
  private handleTaskFailed(task: AgentTask): void {
    const agent = this.agents.get(task.agentId)
    if (agent) {
      agent.status = 'error'
      agent.lastActive = new Date()
    }

    // Emit failure event
    this.emit(`task.failed.${task.type}`, task)
  }

  /**
   * Handle broadcasted events
   */
  private handleEventBroadcast(eventType: EventType, payload: any): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      handlers.forEach(handler => handler(payload))
    }
  }

  /**
   * Send message to Hub
   */
  private sendToHub(message: any): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message))
    } else {
      console.warn('Hub connection not open, message queued')
    }
  }

  /**
   * Disconnect from Hub
   */
  disconnect(): void {
    this.wsConnection?.close()
    this.wsConnection = null
  }
}

// Singleton instance
export const mekongHub = new MekongHubClient(
  import.meta.env.VITE_MEKONG_HUB_URL || 'wss://hub.mekong.ai'
)
```

### Step 4: Create Agent Registry (30 min)
**File:** `src/agents/agent-registry.ts`

```typescript
import { mekongHub } from '@/lib/mekong-hub-client'

/**
 * Agent Registry - Centralized registration of all 24 agents
 */

export async function initializeAgents() {
  console.log('🤖 Initializing Agent-OS with Mekong Hub...')

  // Connect to Hub
  await mekongHub.connect()

  // Register all 24 agents
  const agents = [
    {
      id: 'sales-coach',
      name: 'Sales Coach',
      description: 'Personalized sales training and guidance',
      capabilities: ['coaching', 'training', 'feedback'],
    },
    {
      id: 'sales-copilot',
      name: 'Sales Copilot',
      description: 'Real-time sales assistance',
      capabilities: ['sales', 'assistance', 'recommendations'],
    },
    {
      id: 'reward-engine',
      name: 'Reward Engine',
      description: 'Commission calculation and reward distribution',
      capabilities: ['commission', 'rewards', 'calculation'],
    },
    // ... register all 24 agents
  ]

  agents.forEach(agent => {
    mekongHub.registerAgent(agent)
  })

  // Setup event handlers
  setupEventHandlers()

  console.log(`✅ ${agents.length} agents registered with Mekong Hub`)
}

function setupEventHandlers() {
  // Order events
  mekongHub.on('order.created', async (order) => {
    console.log('📦 Order created, dispatching to agents...')

    // Dispatch to Reward Engine
    await mekongHub.dispatchTask('reward-engine', 'calculate-commission', order)

    // Dispatch to Analytics Agent
    await mekongHub.dispatchTask('analytics-agent', 'track-sale', order)
  })

  // User events
  mekongHub.on('user.registered', async (user) => {
    console.log('👤 New user registered, dispatching to agents...')

    // Dispatch to Welcome Agent
    await mekongHub.dispatchTask('welcome-agent', 'send-welcome', user)
  })

  // Commission events
  mekongHub.on('commission.earned', async (commission) => {
    console.log('💰 Commission earned, dispatching to agents...')

    // Dispatch to Notification Agent
    await mekongHub.dispatchTask('notification-agent', 'send-commission-alert', commission)
  })
}
```

### Step 5: Optimize Images and Assets (30 min)
```bash
# Install image optimization tools
npm install -D @squoosh/lib sharp

# Create image optimization script
```

**File:** `scripts/optimize-images.ts`

```typescript
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

async function optimizeImages() {
  const publicDir = join(process.cwd(), 'public')
  const files = await readdir(publicDir)

  for (const file of files) {
    if (file.match(/\.(png|jpg|jpeg)$/)) {
      const inputPath = join(publicDir, file)
      const outputPath = join(publicDir, file.replace(/\.(png|jpg|jpeg)$/, '.webp'))

      console.log(`Optimizing ${file}...`)

      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath)

      console.log(`✅ Created ${outputPath}`)
    }
  }
}

optimizeImages()
```

**Update image components:**
```typescript
// Before
<img src="/logo.png" alt="WellNexus" />

// After
<img
  src="/logo.webp"
  alt="WellNexus"
  loading="lazy"
  width="200"
  height="50"
/>
```

### Step 6: Performance Monitoring Utility (30 min)
**File:** `src/utils/performance-monitor.ts`

```typescript
/**
 * Performance Monitoring Utility
 * Tracks Core Web Vitals and reports to analytics
 */

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []

  /**
   * Measure Largest Contentful Paint (LCP)
   */
  measureLCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any

      const lcp = lastEntry.renderTime || lastEntry.loadTime
      this.recordMetric('LCP', lcp, lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor')
    })

    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  }

  /**
   * Measure First Input Delay (FID)
   */
  measureFID(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[]

      entries.forEach(entry => {
        const fid = entry.processingStart - entry.startTime
        this.recordMetric('FID', fid, fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor')
      })
    })

    observer.observe({ type: 'first-input', buffered: true })
  }

  /**
   * Measure Cumulative Layout Shift (CLS)
   */
  measureCLS(): void {
    let clsValue = 0

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[]

      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })

      this.recordMetric('CLS', clsValue, clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor')
    })

    observer.observe({ type: 'layout-shift', buffered: true })
  }

  /**
   * Record metric
   */
  private recordMetric(name: string, value: number, rating: PerformanceMetric['rating']): void {
    this.metrics.push({ name, value, rating })

    console.log(`📊 ${name}: ${value.toFixed(2)}ms (${rating})`)

    // Send to analytics (optional)
    if (window.gtag) {
      window.gtag('event', name, {
        value: Math.round(value),
        metric_rating: rating,
      })
    }
  }

  /**
   * Initialize all measurements
   */
  init(): void {
    this.measureLCP()
    this.measureFID()
    this.measureCLS()
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return this.metrics
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

**Initialize in `main.tsx`:**
```typescript
import { performanceMonitor } from '@/utils/performance-monitor'

performanceMonitor.init()
```

### Step 7: Bundle Size Analysis Script (15 min)
**File:** `scripts/analyze-bundle-size.ts`

```typescript
import { stat } from 'fs/promises'
import { join } from 'path'
import { readdir } from 'fs/promises'

async function analyzeBundleSize() {
  const distDir = join(process.cwd(), 'dist/assets')

  try {
    const files = await readdir(distDir)

    let totalSize = 0
    const chunks: Array<{ name: string; size: number; sizeKB: number }> = []

    for (const file of files) {
      const filePath = join(distDir, file)
      const stats = await stat(filePath)

      totalSize += stats.size
      chunks.push({
        name: file,
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024),
      })
    }

    // Sort by size (largest first)
    chunks.sort((a, b) => b.size - a.size)

    console.log('\n📦 Bundle Size Analysis\n')
    console.log(`Total: ${(totalSize / 1024).toFixed(2)} KB\n`)

    console.log('Largest chunks:')
    chunks.slice(0, 10).forEach(chunk => {
      console.log(`  ${chunk.sizeKB} KB - ${chunk.name}`)
    })

    // Warnings
    const largeChunks = chunks.filter(c => c.sizeKB > 200)
    if (largeChunks.length > 0) {
      console.log('\n⚠️  Warning: Large chunks detected (> 200KB):')
      largeChunks.forEach(chunk => {
        console.log(`  ${chunk.sizeKB} KB - ${chunk.name}`)
      })
    }
  } catch (error) {
    console.error('Error analyzing bundle:', error)
  }
}

analyzeBundleSize()
```

**Add to `package.json`:**
```json
{
  "scripts": {
    "analyze": "npm run build && tsx scripts/analyze-bundle-size.ts"
  }
}
```

### Step 8: Lighthouse CI Integration (30 min)
```bash
# Install Lighthouse CI
npm install -D @lhci/cli

# Create Lighthouse config
```

**File:** `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "url": ["http://localhost:4173/"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "categories:pwa": ["error", { "minScore": 1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**Add to `package.json`:**
```json
{
  "scripts": {
    "lighthouse": "lhci autorun"
  }
}
```

---

## Todo List

### Performance Tasks
- [ ] Configure Vite manualChunks for optimal bundling
- [ ] Implement React.lazy for all route components
- [ ] Create LoadingScreen component with Aura Elite style
- [ ] Enable CSS code splitting in Vite config
- [ ] Optimize images to WebP format
- [ ] Add lazy loading to all images
- [ ] Create performance monitoring utility
- [ ] Initialize performance monitor in main.tsx
- [ ] Run Lighthouse audit (target 90+)
- [ ] Fix LCP issues (target < 2.5s)
- [ ] Fix CLS issues (target < 0.1)
- [ ] Create bundle size analysis script
- [ ] Set up Lighthouse CI

### Mekong-cli SDK Tasks
- [ ] Create Mekong Hub client library
- [ ] Implement WebSocket connection to Hub
- [ ] Create agent registry
- [ ] Register all 24 agents with Hub
- [ ] Set up event bus handlers
- [ ] Implement task dispatching
- [ ] Create agent health monitoring
- [ ] Test agent communication via Hub
- [ ] Monitor agent event latency
- [ ] Document agent orchestration patterns

---

## Success Criteria

### Performance
- ✅ Initial bundle < 150KB (gzipped)
- ✅ Route chunks < 50KB each
- ✅ LCP < 2.5s on Fast 3G
- ✅ FID < 100ms
- ✅ CLS < 0.1
- ✅ Lighthouse Performance: 90+
- ✅ All images in WebP format
- ✅ Lazy loading on all non-critical images

### Mekong-cli SDK
- ✅ Hub client connected via WebSocket
- ✅ All 24 agents registered
- ✅ Event bus functional
- ✅ Task dispatching working
- ✅ Agent health monitoring operational
- ✅ Event latency < 100ms
- ✅ Zero agent coordination errors

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Code splitting breaks hot reload | Medium | Low | Test in dev mode extensively |
| Mekong Hub WebSocket connection fails | High | Medium | Implement reconnection logic |
| Performance regression on mobile | High | Low | Test on real devices |
| Agent event latency spikes | Medium | Medium | Implement event queue |
| Bundle size still too large | Medium | Low | Further optimize with tree-shaking |

---

## Security Considerations

1. **Mekong Hub Authentication**: Secure WebSocket connection with JWT
2. **Agent Task Validation**: Validate all task payloads
3. **Event Bus Security**: Prevent event injection attacks

---

## Next Steps

After Phase 4 completion:
1. Final production deployment
2. Monitor Lighthouse scores in CI/CD
3. Performance regression testing
4. Agent orchestration monitoring
5. User feedback collection

---

**Phase Owner:** Performance Team + Agent-OS Team
**Reviewers:** Tech Lead, DevOps Engineer
**Target Completion:** Day 4

---

## Appendix: Mekong-cli Hub Benefits

**Before (Isolated Agents):**
- 24 agents operate independently
- No coordination between agents
- Duplicate API calls
- No centralized monitoring

**After (Mekong Hub):**
- Centralized orchestration
- Agent discovery and communication
- Event-driven architecture
- Health monitoring dashboard
- Task queue and load balancing
- Reduced API calls (shared context)
