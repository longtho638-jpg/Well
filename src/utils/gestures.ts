/**
 * gestures.ts — barrel re-export.
 * Implementation split into:
 *   - gesture-swipe-long-press-double-tap-handlers.ts
 *   - gesture-drag-mouse-tracking-hook.ts
 */

export type { DragState } from './gesture-drag-mouse-tracking-hook';
export { useDrag } from './gesture-drag-mouse-tracking-hook';

export {
  useSwipe,
  useLongPress,
  useDoubleTap,
} from './gesture-swipe-long-press-double-tap-handlers';
