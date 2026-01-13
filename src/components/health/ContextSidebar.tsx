import React from 'react';
import { motion } from 'framer-motion';
import { User, Package, Heart, Activity, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface PatientProfile {
    age: number;
    mainConcerns: string[];
    purchaseHistory: string[];
    lastVisit: Date;
    healthScore: number;
}

const MOCK_PATIENT: PatientProfile = {
    age: 32,
    mainConcerns: ['Mất ngủ', 'Stress công việc', 'Mệt mỏi'],
    purchaseHistory: ['ANIMA 119', 'Immune Boost'],
    lastVisit: new Date(2025, 10, 15),
    healthScore: 68
};

export const ContextSidebar: React.FC = () => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-96 bg-white dark:bg-zinc-900 backdrop-blur-xl border-l border-zinc-200 dark:border-zinc-800 p-6 space-y-6 overflow-y-auto h-full"
        >
            {/* Patient Profile Card */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-zinc-500 dark:text-zinc-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{t('contextsidebar.h_s_kh_ch_h_ng')}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">{t('contextsidebar.th_ng_tin_t_v_n')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-700">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('contextsidebar.tu_i')}</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{MOCK_PATIENT.age} {t('contextsidebar.tu_i_1')}</span>
                    </div>

                    <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{t('contextsidebar.v_n_ch_nh')}</p>
                        <div className="flex flex-wrap gap-2">
                            {MOCK_PATIENT.mainConcerns.map((concern, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-200 font-medium"
                                >
                                    {concern}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4 mb-2">{t('contextsidebar.l_ch_s_mua_h_ng')}</p>
                        <div className="space-y-2">
                            {MOCK_PATIENT.purchaseHistory.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20"
                                >
                                    <Package className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-zinc-200 dark:border-zinc-700">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('contextsidebar.l_n_t_v_n_g_n_nh_t')}</span>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {MOCK_PATIENT.lastVisit.toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Health Score Card */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-xl text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-3 mb-4">
                    <Heart className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-lg">{t('contextsidebar.i_m_s_c_kh_e')}</h3>
                </div>

                <div className="flex items-center justify-center mb-4">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                className="text-zinc-200 dark:text-white/20"
                                strokeWidth="8"
                                fill="none"
                            />
                            <motion.circle
                                initial={{ strokeDashoffset: 352 }}
                                animate={{ strokeDashoffset: 352 - (352 * MOCK_PATIENT.healthScore) / 100 }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#FFBF00"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray="352"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold">{MOCK_PATIENT.healthScore}</span>
                        </div>
                    </div>
                </div>

                <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm">
                    {t('contextsidebar.i_m_s_t_t_ti_p_t_c_duy_tr')}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 shadow-md border border-zinc-200 dark:border-zinc-700">
                    <Activity className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-2" />
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">12</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">{t('contextsidebar.t_v_n_ho_n_th_nh')}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 shadow-md border border-zinc-200 dark:border-zinc-700">
                    <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('contextsidebar.15')}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">{t('contextsidebar.c_i_thi_n_s_c_kh_e')}</p>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
                <p className="text-xs text-amber-500 leading-relaxed">
                    ⚠️ {t('healthCoach.disclaimerTech')} {t('healthCoach.disclaimerMedical')}
                </p>
            </div>
        </motion.div>
    );
};
