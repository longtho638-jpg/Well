
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PasswordValidation, getStrengthColor } from '@/utils/password-validation';

interface PasswordStrengthMeterProps {
    validation: PasswordValidation;
    showDetails?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
    validation,
    showDetails = false
}) => {
    const { t } = useTranslation();
    const { score, strength, errors } = validation;

    // Calculate width for progress bar based on score (0-100)
    const width = `${Math.max(5, score)}%`;
    const colorClass = getStrengthColor(strength);

    const strengthLabel = t(`auth.password.strength.${strength}`);

    return (
        <div className="space-y-3 mt-2">
            {/* Strength Bar */}
            <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">
                        {t('auth.register.password')} Strength
                    </span>
                    <span className={`font-bold uppercase tracking-wider ${
                        strength === 'weak' ? 'text-rose-400' :
                        strength === 'fair' ? 'text-amber-400' :
                        strength === 'good' ? 'text-blue-400' :
                        'text-emerald-400'
                    }`}>
                        {strengthLabel}
                    </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${colorClass}`}
                        initial={{ width: 0 }}
                        animate={{ width }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Validation Requirements List */}
            {showDetails && (
                <div className="grid grid-cols-1 gap-1.5">
                    <RequirementItem
                        met={!errors.includes('auth.password.requirements.length')}
                        label={t('auth.password.requirements.length')}
                    />
                    <RequirementItem
                        met={!errors.includes('auth.password.requirements.uppercase')}
                        label={t('auth.password.requirements.uppercase')}
                    />
                    <RequirementItem
                        met={!errors.includes('auth.password.requirements.lowercase')}
                        label={t('auth.password.requirements.lowercase')}
                    />
                    <RequirementItem
                        met={!errors.includes('auth.password.requirements.number')}
                        label={t('auth.password.requirements.number')}
                    />
                    <RequirementItem
                        met={!errors.includes('auth.password.requirements.special')}
                        label={t('auth.password.requirements.special')}
                    />
                </div>
            )}
        </div>
    );
};

const RequirementItem: React.FC<{ met: boolean; label: string }> = ({ met, label }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
        met ? 'text-emerald-400' : 'text-slate-500'
    }`}>
        {met ? (
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
            <div className="w-3.5 h-3.5 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>
        )}
        <span>{label}</span>
    </div>
);
