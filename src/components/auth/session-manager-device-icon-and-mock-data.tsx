/**
 * session-manager-device-icon-and-mock-data
 * DeviceIcon sub-component and MOCK_SESSIONS fixture data
 * used by the SessionManager component in development mode
 */

import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { Session } from './use-session-manager';

export const DeviceIcon: React.FC<{ device: Session['device'] }> = ({ device }) => {
    switch (device) {
        case 'mobile':
            return <Smartphone className="w-5 h-5" />;
        case 'tablet':
            return <Monitor className="w-5 h-5" />;
        default:
            return <Monitor className="w-5 h-5" />;
    }
};

export const MOCK_SESSIONS: Session[] = [
    {
        id: 'current-session',
        device: 'desktop',
        browser: 'Chrome on macOS',
        location: 'Ho Chi Minh City, VN',
        ip: '113.xxx.xxx.xxx',
        lastActive: 'Active now',
        isCurrent: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mobile-session',
        device: 'mobile',
        browser: 'Safari on iOS',
        location: 'Hanoi, VN',
        ip: '14.xxx.xxx.xxx',
        lastActive: '2 hours ago',
        isCurrent: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
];
