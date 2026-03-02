/**
 * Password Strength Checker — scores password complexity and returns suggestions in Vietnamese
 */

export interface PasswordStrength {
    score: number; // 0-4
    label: 'weak' | 'fair' | 'good' | 'strong';
    suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const suggestions: string[] = [];

    if (password.length >= 8) score++;
    else suggestions.push('Tối thiểu 8 ký tự');

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    else suggestions.push('Kết hợp chữ hoa và chữ thường');

    if (/\d/.test(password)) score++;
    else suggestions.push('Thêm ít nhất 1 số');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else suggestions.push('Thêm ký tự đặc biệt');

    const labels: PasswordStrength['label'][] = ['weak', 'weak', 'fair', 'good', 'strong'];

    return {
        score,
        label: labels[score],
        suggestions,
    };
}
