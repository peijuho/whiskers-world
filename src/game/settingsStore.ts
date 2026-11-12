import { createStore } from "./createStore";
import { isSpeed, type Speed } from "./gameClock";
import { isStyleId, type StyleId } from "./furnitureStyles";
import { loadSave, patchSave } from "./persistence";
import {
  isFloorStyle,
  isWallColor,
  isWallMaterial,
  isWallStyle,
  FLOOR_TONES,
  type FloorStyleId,
  type WallColorId,
  type WallMaterialId,
  type WallStyleId,
} from "./roomTheme";

/** 會被存檔的房間 / 環境設定（之後階段會再擴充 env、audio） */
export interface Settings {
  readonly wallColor: WallColorId;
  readonly wallMaterial: WallMaterialId;
  readonly wallStyle: WallStyleId;
  readonly floorStyle: FloorStyleId;
  readonly floorTone: number;
  readonly furnitureStyle: StyleId;
  /** 遊戲時鐘與燈光偏好 */
  readonly clockHour: number;
  readonly clockPaused: boolean;
  readonly clockSpeed: Speed;
  readonly lampMode: LampMode;
}

export type LampMode = "auto" | "on" | "off";
const LAMP_MODES: readonly LampMode[] = ["auto", "on", "off"];

export const DEFAULT_SETTINGS: Settings = {
  wallColor: "sage-green",
  wallMaterial: "paint",
  wallStyle: "two-tone",
  floorStyle: "wood",
  floorTone: 0,
  furnitureStyle: "classic",
  clockHour: 9,
  clockPaused: false,
  clockSpeed: 1,
  lampMode: "auto",
};

/** 驗證任意資料；缺漏或不合法的欄位退回預設值 */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const floorStyle = isFloorStyle(r.floorStyle) ? r.floorStyle : DEFAULT_SETTINGS.floorStyle;
  const tone =
    typeof r.floorTone === "number" && Number.isInteger(r.floorTone) &&
    r.floorTone >= 0 && r.floorTone < FLOOR_TONES[floorStyle].length
      ? r.floorTone
      : 0;
  return {
    wallColor: isWallColor(r.wallColor) ? r.wallColor : DEFAULT_SETTINGS.wallColor,
    wallMaterial: isWallMaterial(r.wallMaterial) ? r.wallMaterial : DEFAULT_SETTINGS.wallMaterial,
    wallStyle: isWallStyle(r.wallStyle) ? r.wallStyle : DEFAULT_SETTINGS.wallStyle,
    floorStyle,
    floorTone: tone,
    furnitureStyle: isStyleId(r.furnitureStyle) ? r.furnitureStyle : DEFAULT_SETTINGS.furnitureStyle,
    clockHour:
      typeof r.clockHour === "number" && Number.isFinite(r.clockHour)
        ? ((r.clockHour % 24) + 24) % 24
        : DEFAULT_SETTINGS.clockHour,
    clockPaused: typeof r.clockPaused === "boolean" ? r.clockPaused : DEFAULT_SETTINGS.clockPaused,
    clockSpeed: isSpeed(r.clockSpeed) ? r.clockSpeed : DEFAULT_SETTINGS.clockSpeed,
    lampMode: (LAMP_MODES as readonly unknown[]).includes(r.lampMode) ? (r.lampMode as LampMode) : DEFAULT_SETTINGS.lampMode,
  };
}

const store = createStore<Settings>(DEFAULT_SETTINGS);

export const useSettings = store.use;
export const getSettings = store.get;

export const settingsActions = {
  hydrate(raw: unknown) {
    store.set(sanitizeSettings(raw));
  },
  update(patch: Partial<Settings>) {
    // 換地板款式時，色調回到該款式的預設
    const next = sanitizeSettings({
      ...store.get(),
      ...(patch.floorStyle && patch.floorTone === undefined ? { floorTone: 0 } : {}),
      ...patch,
    });
    store.set(next);
    patchSave({ settings: next });
  },
};

/** 從存檔載入設定（僅瀏覽器端呼叫） */
export function hydrateSettingsFromSave() {
  settingsActions.hydrate(loadSave().settings);
}
