/**
 * deep.ts — barrel re-export.
 * Implementation split into:
 *   - deep-clone-and-set-path-operations.ts (deepClone, deepGet, deepSet, flatten, unflatten)
 *   - deep-equal-and-diff-comparison.ts (deepEqual, diff, Diff)
 */

export {
  deepClone,
  deepGet,
  deepSet,
  flatten,
  unflatten,
} from './deep-clone-and-set-path-operations';

export type { Diff } from './deep-equal-and-diff-comparison';
export {
  deepEqual,
  diff,
} from './deep-equal-and-diff-comparison';
