/**
 * License Status Badge Component
 * Displays real-time license status with color-coded badges
 */

import React from 'react';
import { ShieldCheck, ShieldX, Clock, AlertTriangle } from 'lucide-react';
import { LicenseValidationResult } from '@/lib/raas-gate';

interface LicenseStatusBadgeProps {
    license?: LicenseValidationResult | null;
    size?: 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
}

export const LicenseStatusBadge: React.FC<LicenseStatusBadgeProps> = ({
    license,
    size = 'md',
    showTooltip = true,
}) => {
    if (!license || !license.isValid) {
        return (
            <Badge
                variant="inactive"
                size={size}
                icon={<ShieldX className="w-3 h-3" />}
                label="No License"
                tooltip={showTooltip ? 'License required for access' : undefined}
            />
        );
    }

    const { status, tier } = license;

    // Status color mapping
    const statusConfig: Record<LicenseValidationResult['status'], {
        variant: 'success' | 'warning' | 'danger' | 'info';
        icon: React.ReactNode;
        label: string;
    }> = {
        active: {
            variant: 'success',
            icon: <ShieldCheck className="w-3 h-3" />,
            label: 'Active',
        },
        pending_revocation: {
            variant: 'warning',
            icon: <AlertTriangle className="w-3 h-3" />,
            label: 'Grace Period',
        },
        revoked: {
            variant: 'danger',
            icon: <ShieldX className="w-3 h-3" />,
            label: 'Revoked',
        },
        expired: {
            variant: 'danger',
            icon: <Clock className="w-3 h-3" />,
            label: 'Expired',
        },
    };

    // Tier color mapping
    const tierColors: Record<LicenseValidationResult['tier'], string> = {
        basic: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        premium: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        enterprise: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        master: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };

    const config = statusConfig[status];

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${tierColors[tier]} text-xs font-semibold`}>
            {config.icon}
            <span>{config.label}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-70">
                {tier.toUpperCase()}
            </span>
            {showTooltip && license.expiresAt && (
                <span className="text-[10px] opacity-50">
                    · Expires {new Date(license.expiresAt).toLocaleDateString()}
                </span>
            )}
        </div>
    );
};

// ─── Internal Badge Component ─────────────────────────────────────

interface BadgeProps {
    variant: 'success' | 'warning' | 'danger' | 'info' | 'inactive';
    size: 'sm' | 'md' | 'lg';
    icon: React.ReactNode;
    label: string;
    tooltip?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant, size, icon, label, tooltip }) => {
    const variantColors: Record<BadgeProps['variant'], string> = {
        success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    };

    const sizeClasses: Record<BadgeProps['size'], string> = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-3 py-1.5 text-xs',
        lg: 'px-4 py-2 text-sm',
    };

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full border ${variantColors[variant]} ${sizeClasses[size]}`}
            title={tooltip}
        >
            {icon}
            <span className="font-semibold">{label}</span>
        </div>
    );
};

/**
 * Get status color for programmatic use
 */
export function getLicenseStatusColor(status: LicenseValidationResult['status']): string {
    const colors: Record<LicenseValidationResult['status'], string> = {
        active: '#10b981', // emerald-500
        pending_revocation: '#f59e0b', // amber-500
        revoked: '#f43f5e', // rose-500
        expired: '#f43f5e', // rose-500
    };
    return colors[status];
}

/**
 * Get tier color for programmatic use
 */
export function getTierColor(tier: LicenseValidationResult['tier']): string {
    const colors: Record<LicenseValidationResult['tier'], string> = {
        basic: '#71717a', // zinc-500
        premium: '#14b8a6', // teal-500
        enterprise: '#6366f1', // indigo-500
        master: '#f59e0b', // amber-500
    };
    return colors[tier];
}
