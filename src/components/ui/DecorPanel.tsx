"use client";

import { useState } from "react";
import {
  FLOOR_STYLES,
  FLOOR_TONES,
  WALL_COLORS,
  WALL_MATERIALS,
  WALL_STYLES,
} from "@/game/roomTheme";
import { settingsActions, useSettings } from "@/game/settingsStore";
import { Chip, Label, Swatch } from "./controls";
import { FurnitureTab } from "./FurniturePanel";
import { AudioTab, WeatherTab } from "./EnvironmentTabs";
import { LightingTab } from "./LightingTab";

const TABS = [
  { id: "wall", label: "牆面" },
  { id: "floor", label: "地板" },
  { id: "furniture", label: "家具" },
  { id: "light", label: "燈光" },
  { id: "weather", label: "天氣" },
  { id: "audio", label: "音效" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function WallTab() {
  const s = useSettings((x) => x);
  return (
    <div>
      <Label>顏色</Label>
      <div className="flex flex-wrap gap-2">
        {WALL_COLORS.map((c) => (
          <Swatch
            key={c.id}
            label={c.label}
            color={`linear-gradient(${c.upper} 55%, ${c.lower} 55%)`}
            active={s.wallColor === c.id}
            onClick={() => settingsActions.update({ wallColor: c.id })}
          />
        ))}
      </div>
      <Label>材質</Label>
      <div className="flex flex-wrap gap-1.5">
        {WALL_MATERIALS.map((m) => (
          <Chip key={m.id} active={s.wallMaterial === m.id} onClick={() => settingsActions.update({ wallMaterial: m.id })}>
            {m.label}
          </Chip>
        ))}
      </div>
      <Label>樣式</Label>
      <div className="flex flex-wrap gap-1.5">
        {WALL_STYLES.map((m) => (
          <Chip key={m.id} active={s.wallStyle === m.id} onClick={() => settingsActions.update({ wallStyle: m.id })}>
            {m.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function FloorTab() {
  const s = useSettings((x) => x);
  return (
    <div>
      <Label>材質</Label>
      <div className="flex flex-wrap gap-1.5">
        {FLOOR_STYLES.map((f) => (
          <Chip key={f.id} active={s.floorStyle === f.id} onClick={() => settingsActions.update({ floorStyle: f.id })}>
            {f.label}
          </Chip>
        ))}
      </div>
      <Label>色調</Label>
      <div className="flex gap-2">
        {FLOOR_TONES[s.floorStyle].map((t, i) => (
          <Swatch key={t.label} label={t.label} color={t.color} active={s.floorTone === i} onClick={() => settingsActions.update({ floorTone: i })} />
        ))}
      </div>
    </div>
  );
}

/** 精簡的裝飾面板：牆面 / 地板 / 家具（燈光與環境在後續階段加入） */
export function DecorPanel() {
  const [tab, setTab] = useState<TabId>("wall");
  return (
    <section
      aria-label="裝飾"
      className="paper-card pointer-events-auto w-72 max-w-[calc(100vw-2rem)] rounded-3xl p-4"
    >
      <div role="tablist" className="mb-3 flex gap-1 rounded-full bg-cream/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full py-1 text-xs sm:text-sm font-semibold transition ${
              tab === t.id ? "bg-white text-wood-deep shadow-sm" : "text-ink/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "wall" && <WallTab />}
      {tab === "floor" && <FloorTab />}
      {tab === "furniture" && <FurnitureTab />}
      {tab === "light" && <LightingTab />}
      {tab === "weather" && <WeatherTab />}
      {tab === "audio" && <AudioTab />}
    </section>
  );
}
