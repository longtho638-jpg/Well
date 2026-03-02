/**
 * dom.ts — barrel re-export.
 * Implementation split into:
 *   - dom-element-query-and-class-helpers.ts
 *   - dom-scroll-and-viewport-helpers.ts
 */

export {
  $,
  $$,
  getById,
  hasClass,
  addClass,
  removeClass,
  toggleClass,
  useClickOutside,
  useElementSize,
  useHover,
  useFocus,
} from './dom-element-query-and-class-helpers';

export {
  scrollToTop,
  scrollToElement,
  isInViewport,
  useInView,
} from './dom-scroll-and-viewport-helpers';
