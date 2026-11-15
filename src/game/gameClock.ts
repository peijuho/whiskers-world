/** 遊戲時鐘的設定與工具（與現實時間脫鉤，可由玩家控制）。 */

export type PeriodId = "morning" | "afternoon" | "sunset" | "evening" | "night";

/** 預設時段（可自行調整；每項為 [起始, 結束) 小時，night 跨日） */
export const DEFAULT_CYCLE: Readonly<Record<PeriodId, readonly [number, number]>> = {
  morning: [7, 12],
  afternoon: [12, 17],
  sunset: [17, 19],
  evening: [19, 23],
  night: [23, 7],
};

export const PERIOD_LABEL: Readonly<Record<PeriodId, string>> = {
  morning: "早晨",
  afternoon: "午後",
  sunset: "黃昏",
  evening: "傍晚",
  night: "夜晚",
};

export const PERIOD_ORDER: readonly PeriodId[] = ["morning", "afternoon", "sunset", "evening", "night"];

export function periodOf(hour: number, cycle = DEFAULT_CYCLE): PeriodId {
  const h = ((hour % 24) + 24) % 24;
  for (const id of PERIOD_ORDER) {
    const [a, b] = cycle[id];
    if (a <= b ? h >= a && h < b : h >= a || h < b) return id;
  }
  return "night";
}

/** 速度倍率：1x = 每現實 1 秒經過遊戲 1 分鐘（一天約 24 分鐘） */
export const SPEEDS = [0.5, 1, 2, 4, 12] as const;
export type Speed = (typeof SPEEDS)[number];
export const isSpeed = (v: unknown): v is Speed =>
  typeof v === "number" && (SPEEDS as readonly number[]).includes(v);

export const GAME_MINUTES_PER_SECOND = 1;

export function formatTime(hour: number): string {
  const total = Math.floor((((hour % 24) + 24) % 24) * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 各時段的代表時間（供快速跳轉） */
export const PERIOD_START_HOUR: Readonly<Record<PeriodId, number>> = {
  morning: 8,
  afternoon: 13,
  sunset: 18,
  evening: 20,
  night: 0.5,
};
