/**
 * Time and Date Utilities
 * Phase 12: Time and Animation
 */

// ============================================================================
// DATE FORMATTING
// ============================================================================

export function formatDateShort(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function formatDateLong(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDateTime(date: Date | string): string {
    return `${formatDateShort(date)} ${formatTime(date)}`;
}

// ============================================================================
// RELATIVE TIME
// ============================================================================

export function timeAgo(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} tuần trước`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} tháng trước`;
    return `${Math.floor(seconds / 31536000)} năm trước`;
}

export function timeUntil(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const seconds = Math.floor((d.getTime() - now.getTime()) / 1000);

    if (seconds <= 0) return 'Đã qua';
    if (seconds < 60) return 'Sắp tới';
    if (seconds < 3600) return `Còn ${Math.floor(seconds / 60)} phút`;
    if (seconds < 86400) return `Còn ${Math.floor(seconds / 3600)} giờ`;
    if (seconds < 604800) return `Còn ${Math.floor(seconds / 86400)} ngày`;
    return `Còn ${Math.floor(seconds / 604800)} tuần`;
}

// ============================================================================
// DATE MANIPULATION
// ============================================================================

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

export function startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

export function endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

export function startOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
}

export function endOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
}

// ============================================================================
// DATE COMPARISON
// ============================================================================

export function isSameDay(date1: Date, date2: Date): boolean {
    return startOfDay(date1).getTime() === startOfDay(date2).getTime();
}

export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}

export function isYesterday(date: Date): boolean {
    return isSameDay(date, addDays(new Date(), -1));
}

export function isTomorrow(date: Date): boolean {
    return isSameDay(date, addDays(new Date(), 1));
}

export function isWithinDays(date: Date, days: number): boolean {
    const now = new Date();
    const diff = Math.abs(date.getTime() - now.getTime());
    return diff <= days * 24 * 60 * 60 * 1000;
}

// ============================================================================
// DATE RANGES
// ============================================================================

export interface DateRange {
    start: Date;
    end: Date;
}

export function getThisWeek(): DateRange {
    const now = new Date();
    const day = now.getDay();
    const start = addDays(now, -day + (day === 0 ? -6 : 1));
    const end = addDays(start, 6);
    return { start: startOfDay(start), end: endOfDay(end) };
}

export function getThisMonth(): DateRange {
    const now = new Date();
    return { start: startOfMonth(now), end: endOfMonth(now) };
}

export function getLastNDays(n: number): DateRange {
    const now = new Date();
    return { start: startOfDay(addDays(now, -n + 1)), end: endOfDay(now) };
}
