import React from 'react';
import { MapPin, Globe, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks';
import type { LoginActivity } from './use-admin-security-settings-form-state';

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

interface Props {
    loginActivity: LoginActivity[];
}

export const AdminSecurityLoginActivityList: React.FC<Props> = ({ loginActivity }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-medium text-zinc-100">{t('adminsecuritysettings.l_ch_s_ng_nh_p')}</h3>
                <span className="text-xs text-zinc-500">{loginActivity.length} {t('adminsecuritysettings.ho_t_ng')}</span>
            </div>
            <div className="divide-y divide-zinc-800">
                {loginActivity.map((activity) => (
                    <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                activity.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
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
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activity.location}</span>
                                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{activity.ip}</span>
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
    );
};
