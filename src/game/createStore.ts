import { useSyncExternalStore } from "react";

/** 極簡外部 store（不新增套件）：DOM UI 與 R3F 場景可共用同一份狀態。 */
export function createStore<S extends object>(initial: S) {
  let state = initial;
  const listeners = new Set<() => void>();
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };
  return {
    get: () => state,
    set(patch: Partial<S>) {
      state = { ...state, ...patch };
      listeners.forEach((l) => l());
    },
    subscribe,
    use<T>(selector: (s: S) => T): T {
      return useSyncExternalStore(
        subscribe,
        () => selector(state),
        () => selector(initial),
      );
    },
  };
}
