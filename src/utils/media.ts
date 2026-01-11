/**
 * Media Utilities
 * Phase 11: Auth and Media
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// IMAGE UTILITIES
// ============================================================================

export interface ImageDimensions {
    width: number;
    height: number;
    aspectRatio: number;
}

export async function getImageDimensions(src: string): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
                aspectRatio: img.naturalWidth / img.naturalHeight,
            });
        };
        img.onerror = reject;
        img.src = src;
    });
}

export function isValidImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}

export function getImagePlaceholder(width: number, height: number): string {
    return `https://placehold.co/${width}x${height}/EEE/999?text=Image`;
}

// ============================================================================
// IMAGE PRELOADING
// ============================================================================

export function preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

export function preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(srcs.map(preloadImage));
}

// ============================================================================
// USE IMAGE HOOK
// ============================================================================

interface UseImageResult {
    src: string | null;
    isLoading: boolean;
    error: Error | null;
}

export function useImage(src: string | undefined): UseImageResult {
    const [state, setState] = useState<UseImageResult>({
        src: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        if (!src) {
            setState({ src: null, isLoading: false, error: null });
            return;
        }

        setState(prev => ({ ...prev, isLoading: true }));

        const img = new Image();
        img.onload = () => setState({ src, isLoading: false, error: null });
        img.onerror = () => setState({ src: null, isLoading: false, error: new Error('Failed to load image') });
        img.src = src;
    }, [src]);

    return state;
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

export function getMimeType(filename: string): string {
    const ext = getFileExtension(filename);
    const types: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return types[ext] || 'application/octet-stream';
}

// ============================================================================
// FILE INPUT HOOK
// ============================================================================

interface UseFileInputOptions {
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
}

interface UseFileInputResult {
    files: File[];
    error: string | null;
    openFilePicker: () => void;
    clear: () => void;
}

export function useFileInput(options: UseFileInputOptions = {}): UseFileInputResult {
    const { accept = '*', multiple = false, maxSize } = options;
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.multiple = multiple;
        input.style.display = 'none';

        input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            const selectedFiles = Array.from(target.files || []);

            if (maxSize) {
                const oversized = selectedFiles.find(f => f.size > maxSize);
                if (oversized) {
                    setError(`File "${oversized.name}" is too large. Max size: ${formatFileSize(maxSize)}`);
                    return;
                }
            }

            setError(null);
            setFiles(selectedFiles);
        };

        document.body.appendChild(input);
        inputRef.current = input;

        return () => {
            input.remove();
        };
    }, [accept, multiple, maxSize]);

    const openFilePicker = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const clear = useCallback(() => {
        setFiles([]);
        setError(null);
        if (inputRef.current) inputRef.current.value = '';
    }, []);

    return { files, error, openFilePicker, clear };
}

// ============================================================================
// DOWNLOAD UTILITIES
// ============================================================================

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
