import { useCallback } from 'react';

export const useSocialShare = (url: string) => {
    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(url);
        return true;
    }, [url]);

    const shareViaZalo = useCallback((message: string) => {
        const text = encodeURIComponent(`${message}\n\n👉 ${url}`);
        window.open(`https://zalo.me/share?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
    }, [url]);

    const shareViaFacebook = useCallback(() => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    }, [url]);

    const shareViaTelegram = useCallback((message: string) => {
        const text = encodeURIComponent(`${message} ${url}`);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
    }, [url]);

    const shareViaEmail = useCallback((subject: string, body: string) => {
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(`${body}\n\nLink: ${url}`);
        window.location.href = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
    }, [url]);

    const generateQRCodeUrl = (size = 400) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=20&qzone=2&color=00575A`;
    };

    return {
        copyToClipboard,
        shareViaZalo,
        shareViaFacebook,
        shareViaTelegram,
        shareViaEmail,
        generateQRCodeUrl
    };
};
