"use client";

import { environmentActions, useEnv } from "@/game/environmentStore";
import {
  PERIOD_LABEL,
  PERIOD_ORDER,
  PERIOD_START_HOUR,
  SPEEDS,
  formatTime,
  periodOf,
} from "@/game/gameClock";
import type { LampMode } from "@/game/settingsStore";
import { Chip, Label } from "./controls";

const LAMP_LABEL: Record<LampMode, string> = { auto: "自動", on: "常亮", off: "關閉" };

/** 目前遊戲時間（每個遊戲分鐘才更新一次） */
export function useGameMinute(): number {
  return useEnv((s) => Math.floor(s.hour * 60));
}

export function ClockBadge() {
  const minute = useGameMinute();
  const hour = minute / 60;
  return (
    <span className="tabular-nums">
      {formatTime(hour)} · {PERIOD_LABEL[periodOf(hour)]}
    </span>
  );
}

export function LightingTab() {
  const minute = useGameMinute();
  const paused = useEnv((s) => s.paused);
  const speed = useEnv((s) => s.speed);
  const lampMode = useEnv((s) => s.lampMode);
  const hour = minute / 60;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-storybook text-2xl font-semibold tabular-nums text-wood-deep">
          {formatTime(hour)}
        </span>
        <span className="text-sm text-sage-deep">{PERIOD_LABEL[periodOf(hour)]}</span>
      </div>
      <input
        type="range"
        min={0}
        max={24}
        step={0.25}
        value={hour}
        aria-label="遊戲時間"
        onChange={(e) => environmentActions.setHour(Number(e.target.value))}
        className="mt-2 w-full accent-[#7f9378]"
      />
      <div className="mt-1 flex flex-wrap gap-1.5">
        {PERIOD_ORDER.map((p) => (
          <Chip key={p} active={periodOf(hour) === p} onClick={() => environmentActions.setHour(PERIOD_START_HOUR[p])}>
            {PERIOD_LABEL[p]}
          </Chip>
        ))}
      </div>

      <Label>時間流動</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={paused} onClick={environmentActions.togglePause}>
          {paused ? "▶ 繼續" : "⏸ 暫停"}
        </Chip>
        {SPEEDS.map((s) => (
          <Chip key={s} active={speed === s} onClick={() => environmentActions.setSpeed(s)}>
            {s}x
          </Chip>
        ))}
      </div>

      <Label>室內燈光</Label>
      <div className="flex gap-1.5">
        {(Object.keys(LAMP_LABEL) as LampMode[]).map((m) => (
          <Chip key={m} active={lampMode === m} onClick={() => environmentActions.setLampMode(m)}>
            {LAMP_LABEL[m]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
