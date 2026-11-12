"use client";

import { audioStatus } from "@/game/audioEngine";
import { environmentActions, useEnv } from "@/game/environmentStore";
import { settingsActions, useSettings } from "@/game/settingsStore";
import { WEATHERS, WEATHER_IDS } from "@/game/weather";
import { Chip, Label } from "./controls";

export function WeatherTab() {
  const weather = useEnv((s) => s.weather);
  const mode = useEnv((s) => s.weatherMode);
  return (
    <div>
      <Label>天氣</Label>
      <div className="grid grid-cols-2 gap-2">
        {WEATHER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={weather === id}
            onClick={() => environmentActions.setWeather(id)}
            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition hover:-translate-y-0.5 ${
              weather === id ? "border-sage bg-sage/25 font-semibold text-ink" : "border-wood/40 bg-cream/70 text-ink/80"
            }`}
          >
            <span aria-hidden>{WEATHERS[id].icon}</span>
            {WEATHERS[id].label}
          </button>
        ))}
      </div>
      <Label>模式</Label>
      <div className="flex gap-1.5">
        <Chip active={mode === "manual"} onClick={() => environmentActions.setWeatherMode("manual")}>手動</Chip>
        <Chip active={mode === "random"} onClick={() => environmentActions.setWeatherMode("random")}>隨機</Chip>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink/55">天氣只會出現在窗外，並影響日光強度與室內氣氛。</p>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-ink/60">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#7f9378]"
      />
    </div>
  );
}

export function AudioTab() {
  const master = useSettings((s) => s.audioMaster);
  const muted = useSettings((s) => s.audioMuted);
  const ambient = useSettings((s) => s.audioAmbient);
  const rain = useSettings((s) => s.audioRain);
  const unlocked = audioStatus.use((s) => s.unlocked);
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <Chip active={muted} onClick={() => settingsActions.update({ audioMuted: !muted })}>
          {muted ? "🔇 已靜音" : "🔊 靜音"}
        </Chip>
        <Chip active={ambient} onClick={() => settingsActions.update({ audioAmbient: !ambient })}>
          環境音 {ambient ? "開" : "關"}
        </Chip>
      </div>
      <Slider label="主音量" value={master} onChange={(v) => settingsActions.update({ audioMaster: v })} />
      <Slider label="雨聲音量" value={rain} onChange={(v) => settingsActions.update({ audioRain: v })} />
      <p className="text-xs leading-relaxed text-ink/55">
        {unlocked
          ? "雨聲只會在下雨時出現；風聲、室內聲與夜間蟲鳴屬於環境音。"
          : "瀏覽器需要先有一次互動才能播放聲音，點一下畫面即可啟用。"}
      </p>
    </div>
  );
}
