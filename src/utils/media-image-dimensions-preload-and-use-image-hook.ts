/**
 * Media Image Dimensions, Preload and useImage Hook — async image dimension reading, preloading helpers, and React hook for image load state
 */

import { useState, useEffect } from 'react';

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
