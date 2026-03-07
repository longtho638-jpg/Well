/**
 * Utility functions
 */

/**
 * Merge class names with Tailwind CSS
 * Simple implementation without external dependencies
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
