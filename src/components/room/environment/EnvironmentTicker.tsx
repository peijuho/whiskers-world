import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { applyAudio, unlockAudio } from "@/game/audioEngine";
import { environmentActions, getEnv, subscribeEnv, weatherBlend } from "@/game/environmentStore";
import { getSettings } from "@/game/settingsStore";
import { pickRandomWeather } from "@/game/weather";

const TICK_MS = 125;
const SAVE_MS = 5000;
const RANDOM_WEATHER_MS = 90_000;

/**
 * 以 delta time 推進遊戲時間。R3F 使用 frameloop="demand"，
 * 因此環境狀態改變時由這裡要求重繪（暫停時完全不會繪製）。
 */
export function EnvironmentTicker() {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => subscribeEnv(() => invalidate()), [invalidate]);

  useEffect(() => {
    let last = performance.now();
    let lastSave = last;
    const id = window.setInterval(() => {
      const now = performance.now();
      if (environmentActions.tick((now - last) / 1000)) invalidate();
      last = now;
      const env = getEnv();
      const set = getSettings();
      // 夜晚程度：晚上 7 點後逐漸升高，清晨 5~6 點逐漸消失
      const h = env.hour;
      const night = h >= 21 || h < 5 ? 1 : h >= 19 ? (h - 19) / 2 : h < 6 ? 6 - h : 0;
      applyAudio({
        master: set.audioMaster,
        muted: set.audioMuted,
        ambient: set.audioAmbient,
        rainVolume: set.audioRain,
        rain: weatherBlend.rain,
        snow: weatherBlend.snow,
        night: Math.min(Math.max(night, 0), 1),
      });
      if (now - lastSave > SAVE_MS) {
        lastSave = now;
        environmentActions.persistHour();
      }
    }, TICK_MS);
    const randomId = window.setInterval(() => {
      const env = getEnv();
      if (env.weatherMode === "random") {
        environmentActions.setWeather(pickRandomWeather(env.weather, Math.random));
      }
    }, RANDOM_WEATHER_MS);
    // 瀏覽器自動播放限制：第一次互動時才啟用音效
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    const save = () => environmentActions.persistHour();
    window.addEventListener("pagehide", save);
    return () => {
      window.clearInterval(id);
      window.clearInterval(randomId);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [invalidate]);

  return null;
}
