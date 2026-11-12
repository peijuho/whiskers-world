import { lampLevel, useEnv } from "@/game/environmentStore";
import { autoLampAt } from "@/game/lighting";

/** 檯燈／落地燈發光程度（0~1，量化為 0.1 級距，避免過度重繪） */
export function useLampGlow(): number {
  return useEnv((s) => Math.round(lampLevel(autoLampAt(s.hour), s.lampMode) * 10) / 10);
}
