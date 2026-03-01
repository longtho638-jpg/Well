/**
 * Tests for Uptime-Kuma-inspired agent monitoring patterns:
 * - AgentHeartbeatMonitor (heartbeat loop, retry, maintenance)
 * - NotificationDispatcher (multi-channel, rules, cooldown)
 * - AgentStatusPage (aggregation, incidents, groups)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { agentHeartbeatMonitor } from '@/lib/vibe-agent/agent-heartbeat-monitor';
import {
  notificationDispatcher,
  consoleLogProvider,
  createInAppProvider,
  type AgentAlert,
  type NotificationProvider,
} from '@/lib/vibe-agent/notification-dispatcher';
import { agentStatusPage } from '@/lib/vibe-agent/agent-status-page';
import { agentHealthMonitor } from '@/lib/vibe-agent/agent-health-monitor';

// ─── Heartbeat Monitor Tests ───────────────────────────────

describe('AgentHeartbeatMonitor', () => {
  beforeEach(() => {
    agentHeartbeatMonitor.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should register and probe an agent successfully', async () => {
    const probe = vi.fn().mockResolvedValue(true);
    agentHeartbeatMonitor.register('test-agent', probe, { retryCount: 0, timeoutMs: 5000 });

    const record = await agentHeartbeatMonitor.beat('test-agent');

    expect(record).not.toBeNull();
    expect(record!.status).toBe('up');
    expect(record!.message).toBe('OK');
    expect(probe).toHaveBeenCalledOnce();
  });

  it('should mark agent DOWN after retries exhausted', async () => {
    vi.useRealTimers();

    const probe = vi.fn().mockResolvedValue(false);
    agentHeartbeatMonitor.register('failing-agent', probe, {
      retryCount: 2,
      retryDelayMs: 10,
      timeoutMs: 5000,
    });

    const record = await agentHeartbeatMonitor.beat('failing-agent');

    expect(record!.status).toBe('down');
    // 1 initial + 2 retries = 3 calls
    expect(probe).toHaveBeenCalledTimes(3);

    vi.useFakeTimers();
  });

  it('should handle probe timeout', async () => {
    const probe = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 20000)),
    );
    agentHeartbeatMonitor.register('slow-agent', probe, {
      retryCount: 0,
      timeoutMs: 100,
    });

    // Use real timers for this specific test
    vi.useRealTimers();
    const record = await agentHeartbeatMonitor.beat('slow-agent');
    vi.useFakeTimers();

    expect(record!.status).toBe('down');
    expect(record!.message).toContain('timeout');
  });

  it('should set maintenance window and skip probing', async () => {
    const probe = vi.fn().mockResolvedValue(true);
    agentHeartbeatMonitor.register('maint-agent', probe);

    agentHeartbeatMonitor.setMaintenance('maint-agent', 60_000);

    const record = await agentHeartbeatMonitor.beat('maint-agent');

    expect(record!.status).toBe('maintenance');
    expect(record!.message).toContain('Maintenance');
    expect(probe).not.toHaveBeenCalled();
  });

  it('should clear maintenance window', async () => {
    const probe = vi.fn().mockResolvedValue(true);
    agentHeartbeatMonitor.register('maint-agent-2', probe, { retryCount: 0 });

    agentHeartbeatMonitor.setMaintenance('maint-agent-2', 60_000);
    agentHeartbeatMonitor.clearMaintenance('maint-agent-2');

    const record = await agentHeartbeatMonitor.beat('maint-agent-2');

    expect(record!.status).toBe('up');
    expect(probe).toHaveBeenCalledOnce();
  });

  it('should calculate uptime percentage correctly', async () => {
    const probe = vi.fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    agentHeartbeatMonitor.register('uptime-agent', probe, { retryCount: 0 });

    await agentHeartbeatMonitor.beat('uptime-agent');
    await agentHeartbeatMonitor.beat('uptime-agent');
    await agentHeartbeatMonitor.beat('uptime-agent');
    await agentHeartbeatMonitor.beat('uptime-agent');

    const status = agentHeartbeatMonitor.getStatus('uptime-agent');
    expect(status!.uptimePercent).toBe(75);
  });

  it('should return status page data', async () => {
    const probe = vi.fn().mockResolvedValue(true);
    agentHeartbeatMonitor.register('agent-a', probe, { retryCount: 0 });
    agentHeartbeatMonitor.register('agent-b', probe, { retryCount: 0 });

    await agentHeartbeatMonitor.beat('agent-a');
    await agentHeartbeatMonitor.beat('agent-b');

    const page = agentHeartbeatMonitor.getStatusPage();
    expect(page).toHaveLength(2);
    expect(page[0].status).toBe('up');
    expect(page[1].status).toBe('up');
  });

  it('should calculate system uptime', async () => {
    const upProbe = vi.fn().mockResolvedValue(true);
    const downProbe = vi.fn().mockResolvedValue(false);

    agentHeartbeatMonitor.register('up-agent', upProbe, { retryCount: 0 });
    agentHeartbeatMonitor.register('down-agent', downProbe, { retryCount: 0 });

    await agentHeartbeatMonitor.beat('up-agent');
    await agentHeartbeatMonitor.beat('down-agent');

    const systemUptime = agentHeartbeatMonitor.getSystemUptime();
    expect(systemUptime.totalMonitors).toBe(2);
    expect(systemUptime.upCount).toBe(1);
    expect(systemUptime.downCount).toBe(1);
  });

  it('should notify on DOWN transition', async () => {
    const notifyHandler = vi.fn();
    agentHeartbeatMonitor.setNotificationHandler(notifyHandler);

    const probe = vi.fn().mockResolvedValue(false);
    agentHeartbeatMonitor.register('notify-agent', probe, { retryCount: 0 });

    // First beat DOWN → should trigger initial notification
    await agentHeartbeatMonitor.beat('notify-agent');

    expect(notifyHandler).toHaveBeenCalledWith(
      'notify-agent',
      'down',
      expect.stringContaining('DOWN'),
    );
  });

  it('should notify on recovery (DOWN → UP)', async () => {
    const notifyHandler = vi.fn();
    agentHeartbeatMonitor.setNotificationHandler(notifyHandler);

    const probe = vi.fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    agentHeartbeatMonitor.register('recover-agent', probe, { retryCount: 0 });

    await agentHeartbeatMonitor.beat('recover-agent'); // DOWN
    await agentHeartbeatMonitor.beat('recover-agent'); // UP (recovery)

    expect(notifyHandler).toHaveBeenCalledTimes(2);
    expect(notifyHandler).toHaveBeenLastCalledWith(
      'recover-agent',
      'up',
      expect.stringContaining('recovered'),
    );
  });

  it('should return null for unknown agent', async () => {
    const record = await agentHeartbeatMonitor.beat('nonexistent');
    expect(record).toBeNull();
  });
});

// ─── Notification Dispatcher Tests ─────────────────────────

describe('NotificationDispatcher', () => {
  beforeEach(() => {
    notificationDispatcher.clear();
  });

  it('should register providers and dispatch alerts', async () => {
    const mockProvider: NotificationProvider = {
      name: 'TestProvider',
      channel: 'log',
      send: vi.fn().mockResolvedValue(true),
    };

    notificationDispatcher.registerProvider(mockProvider);
    notificationDispatcher.addRule({
      name: 'all-alerts',
      agentFilter: [],
      minSeverity: 'info',
      channels: ['log'],
      cooldownMs: 0,
    });

    const alert = notificationDispatcher.createAlert(
      'test-agent',
      'warning',
      'Test Alert',
      'Something happened',
    );

    const result = await notificationDispatcher.dispatch(alert);

    expect(result.sent).toContain('log:TestProvider');
    expect(result.failed).toHaveLength(0);
    expect(mockProvider.send).toHaveBeenCalledOnce();
  });

  it('should filter alerts by severity threshold', async () => {
    const mockProvider: NotificationProvider = {
      name: 'CriticalOnly',
      channel: 'push',
      send: vi.fn().mockResolvedValue(true),
    };

    notificationDispatcher.registerProvider(mockProvider);
    notificationDispatcher.addRule({
      name: 'critical-only',
      agentFilter: [],
      minSeverity: 'critical',
      channels: ['push'],
      cooldownMs: 0,
    });

    // Info alert should NOT trigger
    const infoAlert = notificationDispatcher.createAlert('agent', 'info', 'Info', 'msg');
    await notificationDispatcher.dispatch(infoAlert);
    expect(mockProvider.send).not.toHaveBeenCalled();

    // Critical alert SHOULD trigger
    const critAlert = notificationDispatcher.createAlert('agent', 'critical', 'Critical!', 'msg');
    const critResult = await notificationDispatcher.dispatch(critAlert);
    expect(mockProvider.send).toHaveBeenCalledOnce();
    expect(critResult.sent).toContain('push:CriticalOnly');
  });

  it('should filter alerts by agent name', async () => {
    const mockProvider: NotificationProvider = {
      name: 'AgentSpecific',
      channel: 'in-app',
      send: vi.fn().mockResolvedValue(true),
    };

    notificationDispatcher.registerProvider(mockProvider);
    notificationDispatcher.addRule({
      name: 'sales-only',
      agentFilter: ['Sales Copilot'],
      minSeverity: 'info',
      channels: ['in-app'],
      cooldownMs: 0,
    });

    // Wrong agent — should not trigger
    const otherAlert = notificationDispatcher.createAlert('Other Agent', 'critical', 'X', 'msg');
    await notificationDispatcher.dispatch(otherAlert);
    expect(mockProvider.send).not.toHaveBeenCalled();

    // Matching agent — should trigger
    const salesAlert = notificationDispatcher.createAlert('Sales Copilot', 'info', 'Y', 'msg');
    await notificationDispatcher.dispatch(salesAlert);
    expect(mockProvider.send).toHaveBeenCalledOnce();
  });

  it('should respect cooldown period', async () => {
    vi.useFakeTimers();

    const mockProvider: NotificationProvider = {
      name: 'CooldownTest',
      channel: 'webhook',
      send: vi.fn().mockResolvedValue(true),
    };

    notificationDispatcher.registerProvider(mockProvider);
    notificationDispatcher.addRule({
      name: 'with-cooldown',
      agentFilter: [],
      minSeverity: 'info',
      channels: ['webhook'],
      cooldownMs: 60_000,
    });

    const alert1 = notificationDispatcher.createAlert('agent', 'warning', 'First', 'msg');
    await notificationDispatcher.dispatch(alert1);
    expect(mockProvider.send).toHaveBeenCalledTimes(1);

    // Second alert within cooldown — should be skipped
    const alert2 = notificationDispatcher.createAlert('agent', 'warning', 'Second', 'msg');
    const result2 = await notificationDispatcher.dispatch(alert2);
    expect(mockProvider.send).toHaveBeenCalledTimes(1);
    expect(result2.skipped).toContain('with-cooldown(cooldown)');

    // Advance past cooldown
    vi.advanceTimersByTime(60_001);

    const alert3 = notificationDispatcher.createAlert('agent', 'warning', 'Third', 'msg');
    await notificationDispatcher.dispatch(alert3);
    expect(mockProvider.send).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('should handle provider failures gracefully', async () => {
    const failProvider: NotificationProvider = {
      name: 'FailProvider',
      channel: 'email',
      send: vi.fn().mockRejectedValue(new Error('SMTP error')),
    };

    notificationDispatcher.registerProvider(failProvider);
    notificationDispatcher.addRule({
      name: 'all',
      agentFilter: [],
      minSeverity: 'info',
      channels: ['email'],
      cooldownMs: 0,
    });

    const alert = notificationDispatcher.createAlert('agent', 'critical', 'Down', 'msg');
    const result = await notificationDispatcher.dispatch(alert);

    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].error).toContain('SMTP error');
  });

  it('should create in-app provider that calls callback', async () => {
    const alerts: AgentAlert[] = [];
    const inAppProvider = createInAppProvider((a: AgentAlert) => alerts.push(a));

    notificationDispatcher.registerProvider(inAppProvider);
    notificationDispatcher.addRule({
      name: 'in-app',
      agentFilter: [],
      minSeverity: 'info',
      channels: ['in-app'],
      cooldownMs: 0,
    });

    const alert = notificationDispatcher.createAlert('agent', 'info', 'Hello', 'world');
    await notificationDispatcher.dispatch(alert);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].title).toBe('Hello');
  });

  it('should return alert history', async () => {
    notificationDispatcher.registerProvider(consoleLogProvider);

    const alert1 = notificationDispatcher.createAlert('a', 'info', 'First', 'msg');
    const alert2 = notificationDispatcher.createAlert('b', 'warning', 'Second', 'msg');
    await notificationDispatcher.dispatch(alert1);
    await notificationDispatcher.dispatch(alert2);

    const history = notificationDispatcher.getHistory(10);
    expect(history).toHaveLength(2);
    // Most recent first
    expect(history[0].title).toBe('Second');
  });

  it('should list provider status', () => {
    notificationDispatcher.registerProvider(consoleLogProvider);
    const status = notificationDispatcher.getProviderStatus();
    expect(status).toHaveLength(1);
    expect(status[0].name).toBe('ConsoleLogger');
    expect(status[0].channel).toBe('log');
  });
});

// ─── Status Page Tests ─────────────────────────────────────

describe('AgentStatusPage', () => {
  beforeEach(() => {
    agentStatusPage.clear();
    agentHealthMonitor.clear();
    agentHeartbeatMonitor.clear();
    notificationDispatcher.clear();
  });

  it('should return empty status page data', () => {
    const data = agentStatusPage.getStatusPageData();

    expect(data.title).toBe('Well RaaS Agent-OS Status');
    expect(data.systemStatus).toBe('operational');
    expect(data.agents).toHaveLength(0);
    expect(data.activeIncidents).toHaveLength(0);
    expect(data.systemUptimePercent).toBe(100);
  });

  it('should aggregate heartbeat and health data', async () => {
    // Setup heartbeat
    agentHeartbeatMonitor.register('Agent-A', async () => true, { retryCount: 0 });
    await agentHeartbeatMonitor.beat('Agent-A');

    // Setup health
    agentHealthMonitor.recordSuccess('Agent-A', 50);

    const data = agentStatusPage.getStatusPageData();

    expect(data.agents).toHaveLength(1);
    expect(data.agents[0].agentName).toBe('Agent-A');
    expect(data.agents[0].overallStatus).toBe('operational');
    expect(data.agents[0].uptimePercent).toBe(100);
  });

  it('should detect major outage when agents are down', async () => {
    agentHeartbeatMonitor.register('Down-Agent', async () => false, { retryCount: 0 });
    await agentHeartbeatMonitor.beat('Down-Agent');

    const data = agentStatusPage.getStatusPageData();

    expect(data.systemStatus).toBe('major-outage');
    expect(data.agents[0].overallStatus).toBe('down');
  });

  it('should detect degraded status', () => {
    // 3 successes + 2 consecutive errors = 60% success rate → degraded (not unhealthy)
    agentHealthMonitor.recordSuccess('Slow-Agent', 100);
    agentHealthMonitor.recordSuccess('Slow-Agent', 100);
    agentHealthMonitor.recordSuccess('Slow-Agent', 100);
    agentHealthMonitor.recordError('Slow-Agent', 'timeout', 5000);
    agentHealthMonitor.recordError('Slow-Agent', 'timeout', 5000);

    const data = agentStatusPage.getStatusPageData();

    expect(data.agents[0].overallStatus).toBe('degraded');
    expect(data.systemStatus).toBe('degraded');
  });

  it('should manage incidents', () => {
    const incident = agentStatusPage.createIncident(
      'Database Connection Issues',
      'major',
      ['Sales Copilot', 'Order Agent'],
      'Investigating increased latency on DB connections',
    );

    expect(incident.status).toBe('investigating');
    expect(incident.severity).toBe('major');

    const data = agentStatusPage.getStatusPageData();
    expect(data.activeIncidents).toHaveLength(1);
    expect(data.recentIncidents).toHaveLength(0);

    // Resolve incident
    agentStatusPage.updateIncident(incident.id, 'resolved', 'Root cause identified and fixed');

    const data2 = agentStatusPage.getStatusPageData();
    expect(data2.activeIncidents).toHaveLength(0);
    expect(data2.recentIncidents).toHaveLength(1);
    expect(data2.recentIncidents[0].resolvedAt).not.toBeNull();
  });

  it('should manage monitor groups', () => {
    agentStatusPage.addGroup(
      'Core Agents',
      'Essential business logic agents',
      ['Sales Copilot', 'Coach', 'Order Agent'],
    );

    agentStatusPage.addGroup(
      'Support Agents',
      'Non-critical helper agents',
      ['Docs Manager', 'Scout'],
    );

    const data = agentStatusPage.getStatusPageData();
    expect(data.groups).toHaveLength(2);
    expect(data.groups[0].agents).toHaveLength(3);
  });

  it('should show maintenance status', async () => {
    agentHeartbeatMonitor.register('Maint-Agent', async () => true, { retryCount: 0 });
    agentHeartbeatMonitor.setMaintenance('Maint-Agent', 3600_000);

    await agentHeartbeatMonitor.beat('Maint-Agent');

    const data = agentStatusPage.getStatusPageData();

    expect(data.agents[0].overallStatus).toBe('maintenance');
    expect(data.agents[0].isInMaintenance).toBe(true);
  });

  it('should set custom title', () => {
    agentStatusPage.setTitle('Custom Status Dashboard');
    const data = agentStatusPage.getStatusPageData();
    expect(data.title).toBe('Custom Status Dashboard');
  });

  it('should return recent alerts from notification dispatcher', () => {
    notificationDispatcher.registerProvider(consoleLogProvider);
    const alert = notificationDispatcher.createAlert('agent', 'info', 'Test', 'msg');
    notificationDispatcher.dispatch(alert);

    const alerts = agentStatusPage.getRecentAlerts(5);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
  });
});
