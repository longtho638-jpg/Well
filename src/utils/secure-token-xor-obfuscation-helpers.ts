/**
 * Secure Token XOR Obfuscation Helpers — simple XOR + base64 encode/decode for localStorage token obfuscation
 */

/**
 * XOR-obfuscate and base64-encode a plaintext string.
 * Not true encryption — prevents casual inspection and automated scrapers.
 */
export function encryptSimple(text: string): string {
    return btoa(
        text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 123)).join('')
    );
}

/**
 * Decode a base64 + XOR-obfuscated string back to plaintext.
 */
export function decryptSimple(encoded: string): string {
    try {
        const text = atob(encoded);
        return text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 123)).join('');
    } catch {
        return '';
    }
}
