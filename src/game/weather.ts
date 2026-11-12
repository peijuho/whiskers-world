import { Color } from "three";

export const WEATHER_IDS = ["sunny", "cloudy", "rainy", "snowy"] as const;
export type WeatherId = (typeof WEATHER_IDS)[number];
export const isWeatherId = (v: unknown): v is WeatherId =>
  typeof v === "string" && (WEATHER_IDS as readonly string[]).includes(v);

export type WeatherMode = "manual" | "random";
export const isWeatherMode = (v: unknown): v is WeatherMode => v === "manual" || v === "random";

interface WeatherDef {
  readonly label: string;
  readonly icon: string;
  /** 直射光 / 環境光倍率 */
  readonly sun: number;
  readonly amb: number;
  /** 窗外效果強度 0..1 */
  readonly cloud: number;
  readonly rain: number;
  readonly snow: number;
  /** 天空染色 */
  readonly skyMix: number;
  readonly tint: string;
}

export const WEATHERS: Readonly<Record<WeatherId, WeatherDef>> = {
  sunny: { label: "晴天", icon: "☀️", sun: 1, amb: 1, cloud: 0, rain: 0, snow: 0, skyMix: 0, tint: "#cfe6f4" },
  cloudy: { label: "多雲", icon: "☁️", sun: 0.45, amb: 0.92, cloud: 1, rain: 0, snow: 0, skyMix: 0.6, tint: "#b4bec8" },
  rainy: { label: "下雨", icon: "🌧️", sun: 0.22, amb: 0.8, cloud: 1, rain: 1, snow: 0, skyMix: 0.78, tint: "#7f8c9b" },
  snowy: { label: "下雪", icon: "❄️", sun: 0.5, amb: 1.0, cloud: 0.8, rain: 0, snow: 1, skyMix: 0.55, tint: "#e4ecf4" },
};

/** 目前實際的天氣混合值（向目標平滑過渡，避免突然切換）。可變、非 React 狀態。 */
export interface WeatherBlend {
  sun: number;
  amb: number;
  cloud: number;
  rain: number;
  snow: number;
  skyMix: number;
  tint: Color;
}

export const blend: WeatherBlend = {
  sun: 1, amb: 1, cloud: 0, rain: 0, snow: 0, skyMix: 0, tint: new Color(WEATHERS.sunny.tint),
};

const targetTint = new Color();
const TIME_CONSTANT = 1.4; // 秒
const EPS = 0.002;

/** 依 delta time 平滑逼近目標天氣；回傳這一步是否還有變化（需要重繪）。 */
export function stepWeatherBlend(target: WeatherId, dt: number, snap = false): boolean {
  const t = WEATHERS[target];
  const k = snap ? 1 : 1 - Math.exp(-Math.min(dt, 1) / TIME_CONSTANT);
  let moving = false;
  const approach = (key: "sun" | "amb" | "cloud" | "rain" | "snow" | "skyMix", to: number) => {
    const d = to - blend[key];
    if (Math.abs(d) > EPS) {
      blend[key] += d * k;
      moving = true;
    } else {
      blend[key] = to;
    }
  };
  approach("sun", t.sun);
  approach("amb", t.amb);
  approach("cloud", t.cloud);
  approach("rain", t.rain);
  approach("snow", t.snow);
  approach("skyMix", t.skyMix);
  targetTint.set(t.tint);
  if (Math.abs(blend.tint.r - targetTint.r) + Math.abs(blend.tint.g - targetTint.g) + Math.abs(blend.tint.b - targetTint.b) > EPS) {
    blend.tint.lerp(targetTint, k);
    moving = true;
  }
  return moving;
}

/** 隨機天氣的權重 */
export function pickRandomWeather(current: WeatherId, rand: () => number): WeatherId {
  const table: [WeatherId, number][] = [["sunny", 0.4], ["cloudy", 0.25], ["rainy", 0.2], ["snowy", 0.15]];
  const pool = table.filter(([id]) => id !== current);
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [id, w] of pool) {
    r -= w;
    if (r <= 0) return id;
  }
  return pool[0][0];
}
