import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../web-push-notification-service';
import { uiLogger } from '@/utils/logger';

// Mock dependencies
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
    from: vi.fn(() => ({
      upsert: mockUpsert,
      delete: mockDelete,
    })),
  },
}));

vi.mock('@/utils/logger', () => ({
  uiLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock globals
global.navigator = {
  serviceWorker: {
    ready: Promise.resolve({
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue({
          toJSON: () => ({ endpoint: 'test-endpoint', keys: { p256dh: 'key', auth: 'auth' } }),
        }),
      },
    }),
  },
} as any;

const mockNotification = {
  requestPermission: vi.fn().mockResolvedValue('granted'),
  permission: 'granted',
};

global.window = {
  atob: (str: string) => Buffer.from(str, 'base64').toString('binary'),
  PushManager: {},
  Notification: mockNotification
} as any;

global.Notification = mockNotification as any;

describe('web-push-notification-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
  });

  it('should throw and log error when subscription upsert fails', async () => {
    // Setup failure
    mockUpsert.mockResolvedValue({ error: { message: 'Upsert failed' } });

    // Mock existing subscription to bypass VAPID check
    global.navigator.serviceWorker.ready = Promise.resolve({
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue({
          toJSON: () => ({ endpoint: 'test-endpoint', keys: { p256dh: 'key', auth: 'auth' } }),
          unsubscribe: vi.fn(),
        }),
        subscribe: vi.fn(),
      },
    }) as any;

    // Desired behavior: Throws error, logs 'Failed to save push subscription'.
    await expect(subscribeToPushNotifications()).rejects.toThrow('Upsert failed');

    expect(uiLogger.error).toHaveBeenCalledWith('Failed to save push subscription', expect.objectContaining({ message: 'Upsert failed' }));
  });

  it('should return false and log error when unsubscribe fails', async () => {
    // Setup failure
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ error: { message: 'Delete failed' } });

    // Mock subscription exists so it tries to delete
    global.navigator.serviceWorker.ready = Promise.resolve({
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue({
          unsubscribe: vi.fn().mockResolvedValue(true),
        }),
      },
    }) as any;

    const result = await unsubscribeFromPushNotifications();

    // Current behavior: Returns true (if unsubscribe succeeds, DB failure ignored).
    // Desired behavior: Returns false? Or throws?
    // The plan says "return false (for unsubscribe)".

    expect(result).toBe(false);
    expect(uiLogger.error).toHaveBeenCalledWith('Failed to remove push subscription', expect.objectContaining({ message: 'Delete failed' }));
  });
});
