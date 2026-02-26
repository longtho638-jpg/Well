// ============================================================================
// EAST ASIAN COLOR PALETTE - 2026 TRENDS
// ============================================================================

export const EA_COLORS = {
    // Zen Neutrals
    ink: '#0a0a0a',
    charcoal: '#1a1a1a',
    stone: '#2a2a2a',
    mist: '#f5f5f5',

    // Nature-Inspired Accents
    jade: '#00897b',
    bamboo: '#4caf50',
    sakura: '#ec407a',
    gold: '#ffc107',
    ocean: '#0288d1',

    // Premium Gradients
    zenGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d2818 100%)',
    goldShimmer: 'linear-gradient(90deg, #ffc107 0%, #ffecb3 50%, #ffc107 100%)',
    jadeFlow: 'linear-gradient(135deg, #004d40 0%, #00897b 50%, #26a69a 100%)',
};

// ============================================================================
// VIETNAM / EAST ASIAN NUMBER FORMAT
// ============================================================================

export function formatVND(amount: number): string {
    if (amount >= 1_000_000_000) {
        return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
    }
    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(0)} triệu`;
    }
    return amount.toLocaleString('vi-VN');
}
