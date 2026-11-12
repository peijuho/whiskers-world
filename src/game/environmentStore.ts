import { createStore } from "./createStore";
import { GAME_MINUTES_PER_SECOND, type Speed } from "./gameClock";
import { getSettings, settingsActions, type LampMode } from "./settingsStore";

/**
 * 環境執行期狀態（遊戲時間每秒更新多次，因此不放進會頻繁重繪 UI 的設定 store）。
 * 設定面向（暫停、速度、燈光模式）同步寫入 settingsStore 以便存檔；
 * 小時數本身每隔數秒存一次。
 */
export interface EnvState {
  readonly hour: number;
  readonly paused: boolean;
  readonly speed: Speed;
  readonly lampMode: LampMode;
}

const store = createStore<EnvState>({ hour: 9, paused: false, speed: 1, lampMode: "auto" });

export const useEnv = store.use;
export const getEnv = store.get;
export const subscribeEnv = store.subscribe;

export const environmentActions = {
  /** 由 settingsStore 載入存檔後呼叫 */
  hydrate() {
    const s = getSettings();
    store.set({ hour: s.clockHour, paused: s.clockPaused, speed: s.clockSpeed, lampMode: s.lampMode });
  },

  /** 以 delta time（秒）推進時間 */
  tick(dtSeconds: number) {
    const { paused, speed, hour } = store.get();
    if (paused) return;
    const advance = (dtSeconds * speed * GAME_MINUTES_PER_SECOND) / 60;
    store.set({ hour: (hour + advance) % 24 });
  },

  setHour(hour: number) {
    store.set({ hour: ((hour % 24) + 24) % 24 });
    settingsActions.update({ clockHour: store.get().hour });
  },

  togglePause() {
    const paused = !store.get().paused;
    store.set({ paused });
    settingsActions.update({ clockPaused: paused, clockHour: store.get().hour });
  },

  setSpeed(speed: Speed) {
    store.set({ speed });
    settingsActions.update({ clockSpeed: speed });
  },

  setLampMode(lampMode: LampMode) {
    store.set({ lampMode });
    settingsActions.update({ lampMode });
  },

  persistHour() {
    settingsActions.update({ clockHour: store.get().hour });
  },
};

/** 室內燈亮度 0..1（考慮玩家的燈光偏好） */
export function lampLevel(autoLamp: number, mode: LampMode): number {
  return mode === "on" ? 1 : mode === "off" ? 0 : autoLamp;
}
