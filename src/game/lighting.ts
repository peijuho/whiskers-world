import { Color } from "three";

/**
 * 依遊戲時間取樣光照：在關鍵時間點之間以 smoothstep 平滑插值（無突然跳變）。
 * 取樣結果寫入可重複使用的物件，避免每幀配置記憶體。
 */

interface Key {
  readonly h: number;
  readonly sun: string;
  readonly sunI: number;
  readonly amb: string;
  readonly ambI: number;
  readonly hemiSky: string;
  readonly hemiGround: string;
  readonly hemiI: number;
  readonly sky: string;
  readonly lamp: number;
}

const NIGHT = { sun: "#a9bcff", sunI: 0.55, amb: "#6677b0", ambI: 0.95, hemiSky: "#4a5c94", hemiGround: "#5a4a58", hemiI: 0.7, sky: "#1d2a4d", lamp: 1 } as const;

const KEYS: readonly Key[] = [
  { h: 0, ...NIGHT },
  { h: 5, ...NIGHT, sky: "#25325a" },
  { h: 6.5, sun: "#ffb98a", sunI: 0.5, amb: "#c9b6a8", ambI: 0.5, hemiSky: "#e8c9b0", hemiGround: "#c9a27a", hemiI: 0.45, sky: "#f0b996", lamp: 0.6 },
  { h: 8, sun: "#ffe0b0", sunI: 1.6, amb: "#ffe9d2", ambI: 0.6, hemiSky: "#dcebf2", hemiGround: "#c9a27a", hemiI: 0.55, sky: "#d9e8f0", lamp: 0.15 },
  { h: 10, sun: "#ffecd0", sunI: 2.0, amb: "#fff2e0", ambI: 0.65, hemiSky: "#dcebf2", hemiGround: "#c9a27a", hemiI: 0.55, sky: "#d4e8f3", lamp: 0 },
  { h: 13, sun: "#fff8ee", sunI: 2.3, amb: "#fff6e8", ambI: 0.7, hemiSky: "#dcebf2", hemiGround: "#c9a27a", hemiI: 0.55, sky: "#cfe6f4", lamp: 0 },
  { h: 16, sun: "#fff0d8", sunI: 2.1, amb: "#fff0dc", ambI: 0.68, hemiSky: "#dcebf2", hemiGround: "#c9a27a", hemiI: 0.55, sky: "#d6e6ee", lamp: 0 },
  { h: 17.5, sun: "#ffc27a", sunI: 1.5, amb: "#ffe0b8", ambI: 0.6, hemiSky: "#ffd9b0", hemiGround: "#c9a27a", hemiI: 0.5, sky: "#f5c49a", lamp: 0.35 },
  { h: 18.5, sun: "#ff9b5a", sunI: 0.9, amb: "#ffcfa0", ambI: 0.5, hemiSky: "#ffc59a", hemiGround: "#b98a6a", hemiI: 0.45, sky: "#f08e62", lamp: 0.75 },
  { h: 19.5, sun: "#ff8a6a", sunI: 0.4, amb: "#c8a0a8", ambI: 0.65, hemiSky: "#8a7aa8", hemiGround: "#5a4a4a", hemiI: 0.55, sky: "#6c5d8a", lamp: 1 },
  { h: 21, ...NIGHT, amb: "#7a82b4", ambI: 0.85, sky: "#2e3a68" },
  { h: 23, ...NIGHT },
  { h: 24, ...NIGHT },
];

const C = (hex: string) => new Color(hex);
const PRE = KEYS.map((k) => ({
  sun: C(k.sun), amb: C(k.amb), hemiSky: C(k.hemiSky), hemiGround: C(k.hemiGround), sky: C(k.sky),
}));

export interface WeatherFactors {
  /** 直射光倍率 */
  readonly sun: number;
  /** 環境光倍率 */
  readonly amb: number;
  /** 天空染色強度與顏色（可省略） */
  readonly skyMix?: number;
  readonly tint?: Color;
}

const COOL = new Color("#dfe7ee");
const tintTmp = new Color();

export interface LightingState {
  sunColor: Color;
  sunIntensity: number;
  ambColor: Color;
  ambIntensity: number;
  hemiSky: Color;
  hemiGround: Color;
  hemiIntensity: number;
  sky: Color;
  /** 室內燈（檯燈、落地燈）自動亮度 0..1 */
  lamp: number;
  isDay: boolean;
  /** 太陽 / 月亮在弧線上的位置 0..1 */
  arc: number;
  /** 0..1：太陽高度（弧線頂點為 1） */
  elevation: number;
  /** 0..1：日光斑強度（窗外陽光投在地板上） */
  sunPatch: number;
}

export function createLightingState(): LightingState {
  return {
    sunColor: new Color(), sunIntensity: 0, ambColor: new Color(), ambIntensity: 0,
    hemiSky: new Color(), hemiGround: new Color(), hemiIntensity: 0, sky: new Color(),
    lamp: 0, isDay: true, arc: 0, elevation: 0, sunPatch: 0,
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const NO_WEATHER: WeatherFactors = { sun: 1, amb: 1 };

export function sampleLighting(
  hourIn: number,
  out: LightingState,
  weather: WeatherFactors = NO_WEATHER,
): void {
  const hour = ((hourIn % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && hour >= KEYS[i + 1].h) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const k = smooth(Math.min(Math.max((hour - a.h) / (b.h - a.h), 0), 1));
  const pa = PRE[i], pb = PRE[i + 1];
  const lerp = (x: number, y: number) => x + (y - x) * k;

  out.sunColor.copy(pa.sun).lerp(pb.sun, k);
  out.ambColor.copy(pa.amb).lerp(pb.amb, k);
  out.hemiSky.copy(pa.hemiSky).lerp(pb.hemiSky, k);
  out.hemiGround.copy(pa.hemiGround).lerp(pb.hemiGround, k);
  out.sky.copy(pa.sky).lerp(pb.sky, k);
  const day = hour >= 6 && hour < 18;
  out.isDay = day;
  // 夜間的月光不受天氣影響太多
  out.sunIntensity = lerp(a.sunI, b.sunI) * (day ? weather.sun : Math.max(weather.sun, 0.7));
  out.ambIntensity = lerp(a.ambI, b.ambI) * weather.amb;
  out.hemiIntensity = lerp(a.hemiI, b.hemiI) * weather.amb;
  out.lamp = lerp(a.lamp, b.lamp);
  const mix = weather.skyMix ?? 0;
  if (mix > 0.001 && weather.tint) {
    // 以目前天色的亮度縮放天氣色，夜晚的雨雲不會變亮
    const lumS = out.sky.r * 0.3 + out.sky.g * 0.59 + out.sky.b * 0.11;
    const lumT = Math.max(weather.tint.r * 0.3 + weather.tint.g * 0.59 + weather.tint.b * 0.11, 0.05);
    tintTmp.copy(weather.tint).multiplyScalar(Math.min(1, lumS / lumT));
    out.sky.lerp(tintTmp, mix);
    out.ambColor.lerp(COOL, mix * 0.3);
    out.sunColor.lerp(COOL, mix * 0.4);
  }
  out.arc = day ? (hour - 6) / 12 : ((hour - 18 + 24) % 24) / 12;
  out.elevation = Math.sin(Math.PI * out.arc);
  out.sunPatch = day ? Math.min(Math.max((lerp(a.sunI, b.sunI) - 0.5) / 1.6, 0), 1) * weather.sun : 0;
}

const scratch = createLightingState();
/** 自動模式下的室內燈亮度（只取亮度，供 UI / 材質使用） */
export function autoLampAt(hour: number): number {
  sampleLighting(hour, scratch);
  return scratch.lamp;
}

/** 窗外日光斑落在地板上的位置：早晨偏向一側，傍晚移到另一側，太陽越低光斑越長 */
export function sunPatchTransform(arc: number, elevation: number) {
  return {
    x: 1.5 - 1.3 * (1 - 2 * arc),
    z: -1.7 + (1 - elevation) * 2.2,
    stretch: 1 + (1 - elevation) * 1.2,
  };
}
