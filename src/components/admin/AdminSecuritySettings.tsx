/**
 * Admin Security Settings Component
 * Auth Max Level - Phase 7
 * 
 * Enterprise security dashboard:
 * - 2FA toggle with setup flow
 * - Login activity log
 * - Password requirements
 * - Session management
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Key,
    Smartphone,
    Clock,
    MapPin,
    Globe,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Calendar,
} from 'lucide-react';
import { useTranslation } from '@/hooks';

// ============================================================
// TYPES
// ============================================================

interface LoginActivity {
    id: string;
    timestamp: string;
    device: string;
    location: string;
    ip: string;
    status: 'success' | 'failed' | 'blocked';
}

interface SecuritySettings {
    twoFactorEnabled: boolean;
    passwordLastChanged: string;
    loginAlerts: boolean;
    sessionTimeout: number; // minutes
}

// ============================================================
// DEMO DATA
// ============================================================

const DEMO_LOGIN_ACTIVITY: LoginActivity[] = [
    {
        id: 'la1',
        timestamp: 'Hôm nay, 20:01',
        device: 'Chrome trên macOS',
        location: 'Hồ Chí Minh, VN',
        ip: '113.xxx.xxx.xxx',
        status: 'success',
    },
    {
        id: 'la2',
        timestamp: 'Hôm nay, 19:35',
        device: 'Safari trên iOS',
        location: 'Hà Nội, VN',
        ip: '14.xxx.xxx.xxx',
        status: 'success',
    },
    {
        id: 'la3',
        timestamp: 'Hôm qua, 15:22',
        device: 'Firefox trên Windows',
        location: 'Unknown',
        ip: '185.xxx.xxx.xxx',
        status: 'blocked',
    },
    {
        id: 'la4',
        timestamp: '10/01/2026, 09:15',
        device: 'Chrome trên Android',
        location: 'Đà Nẵng, VN',
        ip: '27.xxx.xxx.xxx',
        status: 'failed',
    },
];

const INITIAL_SETTINGS: SecuritySettings = {
    twoFactorEnabled: false,
    passwordLastChanged: '15/12/2025',
    loginAlerts: true,
    sessionTimeout: 30,
};

// ============================================================
// COMPONENTS
// ============================================================

const StatusBadge: React.FC<{ status: LoginActivity['status'] }> = ({ status }) => {
    const { t } = useTranslation();
    const config = {
        success: { className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: t('common.success') },
        failed: { className: 'bg-red-500/10 text-red-400 border-red-500/20', label: t('common.failed') },
        blocked: { className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: t('common.blocked') || 'Chặn' },
    };
    const { className, label } = config[status];
    return (
        <span className={`px-2 py-0.5 text-xs font-medium border rounded-full ${className}`}>
            {label}
        </span>
    );
};

const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    loading?: boolean;
}> = ({ enabled, onChange, loading }) => (
    <button
        onClick={() => onChange(!enabled)}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-zinc-700'
            } ${loading ? 'opacity-50' : ''}`}
    >
        <motion.div
            animate={{ x: enabled ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        />
    </button>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export function AdminSecuritySettings() {
    const { t } = useTranslation();
    const [settings, setSettings] = useState<SecuritySettings>(INITIAL_SETTINGS);
    const [loginActivity] = useState<LoginActivity[]>(DEMO_LOGIN_ACTIVITY);
    const [showSetup2FA, setShowSetup2FA] = useState(false);
    const [loading2FA, setLoading2FA] = useState(false);

    const handle2FAToggle = async (enabled: boolean) => {
        if (enabled) {
            setShowSetup2FA(true);
        } else {
            setLoading2FA(true);
            // Simulate API call
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-100">{t('adminsecuritysettings.b_o_m_t_t_i_kho_n')}</h2>
                    <p className="text-sm text-zinc-500">{t('adminsecuritysettings.qu_n_l_c_i_t_b_o_m_t_c_a_b')}</p>
                </div>
            </div>

            {/* Security Score */}
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                        <div>
                            <p className="text-sm text-zinc-400">{t('adminsecuritysettings.i_m_b_o_m_t')}</p>
                            <p className="text-2xl font-bold text-emerald-400">
                                {settings.twoFactorEnabled ? '95' : '70'}{t('adminsecuritysettings.100')}</p>
                        </div>
                    </div>
                    {!settings.twoFactorEnabled && (
                        <div className="text-right">
                            <p className="text-xs text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {t('adminsecuritysettings.b_t_2fa_t_ng_i_m')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 2FA Card */}
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="font-medium text-zinc-100">{t('adminsecuritysettings.x_c_th_c_2_y_u_t')}</p>
                                <p className="text-sm text-zinc-500">
                                    {settings.twoFactorEnabled
                                        ? t('adminsecuritysettings.b_t_2fa_b_o_v')
                                        : t('adminsecuritysettings.th_m_l_p_b_o_m_t')}
                                </p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={settings.twoFactorEnabled}
                            onChange={handle2FAToggle}
                            loading={loading2FA}
                        />
                    </div>
                </div>

                {/* Password Card */}
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Key className="w-5 h-5 text-amber-400" />
                            <div>
                                <p className="font-medium text-zinc-100">{t('adminsecuritysettings.m_t_kh_u')}</p>
                                <p className="text-sm text-zinc-500">
                                    {t('adminsecuritysettings.i_l_n_cu_i')}{settings.passwordLastChanged}
                                </p>
                            </div>
                        </div>
                        <button className="text-sm text-emerald-400 hover:underline">
                            {t('adminsecuritysettings.i_m_t_kh_u')}</button>
                    </div>
                </div>

                {/* Login Alerts */}
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-purple-400" />
                            <div>
                                <p className="font-medium text-zinc-100">{t('adminsecuritysettings.c_nh_b_o_ng_nh_p')}</p>
                                <p className="text-sm text-zinc-500">{t('adminsecuritysettings.nh_n_th_ng_b_o_khi_c_ng_nh')}</p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={settings.loginAlerts}
                            onChange={(v) => setSettings(prev => ({ ...prev, loginAlerts: v }))}
                        />
                    </div>
                </div>

                {/* Session Timeout */}
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-rose-400" />
                            <div>
                                <p className="font-medium text-zinc-100">{t('adminsecuritysettings.th_i_gian_phi_n')}</p>
                                <p className="text-sm text-zinc-500">{t('adminsecuritysettings.t_ng_ng_xu_t_sau')}{settings.sessionTimeout} {t('adminsecuritysettings.ph_t')}</p>
                            </div>
                        </div>
                        <select
                            value={settings.sessionTimeout}
                            onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-1 text-sm"
                        >
                            <option value={15}>{t('adminsecuritysettings.15_ph_t')}</option>
                            <option value={30}>{t('adminsecuritysettings.30_ph_t')}</option>
                            <option value={60}>{t('adminsecuritysettings.1_gi')}</option>
                            <option value={120}>{t('adminsecuritysettings.2_gi')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Login Activity */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-zinc-400" />
                        <h3 className="font-medium text-zinc-100">{t('adminsecuritysettings.l_ch_s_ng_nh_p')}</h3>
                    </div>
                    <span className="text-xs text-zinc-500">{loginActivity.length} {t('adminsecuritysettings.ho_t_ng')}</span>
                </div>
                <div className="divide-y divide-zinc-800">
                    {loginActivity.map((activity) => (
                        <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                        activity.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                            'bg-amber-500/10 text-amber-400'
                                    }`}>
                                    {activity.status === 'success' ? <CheckCircle className="w-5 h-5" /> :
                                        activity.status === 'blocked' ? <Shield className="w-5 h-5" /> :
                                            <AlertTriangle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-medium text-zinc-100">{activity.device}</p>
                                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {activity.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            {activity.ip}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <StatusBadge status={activity.status} />
                                <p className="text-xs text-zinc-500 mt-1">{activity.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2FA Setup Modal */}
            <AnimatePresence>
                {showSetup2FA && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setShowSetup2FA(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Smartphone className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-100">{t('adminsecuritysettings.thi_t_l_p_2fa')}</h3>
                                <p className="text-sm text-zinc-500 mt-2">
                                    {t('adminsecuritysettings.qu_t_m_qr_v_i_ng_d_ng_x_c_th')}</p>
                            </div>

                            {/* QR Placeholder */}
                            <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-48 h-48 flex items-center justify-center">
                                <div className="w-40 h-40 bg-zinc-200 rounded grid grid-cols-6 gap-0.5 p-2">
                                    {[...Array(36)].map((_, i) => (
                                        <div key={i} className={`${Math.random() > 0.5 ? 'bg-zinc-900' : 'bg-white'}`} />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSetup2FA(false)}
                                    className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg"
                                >
                                    {t('adminsecuritysettings.h_y')}</button>
                                <button
                                    onClick={complete2FASetup}
                                    disabled={loading2FA}
                                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2"
                                >
                                    {loading2FA ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    {t('adminsecuritysettings.x_c_nh_n')}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AdminSecuritySettings;
