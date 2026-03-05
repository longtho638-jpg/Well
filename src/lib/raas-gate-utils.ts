/**
 * RaaS License Gate Utils
 *
 * Extracted utility functions for testing.
 */

const LICENSE_PATTERN = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;

/**
 * Validate license key format
 */
export function validateLicenseFormat(licenseKey: string): boolean {
  return LICENSE_PATTERN.test(licenseKey);
}

/**
 * Check if license is expired (1 year from timestamp)
 */
export function isLicenseExpired(timestamp: number): boolean {
  const expiresAt = timestamp + (365 * 24 * 60 * 60 * 1000);
  return Date.now() > expiresAt;
}

/**
 * Get days remaining until expiration
 */
export function getDaysRemaining(timestamp: number): number {
  const expiresAt = timestamp + (365 * 24 * 60 * 60 * 1000);
  const diff = expiresAt - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
