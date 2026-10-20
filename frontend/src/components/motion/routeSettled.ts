/**
 * "The new page has its scroll position": RouteScroll marks it once it has restored or reset
 * the scroll after a navigation, so a View Transition can take its new snapshot in the right place.
 */
let generation = 0;
const waiters = new Set<() => void>();

export const settleGeneration = () => generation;

export function markRouteSettled(): void {
  generation += 1;
  for (const wake of [...waiters]) wake();
}

/** True once a mark lands after generation `after`; false after `timeoutMs`. Settles once. */
export function waitForRouteSettled(after: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (generation > after) {
      resolve(true);
      return;
    }
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      waiters.delete(check);
      clearTimeout(timer);
      resolve(value);
    };
    const check = () => {
      if (generation > after) finish(true);
    };
    waiters.add(check);
    const timer = setTimeout(() => finish(false), timeoutMs);
  });
}
