import { createStore } from "./createStore";
import { GAME_MINUTES_PER_SECOND, type Speed } from "./gameClock";
import { blend, isWeatherId, stepWeatherBlend, type WeatherId, type WeatherMode } from "./weather";
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
  readonly weather: WeatherId;
  readonly weatherMode: WeatherMode;
}

const store = createStore<EnvState>({ hour: 9, paused: false, speed: 1, lampMode: "auto", weather: "sunny", weatherMode: "manual" });

export const useEnv = store.use;
export const getEnv = store.get;
export const subscribeEnv = store.subscribe;

export const environmentActions = {
  /** 由 settingsStore 載入存檔後呼叫 */
  hydrate() {
    const s = getSettings();
    store.set({
      hour: s.clockHour, paused: s.clockPaused, speed: s.clockSpeed, lampMode: s.lampMode,
      weather: s.weather, weatherMode: s.weatherMode,
    });
    stepWeatherBlend(s.weather, 0, true); // 載入時直接套用，不做過渡
  },

  /** 以 delta time（秒）推進時間與天氣過渡；回傳是否需要重繪 */
  tick(dtSeconds: number): boolean {
    const { paused, speed, hour, weather } = store.get();
    const weatherMoving = stepWeatherBlend(weather, dtSeconds);
    if (paused) return weatherMoving;
    const advance = (dtSeconds * speed * GAME_MINUTES_PER_SECOND) / 60;
    store.set({ hour: (hour + advance) % 24 });
    return true;
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

  setWeather(weather: WeatherId) {
    if (!isWeatherId(weather)) return;
    store.set({ weather });
    settingsActions.update({ weather });
  },

  setWeatherMode(weatherMode: WeatherMode) {
    store.set({ weatherMode });
    settingsActions.update({ weatherMode });
  },

  persistHour() {
    settingsActions.update({ clockHour: store.get().hour });
  },
};

/** 室內燈亮度 0..1（考慮玩家的燈光偏好） */
export function lampLevel(autoLamp: number, mode: LampMode): number {
  return mode === "on" ? 1 : mode === "off" ? 0 : autoLamp;
}

export { blend as weatherBlend };
