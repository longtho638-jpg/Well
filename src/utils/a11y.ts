/**
 * a11y.ts — barrel re-export.
 * Implementation split into:
 *   - a11y-aria-props-reduced-motion-and-keyboard-navigation.ts
 *   - a11y-focus-trap-and-screen-reader-announcements.ts
 */

export {
  prefersReducedMotion,
  useReducedMotion,
  generateAriaId,
  getAriaProps,
  useArrowNavigation,
} from './a11y-aria-props-reduced-motion-and-keyboard-navigation';

export {
  useFocusTrap,
  useSkipLink,
  announce,
  useAnnounce,
} from './a11y-focus-trap-and-screen-reader-announcements';
