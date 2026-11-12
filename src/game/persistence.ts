import type { PlacedItemData } from "./layout";

/**
 * 統一的 localStorage 存檔（沿用原本的 key，格式升級為 v2）。
 *  - v1：{ version: 1, items }
 *  - v2：{ version: 2, items, settings }
 * 讀取時相容 v1；寫入時一律輸出 v2，並保留另一邊尚未變更的欄位，避免互相覆蓋。
 */
const STORAGE_KEY = "whiskers-world:room:v1";
export const SAVE_VERSION = 2;

export interface RawSave {
  readonly items: unknown;
  readonly settings: unknown;
}

let cache: { items?: unknown; settings?: unknown } = {};

export function loadSave(): RawSave {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        const p = parsed as { version?: unknown; items?: unknown; settings?: unknown };
        // v1 沒有 settings；未知的未來版本一律當作只有 items 可讀
        cache = {
          items: p.items,
          settings: p.version === 2 ? p.settings : undefined,
        };
      }
    }
  } catch {
    cache = {};
  }
  return { items: cache.items, settings: cache.settings };
}

/** 合併寫入；回傳是否成功 */
export function patchSave(patch: {
  items?: readonly PlacedItemData[];
  settings?: unknown;
}): boolean {
  cache = { ...cache, ...patch };
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SAVE_VERSION, ...cache }),
    );
    return true;
  } catch {
    return false;
  }
}
