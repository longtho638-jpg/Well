/**
 * Password Strength Meter
 * Auth Max Level Component
 * 
 * Visual feedback for password strength:
 * - Weak (red)
 * - Fair (orange)
 * - Good (yellow)
 * - Strong (green)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle } from 'lucide-react';

interface PasswordStrengthMeterProps {
    password: string;
    showRequirements?: boolean;
}

interface Requirement {
    label: string;
    test: (password: string) => boolean;
}

const requirements: Requirement[] = [
    { label: 'Ít nhất 8 ký tự', test: (p) => p.length >= 8 },
    { label: 'Có chữ hoa (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'Có chữ thường (a-z)', test: (p) => /[a-z]/.test(p) },
    { label: 'Có số (0-9)', test: (p) => /[0-9]/.test(p) },
    { label: 'Có ký tự đặc biệt (!@#$%)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrengthMeter({ password, showRequirements = true }: PasswordStrengthMeterProps) {
    const { score, label, color, passedRequirements } = useMemo(() => {
        const passed = requirements.filter(req => req.test(password));
        const score = passed.length;

        let label = 'Yếu';
        let color = 'bg-red-500';

        if (score >= 5) {
            label = 'Rất mạnh';
            color = 'bg-emerald-500';
        } else if (score >= 4) {
            label = 'Mạnh';
            color = 'bg-green-500';
        } else if (score >= 3) {
            label = 'Trung bình';
            color = 'bg-yellow-500';
        } else if (score >= 2) {
            label = 'Yếu';
            color = 'bg-orange-500';
        }

        return { score, label, color, passedRequirements: passed };
    }, [password]);

    if (!password) return null;

    return (
        <div className="space-y-3 mt-3">
            {/* Strength Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Độ mạnh mật khẩu</span>
                    <span className={`font-medium ${score >= 4 ? 'text-emerald-400' :
                            score >= 3 ? 'text-yellow-400' :
                                score >= 2 ? 'text-orange-400' : 'text-red-400'
                        }`}>
                        {label}
                    </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(score / 5) * 100}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-full ${color} rounded-full`}
                    />
                </div>
            </div>

            {/* Requirements List */}
            {showRequirements && (
                <div className="grid grid-cols-1 gap-1">
                    {requirements.map((req, i) => {
                        const passed = req.test(password);
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`flex items-center gap-2 text-xs ${passed ? 'text-emerald-400' : 'text-zinc-500'
                                    }`}
                            >
                                {passed ? (
                                    <Check className="w-3.5 h-3.5" />
                                ) : (
                                    <X className="w-3.5 h-3.5" />
                                )}
                                <span>{req.label}</span>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PasswordStrengthMeter;
