// Vietnamese dong currency formatter — tỷ/triệu shorthand
export function formatVND(amount: number): string {
    if (amount >= 1_000_000_000) {
        return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
    }
    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(0)} triệu`;
    }
    return amount.toLocaleString('vi-VN');
}
