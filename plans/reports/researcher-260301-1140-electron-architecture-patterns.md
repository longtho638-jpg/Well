# Electron Architecture & Design Patterns Research

**Date:** 2026-03-01 10:40
**Scope:** Architecture patterns from electron/electron GitHub repository
**Target:** Mapping patterns to React/TypeScript RaaS health platform
**Status:** ✅ Complete

---

## Executive Summary

Electron's architecture demonstrates sophisticated separation of concerns across multiple process models, security boundaries, and extensibility mechanisms. The framework provides critical patterns for:

1. **Multi-process coordination** via IPC channels with privilege validation
2. **Security-first design** through context isolation, sandboxing, and CSP
3. **Extensibility** via preload scripts and plugin architectures
4. **Performance** through lazy loading, code splitting, and process pooling
5. **Reliability** via crash reporting and lifecycle management

This report maps 8 architectural domains with concrete code patterns applicable to Well's health platform modernization.

---

## 1. PROCESS ARCHITECTURE: Main → Renderer → Preload Model

### Pattern Overview

Electron separates concerns into three runtime contexts, inheriting Chromium's architecture:

```
┌─────────────────────────────────────────────────────────┐
│ Main Process (Node.js environment)                      │
│ ├─ Creates/manages BrowserWindow instances              │
│ ├─ Access to native APIs (fs, path, os)                 │
│ ├─ Single instance per app                              │
│ └─ Lifecycle: app.on('ready'), app.on('will-quit')     │
├─────────────────────────────────────────────────────────┤
│ Preload Script (Context Bridge)                         │
│ ├─ Runs BEFORE renderer loads web content               │
│ ├─ Has access to Node.js APIs & Electron modules        │
│ ├─ Exposed selectively via contextBridge                │
│ └─ Acts as privilege mediator                           │
├─────────────────────────────────────────────────────────┤
│ Renderer Process (Chromium/V8)                          │
│ ├─ Renders web content (HTML/CSS/JS)                    │
│ ├─ Multiple instances (one per BrowserWindow)           │
│ ├─ Isolated memory & resources                          │
│ └─ Web APIs only (fetch, DOM, Web Workers)              │
└─────────────────────────────────────────────────────────┘
```

### Key Communication Pattern

**IPC Channels**: Arbitrary bidirectional channels using named pipes (faster, more secure than network protocols).

```typescript
// Main Process: Listen to renderer events
ipcMain.handle('invoke-expensive-operation', async (event, ...args) => {
  // Validate sender origin
  if (event.senderFrame.url !== 'app://') {
    throw new Error('Unauthorized');
  }

  // Execute privilege operation
  const result = await expensiveNativeOperation(args);
  return result;
});

// Preload Script: Expose safe API surface
contextBridge.exposeInMainWorld('api', {
  invokeOperation: (args) => ipcRenderer.invoke('invoke-expensive-operation', args)
});

// Renderer Process: Call through bridge
const result = await window.api.invokeOperation(data);
```

### Mapping to Well Health Platform

**Current state:** React hooks dispatching Redux actions directly
**Pattern application:**

```typescript
// src/services/ipc-bridge.ts
export const ipcBridge = {
  // Health data operations (main process privilege)
  async syncHealthData(patientId: string) {
    return ipcRenderer.invoke('health:sync-data', { patientId });
  },

  // File I/O operations (main process privilege)
  async exportReport(reportId: string, path: string) {
    return ipcRenderer.invoke('health:export-report', { reportId, path });
  },

  // Credential management (main process privilege)
  async getStoredCredentials() {
    return ipcRenderer.invoke('health:get-credentials');
  }
};

// src/hooks/useHealthData.ts
export function useHealthData(patientId: string) {
  const [data, setData] = useState(null);

  useEffect(() => {
    ipcBridge.syncHealthData(patientId)
      .then(setData)
      .catch(error => console.error(error));
  }, [patientId]);

  return data;
}
```

**Advantages for Well:**
- Sensitive operations (credential storage, file encryption) isolated from renderer
- XSS in renderer cannot access system APIs directly
- Privilege escalation requires explicit main process validation

---

## 2. MODULE SYSTEM: Browser/Renderer/Common Organization

### Electron's Module Organization

```
electron/
├── shell/
│   ├── browser/          # Main process C++ implementations
│   ├── renderer/         # Renderer process APIs
│   ├── common/           # Shared code (both processes)
│   └── app/
├── lib/
│   ├── browser/          # JS bindings for main process
│   ├── renderer/         # JS bindings for renderer
│   ├── common/           # Shared utilities
│   └── isolated_renderer/
└── spec/
    ├── fixtures/
    └── api/              # API integration tests
```

### Pattern: Process-Specific Modules

Electron enforces strict module loading based on context:

```typescript
// lib/browser/api/app.ts - Main process only
export class App extends EventEmitter {
  getPath(name: string) { /* Node.js fs access */ }
  quit() { /* System exit */ }
}

// lib/renderer/api/ipc-renderer.ts - Renderer only
export class IPCRenderer extends EventEmitter {
  send(channel: string, ...args: any[]) { /* IPC send */ }
  invoke(channel: string, ...args: any[]) { /* Promise-based */ }
}

// lib/common/api/structures.ts - Both processes
export interface Point { x: number; y: number; }
```

### Mapping to Well Health Platform

**Structure proposal for modularization:**

```
src/
├── services/
│   ├── health-data/
│   │   ├── browser/
│   │   │   └── health-data-repository.ts    # DB access, main-only
│   │   ├── renderer/
│   │   │   └── health-data-hook.ts          # React hook only
│   │   └── common/
│   │       └── health-data.types.ts         # Shared types
│   │
│   ├── encryption/
│   │   ├── browser/
│   │   │   └── crypto-engine.ts             # Native crypto, main-only
│   │   ├── renderer/
│   │   │   └── useEncryptedData.ts          # Renderer hook
│   │   └── common/
│   │       └── encryption.types.ts
│   │
│   └── ipc/
│       ├── browser/
│       │   └── ipc-handlers.ts              # All ipcMain.handle()
│       ├── renderer/
│       │   └── ipc-client.ts                # All ipcRenderer.invoke()
│       └── common/
│           └── ipc-channels.const.ts        # Channel names (DRY)
│
├── components/
│   ├── PatientDashboard/
│   │   ├── PatientDashboard.tsx             # React component
│   │   ├── usePatientData.ts                # Custom hook
│   │   └── PatientDashboard.test.tsx
│   │
│   └── HealthChart/
│       └── ...
│
└── main.ts                                  # Main process entry
```

**Benefits:**
- Clear process boundaries (browser/ vs renderer/)
- Shared types prevent serialization bugs
- Easy to test each process independently

---

## 3. AGENT/SERVICE PATTERN: Lifecycle & State Management

### Electron Lifecycle Pattern

Main process manages application state through lifecycle events:

```typescript
// Main process lifecycle management
app.on('ready', () => {
  // 1. Initialize services
  const healthDataService = new HealthDataService();
  const encryptionService = new EncryptionService();

  // 2. Create renderer windows
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });

  // 3. Register IPC handlers
  setupIPCHandlers(healthDataService, encryptionService);

  mainWindow.loadURL(isDev ? 'http://localhost:5173' : `file://${__dirname}/app/index.html`);
});

app.on('before-quit', () => {
  // Cleanup: save state, close DB connections
  healthDataService.shutdown();
  encryptionService.cleanup();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

### Service Pattern with Dependency Injection

```typescript
// src/services/service-container.ts (Main process)
export class ServiceContainer {
  private healthDataService: HealthDataService;
  private encryptionService: EncryptionService;
  private auditService: AuditService;

  async initialize(): Promise<void> {
    this.encryptionService = new EncryptionService();
    this.healthDataService = new HealthDataService(
      this.encryptionService
    );
    this.auditService = new AuditService();

    await this.healthDataService.initializeDatabase();
  }

  getHealthDataService() { return this.healthDataService; }
  getEncryptionService() { return this.encryptionService; }
  getAuditService() { return this.auditService; }

  async shutdown(): Promise<void> {
    await this.healthDataService.closeDatabase();
    this.encryptionService.cleanup();
  }
}

// src/main.ts
const container = new ServiceContainer();
app.on('ready', async () => {
  await container.initialize();

  // Register handlers with container
  ipcMain.handle('health:fetch-patient', async (event, patientId) => {
    return container.getHealthDataService().getPatient(patientId);
  });
});
```

### Mapping to Well: Agent-Based Architecture

```typescript
// src/agents/browser/health-data-agent.ts
export class HealthDataAgent {
  constructor(
    private repository: HealthDataRepository,
    private encryption: CryptoEngine,
    private auditLog: AuditLogger
  ) {}

  async fetchPatientWithAudit(patientId: string, userId: string) {
    // 1. Validate permission
    const hasAccess = await this.repository.checkUserAccess(patientId, userId);
    if (!hasAccess) throw new Error('Unauthorized');

    // 2. Fetch encrypted data
    const encrypted = await this.repository.getPatient(patientId);

    // 3. Decrypt with audit
    const decrypted = this.encryption.decrypt(encrypted.data);

    // 4. Log access
    this.auditLog.recordAccess({
      patientId,
      userId,
      timestamp: new Date(),
      action: 'PATIENT_VIEW'
    });

    return decrypted;
  }
}

// src/ipc/browser/health-handlers.ts
export function registerHealthHandlers(
  ipcMain: IpcMain,
  agent: HealthDataAgent
) {
  ipcMain.handle('health:fetch-patient', async (event, patientId) => {
    const userId = event.sender.id; // Extract context
    return agent.fetchPatientWithAudit(patientId, userId);
  });
}
```

---

## 4. SECURITY MODEL: Context Isolation, Sandbox, CSP

### Security Hierarchy

```
┌──────────────────────────────────────────────────────────┐
│ 1. CONTEXT ISOLATION (Default: true since Electron 12)  │
│    ├─ Preload script runs in DIFFERENT V8 context       │
│    ├─ Renderer cannot access preload's global object    │
│    └─ contextBridge is ONLY bridge                       │
├──────────────────────────────────────────────────────────┤
│ 2. SANDBOX (Default: true since Electron 5)             │
│    ├─ Renderer process runs in OS-level sandbox         │
│    ├─ Limited file system, network, system access       │
│    └─ Can only use explicitly exposed APIs              │
├──────────────────────────────────────────────────────────┤
│ 3. CONTENT SECURITY POLICY                              │
│    ├─ Prevents inline script execution                  │
│    ├─ Whitelists allowed resource sources               │
│    └─ Mitigates XSS attacks                             │
└──────────────────────────────────────────────────────────┘
```

### Implementation Pattern

```typescript
// src/main.ts - BrowserWindow configuration
const mainWindow = new BrowserWindow({
  webPreferences: {
    // 1. Context Isolation: ENABLED
    contextIsolation: true,

    // 2. Preload script
    preload: path.join(__dirname, 'preload.js'),

    // 3. Sandbox: ENABLED
    sandbox: true,

    // 4. Node integration: DISABLED
    nodeIntegration: false,

    // 5. Enable V8 code caching
    v8CacheOptions: 'codeAware',

    // 6. Disable DevTools in production
    devTools: isDev
  }
});

// 7. CSP Header
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://api.health-service.com"
      ].join('; ')
    }
  });
});
```

### Secure Preload Script Pattern

```typescript
// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// NEVER expose raw ipcRenderer
contextBridge.exposeInMainWorld('api', {
  // Safe: High-level, parameterized operations only

  health: {
    async fetchPatient(patientId: string) {
      // Validation at source
      if (!patientId || typeof patientId !== 'string') {
        throw new Error('Invalid patientId');
      }
      return ipcRenderer.invoke('health:fetch-patient', patientId);
    },

    async exportReport(reportId: string, format: 'pdf' | 'csv') {
      if (!['pdf', 'csv'].includes(format)) {
        throw new Error('Invalid format');
      }
      return ipcRenderer.invoke('health:export-report', reportId, format);
    }
  },

  // UNSAFE: Do NOT expose these
  // ipcRenderer:          // Raw IPC = privilege escalation vector
  // process:              // Process API
  // fs:                   // File system
  // child_process:        // Command execution
  // eval/Function:        // Code execution
});
```

### IPC Handler Validation Pattern (Defense-in-depth)

```typescript
// src/ipc/browser/ipc-handlers.ts
ipcMain.handle('health:fetch-patient', async (event, patientId) => {
  // 1. Validate sender origin
  const allowedOrigins = isDev
    ? ['http://localhost:5173']
    : ['app://'];

  if (!allowedOrigins.includes(event.senderFrame.url)) {
    throw new Error('Unauthorized sender');
  }

  // 2. Validate input schema
  const schema = z.string().uuid();
  const validated = schema.safeParse(patientId);
  if (!validated.success) {
    throw new Error('Invalid patientId format');
  }

  // 3. Validate permission (from main process context, NOT renderer)
  const userId = getUserIdFromProcess(event.sender); // NOT from message
  const hasAccess = await permissionService.checkAccess(userId, patientId);
  if (!hasAccess) {
    throw new Error('Access denied');
  }

  // 4. Execute operation
  return await healthService.getPatient(patientId);
});
```

---

## 5. BUILD SYSTEM: GN/Ninja + CI/CD Pattern

### Build Architecture

```
GN (Generate Ninja) Configuration:
├─ Project generation (create build.ninja)
├─ Configuration in .gn and .gni files
├─ Arguments in build/args/{debug,release,testing}.gn

Ninja Build:
├─ Fast, parallel compilation
├─ C++ compilation for electron/shell/
├─ TypeScript compilation for electron/lib/
└─ Asset bundling

Output:
├─ Electron prebuilt binary
└─ Node modules for distribution
```

### CI/CD Pipeline Pattern (Multi-platform)

```yaml
# .github/workflows/build.yml
name: Build & Release

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: node-setup-action@v2
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    needs: test
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: node-setup-action@v2
      - run: npm ci
      - run: npm run build
      - run: npm run electron:build
      - uses: actions/upload-artifact@v3
        with:
          name: dist-${{ matrix.os }}
          path: dist/

  release:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
      - run: npm run publish
```

### Mapping to Well's Build Strategy

```json
{
  "build": {
    "scripts": {
      "dev": "concurrently \"npm run web:dev\" \"npm run electron:dev\"",
      "build": "npm run web:build && npm run electron:build",
      "web:dev": "vite --port 5173",
      "web:build": "vite build",
      "electron:dev": "wait-on tcp:5173 && electron .",
      "electron:build": "electron-builder",
      "test": "vitest --coverage",
      "lint": "eslint src --fix && tsc --noEmit"
    },
    "electron-builder": {
      "appId": "com.wellnexus.health",
      "files": ["dist/**/*", "node_modules/**/*"],
      "directories": {
        "buildResources": "assets",
        "output": "release"
      },
      "mac": { "target": ["dmg", "zip"] },
      "win": { "target": ["msi", "nsis"] },
      "linux": { "target": ["AppImage", "deb"] }
    }
  }
}
```

---

## 6. EXTENSION/PLUGIN ARCHITECTURE

### Plugin System Pattern

Electron lacks native plugin system; community patterns use NPM-based loading:

```typescript
// src/plugins/plugin-registry.ts
export interface ElectronPlugin {
  id: string;
  version: string;

  // Lifecycle hooks
  onLoad(mainApi: MainAPI): Promise<void>;
  onUnload(): Promise<void>;

  // Extension points
  registerIpcHandlers?(ipcMain: IpcMain): void;
  registerRendererHooks?(window: Window): void;
  registerMenuItems?(Menu: MenuConstructor): void;
}

export class PluginRegistry {
  private plugins = new Map<string, ElectronPlugin>();

  async loadPlugin(pluginPath: string): Promise<void> {
    const { default: PluginClass } = await import(pluginPath);
    const plugin = new PluginClass();

    await plugin.onLoad({
      ipcMain,
      app,
      BrowserWindow,
      // ... expose safe main APIs
    });

    this.plugins.set(plugin.id, plugin);
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      await plugin.onUnload();
      this.plugins.delete(pluginId);
    }
  }
}
```

### Well Health Plugin Example

```typescript
// src/plugins/integration-example/blood-pressure-monitor.plugin.ts
export class BloodPressureMonitorPlugin implements ElectronPlugin {
  id = 'blood-pressure-monitor';
  version = '1.0.0';

  async onLoad(mainApi: MainAPI) {
    // Register hardware interface handler
    mainApi.ipcMain.handle('bpm:connect-device', async (event, devicePath) => {
      const device = await this.connectDevice(devicePath);
      return { connected: true, deviceId: device.id };
    });

    // Register polling handler
    mainApi.ipcMain.handle('bpm:start-polling', async (event, interval) => {
      this.startPollingInterval(interval);
      return { polling: true };
    });
  }

  registerRendererHooks(window: Window) {
    // Expose hook for renderer process
    window.addEventListener('bpm:reading', (event: CustomEvent) => {
      // Handle new blood pressure reading
      this.onNewReading(event.detail);
    });
  }

  registerMenuItems(Menu: MenuConstructor) {
    Menu.getApplicationMenu()?.append(
      new MenuItem({
        label: 'BP Monitor',
        submenu: [
          { label: 'Connect Device', click: () => this.showConnectDialog() },
          { label: 'Settings', click: () => this.showSettings() }
        ]
      })
    );
  }

  private async connectDevice(path: string) {
    // Hardware interface implementation
    return { id: 'device-1', type: 'omron-bp' };
  }

  private startPollingInterval(interval: number) {
    setInterval(async () => {
      const reading = await this.readLatestValue();
      mainWindow?.webContents.send('bpm:new-reading', reading);
    }, interval);
  }

  async onUnload() {
    // Cleanup: close device connection, stop polling
  }
}
```

---

## 7. ERROR HANDLING & CRASH REPORTING

### Crash Reporter Pattern

```typescript
// src/main.ts - Initialize early, before app.ready
import { crashReporter } from 'electron';

if (!isDev) {
  crashReporter.start({
    productName: 'WellNexus',
    companyName: 'WellNexus Inc',
    uploadToServer: true,
    rateLimit: true, // Max 1 crash/hour on macOS/Windows
    extra: {
      appVersion: app.getVersion(),
      userId: getStoredUserId(),
      environment: 'production'
    }
  });
}

// Set custom crash dump location
app.setPath('crashDumps', path.join(app.getPath('userData'), 'crashes'));
```

### Error Boundary Pattern (Renderer)

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to main process for crash reporting
    window.api?.reportError({
      message: error.message,
      stack: error.stack,
      component: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Main Process Error Handling

```typescript
// src/main.ts
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);

  // Log to file
  fs.appendFileSync(
    path.join(app.getPath('userData'), 'error.log'),
    `${new Date().toISOString()}: ${error.stack}\n`
  );

  // In development, exit; in production, continue
  if (isDev) process.exit(1);
});

app.on('renderer-process-crashed', (event, webContents, killed) => {
  console.error('Renderer process crashed', { killed });

  // Attempt recovery
  if (!killed) {
    const window = BrowserWindow.fromWebContents(webContents);
    window?.reload();
  }
});
```

---

## 8. PERFORMANCE PATTERNS: Lazy Loading & Process Pooling

### Code Splitting Strategy

```typescript
// src/components/Dashboard.tsx
import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

// Route-based code splitting
const PatientList = lazy(() => import('./PatientList'));
const HealthMetrics = lazy(() => import('./HealthMetrics'));
const ReportGenerator = lazy(() => import('./ReportGenerator'));

export function Dashboard() {
  const [activeTab, setActiveTab] = React.useState('patients');

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        {activeTab === 'patients' && <PatientList />}
        {activeTab === 'metrics' && <HealthMetrics />}
        {activeTab === 'reports' && <ReportGenerator />}
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Service Worker Pattern (Background Tasks)

```typescript
// src/ipc/browser/worker-pool.ts
import { Worker } from 'node:worker_threads';

export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{ task: any; resolve: Function; reject: Function }> = [];

  constructor(poolSize: number = 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker('./worker-script.js');
      this.workers.push(worker);
    }
  }

  async executeTask(task: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const { task, resolve, reject } = this.queue.shift()!;

    availableWorker.once('message', resolve);
    availableWorker.once('error', reject);
    availableWorker.postMessage(task);
  }
}

// Register handler for expensive computation
ipcMain.handle('health:analyze-metrics', async (event, metricsData) => {
  const workerPool = new WorkerPool();
  return workerPool.executeTask({
    type: 'analyze-metrics',
    data: metricsData
  });
});
```

### Lazy Service Initialization

```typescript
// src/services/service-loader.ts
class LazyServiceLoader {
  private services = new Map<string, any>();
  private initialized = new Set<string>();

  async getService<T>(name: string, factory: () => Promise<T>): Promise<T> {
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    if (this.initialized.has(name)) {
      // Initialization in progress, wait for it
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (this.services.has(name)) {
            clearInterval(interval);
            resolve(this.services.get(name));
          }
        }, 100);
      });
    }

    this.initialized.add(name);
    const service = await factory();
    this.services.set(name, service);

    return service;
  }
}

// Usage in main process
const serviceLoader = new LazyServiceLoader();

ipcMain.handle('health:encrypt-data', async (event, data) => {
  const cryptoService = await serviceLoader.getService(
    'crypto',
    () => import('../services/crypto-engine').then(m => m.CryptoEngine.create())
  );
  return cryptoService.encrypt(data);
});
```

### Memory Profiling Pattern

```typescript
// src/main.ts
setInterval(() => {
  const usage = process.memoryUsage();

  const threshold = 200 * 1024 * 1024; // 200MB
  if (usage.heapUsed > threshold) {
    console.warn('High memory usage:', {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB'
    });

    // Trigger garbage collection (if --expose-gc flag used)
    if (global.gc) global.gc();
  }
}, 30000); // Every 30 seconds
```

---

## 9. PRELOAD SCRIPT ARCHITECTURE: Bridge Pattern

### Typed Preload Interface

```typescript
// src/preload.d.ts
declare global {
  interface Window {
    api: {
      health: {
        fetchPatient(patientId: string): Promise<PatientData>;
        updateVitals(patientId: string, vitals: VitalSigns): Promise<void>;
        exportReport(reportId: string, format: 'pdf' | 'csv'): Promise<Blob>;
      };
      system: {
        getAppVersion(): Promise<string>;
        openExternalUrl(url: string): Promise<void>;
      };
      auth: {
        logout(): Promise<void>;
      };
    };
  }
}

export {};
```

### Secure Bridge Implementation

```typescript
// src/preload.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('api', {
  health: {
    async fetchPatient(patientId: string) {
      return ipcRenderer.invoke('health:fetch-patient', patientId);
    },

    async updateVitals(patientId: string, vitals: VitalSigns) {
      return ipcRenderer.invoke('health:update-vitals', patientId, vitals);
    },

    async exportReport(reportId: string, format: 'pdf' | 'csv') {
      return ipcRenderer.invoke('health:export-report', reportId, format);
    },

    // Event listener for real-time updates
    onVitalsUpdate(callback: (vitals: VitalSigns) => void) {
      ipcRenderer.on('health:vitals-update', (event, vitals) => {
        callback(vitals);
      });
    }
  },

  system: {
    async getAppVersion() {
      return ipcRenderer.invoke('system:get-version');
    },

    async openExternalUrl(url: string) {
      return ipcRenderer.invoke('system:open-external', url);
    }
  },

  auth: {
    async logout() {
      return ipcRenderer.invoke('auth:logout');
    }
  }
});
```

---

## 10. ARCHITECTURAL DECISION RECORD (ADR)

### ADR-001: Choose Process Isolation Over Monolithic Renderer

**Decision:** Implement main process for credential/encryption operations

**Rationale:**
- XSS in renderer cannot access sensitive operations
- Credentials never serialized to renderer
- Audit logging in privileged context

**Consequences:**
- Must learn IPC communication patterns
- Additional build complexity (dual bundles)
- Better security posture

---

## 11. UNRESOLVED QUESTIONS & GAPS

1. **Hot Module Replacement (HMR)**: How to implement HMR for both main + renderer without full restart?
   - Electron's main process requires full app restart on changes
   - Renderer can use Vite HMR
   - Investigation needed: nodemon + electron restart pattern

2. **State Synchronization**: How to keep main process state in sync with renderer Redux store?
   - Consider Event Sourcing pattern
   - IPC listener on renderer for main state changes
   - Need prototype for bidirectional sync

3. **Database Encryption**: Should encryption key live in main process memory?
   - Currently: loaded at startup, kept in memory
   - Risk: process dump could expose key
   - Consider: TPM/Keychain integration per OS

4. **Renderer Process Pooling**: Is worker threads pattern viable for compute-heavy health analytics?
   - Tested with metrics analysis, but unclear on memory scaling
   - Need: benchmarks with 10k+ patient records

5. **Plugin Discovery & Validation**: How to safely load third-party plugins (e.g., hardware integrations)?
   - Current pattern: manual registration only
   - Need: signed plugin verification, namespace isolation

6. **Crash Recovery**: Does crash reporter require cloud backend, or can we use local storage?
   - Electron API supports local storage
   - Consider: simple JSON schema, retention policy

---

## 12. MAPPING SUMMARY: Electron → Well Health Platform

| Electron Pattern | Well Implementation | File Path |
|------------------|-------------------|-----------|
| Main/Renderer IPC | Health data fetch, encryption ops | `src/ipc/browser/*`, `src/preload.ts` |
| Process isolation | Credential storage, file I/O | `src/services/browser/*` |
| Context bridge | Safe API surface to renderer | `src/preload.ts` |
| Service container | Agent-based service management | `src/services/service-container.ts` |
| Error boundaries | React error handling + main process logging | `src/components/ErrorBoundary.tsx` |
| Crash reporting | Sentry integration + local logs | `src/main.ts` |
| Code splitting | Route-based lazy loading | `src/components/Dashboard.tsx` |
| Worker threads | Metrics analysis parallelization | `src/ipc/browser/worker-pool.ts` |
| Plugin registry | Hardware integration framework | `src/plugins/plugin-registry.ts` |
| Preload security | Parameterized API with validation | `src/preload.ts`, `src/ipc/browser/*` |

---

## REFERENCES

- [Electron Process Model Documentation](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Inter-Process Communication (IPC) | Electron](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)
- [Context Isolation | Electron](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Advanced Electron.js Architecture - LogRocket](https://blog.logrocket.com/advanced-electron-js-architecture/)
- [Deep Dive into Electron Processes - Cameron Nokes](https://cameronnokes.com/blog/deep-dive-into-electron's-main-and-renderer-processes/)
- [Preload Scripts | Electron](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload)
- [Penetration Testing of Electron Applications - DeepStrike](https://deepstrike.io/blog/penetration-testing-of-electron-based-applications/)
- [Crash Reporter | Electron](https://www.electronjs.org/docs/latest/api/crash-reporter)
- [Build Instructions (GN/Ninja) | Electron](https://github.com/electron/electron/blob/main/docs/development/build-instructions-gn.md)
- [Plugin Architecture for Electron Apps - Beyond Code](https://beyondco.de/blog/plugin-system-for-electron-apps-part-1)
- [Optimizing Electron App Performance - Palette Docs](https://palette.dev/blog/improving-performance-of-electron-apps)

---

**Report completed:** 2026-03-01 10:40 UTC
**Next phase:** Architecture mapping session for Well health platform design review
