import { useState, useMemo } from 'react';

export interface LoginActivity {
    id: string;
    timestamp: string;
    device: string;
    location: string;
    ip: string;
    status: 'success' | 'failed' | 'blocked';
}

export interface SecuritySettings {
    twoFactorEnabled: boolean;
    passwordLastChanged: string;
    loginAlerts: boolean;
    sessionTimeout: number;
}

const DEMO_LOGIN_ACTIVITY: LoginActivity[] = [
    { id: 'la1', timestamp: 'Hôm nay, 20:01', device: 'Chrome trên macOS', location: 'Hồ Chí Minh, VN', ip: '113.xxx.xxx.xxx', status: 'success' },
    { id: 'la2', timestamp: 'Hôm nay, 19:35', device: 'Safari trên iOS', location: 'Hà Nội, VN', ip: '14.xxx.xxx.xxx', status: 'success' },
    { id: 'la3', timestamp: 'Hôm qua, 15:22', device: 'Firefox trên Windows', location: 'Unknown', ip: '185.xxx.xxx.xxx', status: 'blocked' },
    { id: 'la4', timestamp: '10/01/2026, 09:15', device: 'Chrome trên Android', location: 'Đà Nẵng, VN', ip: '27.xxx.xxx.xxx', status: 'failed' },
];

const INITIAL_SETTINGS: SecuritySettings = {
    twoFactorEnabled: false,
    passwordLastChanged: '15/12/2025',
    loginAlerts: true,
    sessionTimeout: 30,
};

export function useAdminSecuritySettingsFormState() {
    const [settings, setSettings] = useState<SecuritySettings>(INITIAL_SETTINGS);
    const [loginActivity] = useState<LoginActivity[]>(DEMO_LOGIN_ACTIVITY);
    const [showSetup2FA, setShowSetup2FA] = useState(false);
    const [loading2FA, setLoading2FA] = useState(false);

    // Stable QR pattern — generated once per component mount
    const qrPattern = useMemo(() =>
        Array.from({ length: 36 }, () => Math.random() > 0.5),
    []);

    const handle2FAToggle = async (enabled: boolean) => {
        if (enabled) {
            setShowSetup2FA(true);
        } else {
            setLoading2FA(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSettings(prev => ({ ...prev, twoFactorEnabled: false }));
            setLoading2FA(false);
        }
    };

    const complete2FASetup = async () => {
        setLoading2FA(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSettings(prev => ({ ...prev, twoFactorEnabled: true }));
        setShowSetup2FA(false);
        setLoading2FA(false);
    };

    const updateSetting = <K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return {
        settings,
        loginActivity,
        showSetup2FA,
        setShowSetup2FA,
        loading2FA,
        qrPattern,
        handle2FAToggle,
        complete2FASetup,
        updateSetting,
    };
}
