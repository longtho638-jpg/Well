/**
 * Admin Security Settings Component
 * Auth Max Level - Phase 7
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    Key,
    Smartphone,
    Clock,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useAdminSecuritySettingsFormState } from './use-admin-security-settings-form-state';
import { AdminSecurity2FASetupModal } from './admin-security-2fa-setup-modal';
import { AdminSecurityLoginActivityList } from './admin-security-login-activity-list';

const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    loading?: boolean;
}> = ({ enabled, onChange, loading }) => (
    <button
        onClick={() => onChange(!enabled)}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-zinc-700'} ${loading ? 'opacity-50' : ''}`}
    >
        <motion.div
            animate={{ x: enabled ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        />
    </button>
);

export function AdminSecuritySettings() {
    const { t } = useTranslation();
    const {
        settings,
        loginActivity,
        showSetup2FA,
        setShowSetup2FA,
        loading2FA,
        qrPattern,
        handle2FAToggle,
        complete2FASetup,
        updateSetting,
    } = useAdminSecuritySettingsFormState();

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
                                {settings.twoFactorEnabled ? '95' : '70'}{t('adminsecuritysettings.100')}
                            </p>
                        </div>
                    </div>
                    {!settings.twoFactorEnabled && (
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {t('adminsecuritysettings.b_t_2fa_t_ng_i_m')}
                        </p>
                    )}
                </div>
            </div>

            {/* Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <ToggleSwitch enabled={settings.twoFactorEnabled} onChange={handle2FAToggle} loading={loading2FA} />
                    </div>
                </div>

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
                        <button className="text-sm text-emerald-400 hover:underline">{t('adminsecuritysettings.i_m_t_kh_u')}</button>
                    </div>
                </div>

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
                            onChange={(v) => updateSetting('loginAlerts', v)}
                        />
                    </div>
                </div>

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
                            onChange={(e) => updateSetting('sessionTimeout', Number(e.target.value))}
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

            <AdminSecurityLoginActivityList loginActivity={loginActivity} />

            <AdminSecurity2FASetupModal
                show={showSetup2FA}
                loading={loading2FA}
                qrPattern={qrPattern}
                onClose={() => setShowSetup2FA(false)}
                onConfirm={complete2FASetup}
            />
        </div>
    );
}

export default AdminSecuritySettings;
