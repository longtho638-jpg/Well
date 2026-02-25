import { useMemo } from 'react';
import { User } from '@/types';
import { calculatePIT } from '@/utils/tax';
import { TranslationKey, useTranslation } from './useTranslation';

export function useStatsGrid(user: User) {
    const { t } = useTranslation();
    const estimatedBonus = useMemo(() => user.estimatedBonus || 0, [user.estimatedBonus]);

    const taxInfo = useMemo(() => {
        return calculatePIT(estimatedBonus);
    }, [estimatedBonus]);

    const statsConfig = useMemo(() => [
        {
            id: 'sales',
            label: 'dashboard.stats.totalSales' as TranslationKey,
            value: user.totalSales,
            trend: 12.5,
            icon: 'TrendingUp',
            color: 'teal'
        },
        {
            id: 'team',
            label: 'dashboard.stats.teamVolume' as TranslationKey,
            value: user.teamVolume,
            trend: 8.2,
            icon: 'Users',
            color: 'blue'
        }
    ], [user.totalSales, user.teamVolume]);

    return {
        estimatedBonus,
        taxInfo,
        statsConfig,
        nextPayoutDate: user.nextPayoutDate || t('useStatsGrid.tbd')
    };
}
