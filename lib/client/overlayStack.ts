export type OverlayKey = string;

let stack: OverlayKey[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const l of Array.from(listeners)) l();
}

export function getOverlayStackSnapshot() {
  return stack.slice();
}

export function getTopOverlayKey() {
  return stack[stack.length - 1] ?? null;
}

export function getOverlayIndex(key: OverlayKey) {
  return stack.indexOf(key);
}

export function isTopOverlay(key: OverlayKey) {
  return getTopOverlayKey() === key;
}

export function pushOverlay(key: OverlayKey) {
  stack = [...stack.filter((k) => k !== key), key];
  notify();
}

export function removeOverlay(key: OverlayKey) {
  const next = stack.filter((k) => k !== key);
  if (next.length === stack.length) return;
  stack = next;
  notify();
}

export function subscribeOverlayStack(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
