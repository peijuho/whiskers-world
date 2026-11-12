import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { environmentActions, subscribeEnv } from "@/game/environmentStore";

const TICK_MS = 125;
const SAVE_MS = 5000;

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
      environmentActions.tick((now - last) / 1000);
      last = now;
      if (now - lastSave > SAVE_MS) {
        lastSave = now;
        environmentActions.persistHour();
      }
    }, TICK_MS);
    const save = () => environmentActions.persistHour();
    window.addEventListener("pagehide", save);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, []);

  return null;
}
