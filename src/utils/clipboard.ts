/**
 * Clipboard Utilities
 * Phase 11: Auth and Media
 */

import { useState, useCallback } from 'react';

// ============================================================================
// COPY TO CLIPBOARD
// ============================================================================

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            return true;
        } finally {
            document.body.removeChild(textArea);
        }
    } catch {
        return false;
    }
}

// ============================================================================
// READ FROM CLIPBOARD
// ============================================================================

export async function readFromClipboard(): Promise<string | null> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            return await navigator.clipboard.readText();
        }
        return null;
    } catch {
        return null;
    }
}

// ============================================================================
// COPY HOOK
// ============================================================================

interface UseCopyResult {
    copy: (text: string) => Promise<boolean>;
    copied: boolean;
    reset: () => void;
}

export function useCopy(resetDelay = 2000): UseCopyResult {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(async (text: string) => {
        const success = await copyToClipboard(text);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), resetDelay);
        }
        return success;
    }, [resetDelay]);

    const reset = useCallback(() => setCopied(false), []);

    return { copy, copied, reset };
}

// ============================================================================
// SHARE UTILITIES
// ============================================================================

export interface ShareData {
    title?: string;
    text?: string;
    url?: string;
}

export function canShare(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
}

export async function share(data: ShareData): Promise<boolean> {
    if (!canShare()) {
        // Fallback: copy URL to clipboard
        if (data.url) {
            return copyToClipboard(data.url);
        }
        return false;
    }

    try {
        await navigator.share(data);
        return true;
    } catch {
        return false;
    }
}

// ============================================================================
// QR CODE URL
// ============================================================================

export function generateQRCodeUrl(text: string, size = 200): string {
    const encoded = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
}

// ============================================================================
// REFERRAL LINK
// ============================================================================

export function generateReferralLink(userId: string, baseUrl?: string): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/ref/${userId}`;
}

export function extractReferralCode(path: string): string | null {
    const match = path.match(/\/ref\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}
