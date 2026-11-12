import { useSyncExternalStore } from "react";
import { loadSave, patchSave } from "./persistence";
import { environmentActions } from "./environmentStore";
import { hydrateSettingsFromSave } from "./settingsStore";
import { FURNITURE_CATALOG, MAX_ITEMS, type FurnitureType } from "./furnitureCatalog";
import {
  DEFAULT_ITEMS,
  alignToWalls,
  findFreeSpot,
  isPlacementValid,
  nextId,
  sanitizeItems,
  snapAndClamp,
  type PlacedItemData,
  type Rotation,
} from "./layout";

/** 外部小型 store（不新增套件），讓 DOM UI 與 R3F 場景共享狀態 */

export type Mode = "view" | "edit";
export type Focus = "room" | "cat";

export interface Draft {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  readonly rot: Rotation;
  readonly valid: boolean;
  /** 抓取點與物件中心的偏移 */
  readonly offsetX: number;
  readonly offsetZ: number;
}

export interface Notice {
  readonly id: number;
  readonly text: string;
  readonly tone: "ok" | "warn";
}

export interface RoomState {
  readonly mode: Mode;
  /** 鏡頭焦點：整間房間 or 近看小貓 */
  readonly focus: Focus;
  readonly panelOpen: boolean;
  readonly hydrated: boolean;
  readonly items: readonly PlacedItemData[];
  /** 復原 / 重做歷史（每筆是一份完整布置快照） */
  readonly past: readonly (readonly PlacedItemData[])[];
  readonly future: readonly (readonly PlacedItemData[])[];
  readonly selectedId: string | null;
  readonly draft: Draft | null;
  readonly notice: Notice | null;
}

const HISTORY_LIMIT = 50;

const INITIAL_STATE: RoomState = {
  mode: "view",
  focus: "room",
  panelOpen: false,
  hydrated: false,
  items: DEFAULT_ITEMS,
  past: [],
  future: [],
  selectedId: null,
  draft: null,
  notice: null,
};

let state: RoomState = INITIAL_STATE;
let noticeCounter = 0;
const listeners = new Set<() => void>();

function set(partial: Partial<RoomState>) {
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRoomStore<T>(selector: (s: RoomState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(INITIAL_STATE),
  );
}

export const getRoomState = () => state;

function notice(text: string, tone: Notice["tone"]) {
  noticeCounter += 1;
  set({ notice: { id: noticeCounter, text, tone } });
}

function persist(items: readonly PlacedItemData[]): boolean {
  return patchSave({ items });
}

/** 提交一次可復原的變更 */
function commit(items: readonly PlacedItemData[]) {
  set({
    items,
    past: [...state.past, state.items].slice(-HISTORY_LIMIT),
    future: [],
  });
  if (persist(items)) notice("已自動儲存", "ok");
  else notice("無法儲存（瀏覽器儲存空間不可用）", "warn");
}

/** 復原 / 重做：切換到另一份快照並存檔 */
function restore(
  items: readonly PlacedItemData[],
  past: RoomState["past"],
  future: RoomState["future"],
  text: string,
) {
  const stillThere = items.some((i) => i.id === state.selectedId);
  set({
    items,
    past,
    future,
    draft: null,
    selectedId: stillThere ? state.selectedId : null,
  });
  persist(items);
  notice(text, "ok");
}

export const roomActions = {
  /** 於瀏覽器端載入存檔；讀不到或格式錯誤則使用預設布置 */
  hydrate() {
    if (state.hydrated) return;
    let items: readonly PlacedItemData[] = DEFAULT_ITEMS;
    const clean = sanitizeItems(loadSave().items);
    if (clean) items = clean;
    hydrateSettingsFromSave();
    environmentActions.hydrate();
    set({ items, hydrated: true });
  },

  setMode(mode: Mode) {
    if (mode === "view") {
      set({ mode, panelOpen: false, selectedId: null, draft: null });
    } else {
      set({ mode });
    }
  },

  /** 鏡頭切換：近看小貓時自動離開編輯模式 */
  toggleFocus() {
    if (state.focus === "room") {
      set({ focus: "cat", mode: "view", panelOpen: false, selectedId: null, draft: null });
    } else {
      set({ focus: "room" });
    }
  },

  toggleEdit() {
    roomActions.setMode(state.mode === "edit" ? "view" : "edit");
  },

  /** 開關裝飾面板 */
  togglePanel() {
    set({ panelOpen: !state.panelOpen });
  },

  closePanel() {
    set({ panelOpen: false });
  },

  select(id: string | null) {
    if (state.mode !== "edit") return;
    set({ selectedId: id });
  },

  startDrag(id: string, pointX: number, pointZ: number) {
    const item = state.items.find((i) => i.id === id);
    if (!item || state.mode !== "edit") return;
    set({
      selectedId: id,
      draft: {
        id,
        x: item.x,
        z: item.z,
        rot: item.rot,
        valid: true,
        offsetX: item.x - pointX,
        offsetZ: item.z - pointZ,
      },
    });
  },

  updateDrag(pointX: number, pointZ: number) {
    const d = state.draft;
    if (!d) return;
    const item = state.items.find((i) => i.id === d.id);
    if (!item) return;
    // 靠牆家具會自動貼牆並轉向；離牆後恢復原朝向
    const p = alignToWalls(item.type, item.rot, pointX + d.offsetX, pointZ + d.offsetZ);
    if (p.x === d.x && p.z === d.z && p.rot === d.rot) return;
    const valid = isPlacementValid(state.items, item.id, { type: item.type, ...p });
    set({ draft: { ...d, ...p, valid } });
  },

  endDrag() {
    const d = state.draft;
    if (!d) return;
    const item = state.items.find((i) => i.id === d.id);
    set({ draft: null });
    if (!item) return;
    if (d.x === item.x && d.z === item.z && d.rot === item.rot) return;
    if (!d.valid) {
      notice("這裡放不下，已回到原位", "warn");
      return;
    }
    commit(
      state.items.map((i) =>
        i.id === d.id ? { ...i, x: d.x, z: d.z, rot: d.rot } : i,
      ),
    );
  },

  rotateSelected() {
    const item = state.items.find((i) => i.id === state.selectedId);
    if (!item || state.draft) return;
    const rot = ((item.rot + 1) % 4) as Rotation;
    const p = snapAndClamp(item.type, rot, item.x, item.z);
    if (!isPlacementValid(state.items, item.id, { type: item.type, rot, ...p })) {
      notice("旁邊空間不夠，無法旋轉", "warn");
      return;
    }
    commit(state.items.map((i) => (i.id === item.id ? { ...i, rot, ...p } : i)));
  },

  removeSelected() {
    const id = state.selectedId;
    if (!id || state.draft) return;
    set({ selectedId: null });
    commit(state.items.filter((i) => i.id !== id));
  },

  addItem(type: FurnitureType) {
    if (state.items.length >= MAX_ITEMS) {
      notice(`房間最多放 ${MAX_ITEMS} 件家具`, "warn");
      return;
    }
    const spot = findFreeSpot(state.items, type);
    if (!spot) {
      notice(`房間沒有空位放${FURNITURE_CATALOG[type].label}了`, "warn");
      return;
    }
    const item: PlacedItemData = { id: nextId(state.items, type), type, rot: 0, ...spot };
    set({ selectedId: item.id, mode: "edit" });
    commit([...state.items, item]);
  },

  undo() {
    if (state.draft || state.past.length === 0) return;
    const prev = state.past[state.past.length - 1];
    restore(prev, state.past.slice(0, -1), [state.items, ...state.future], "已復原");
  },

  redo() {
    if (state.draft || state.future.length === 0) return;
    const [next, ...rest] = state.future;
    restore(next, [...state.past, state.items], rest, "已重做");
  },

  resetLayout() {
    set({ selectedId: null, draft: null });
    commit(DEFAULT_ITEMS); // 同樣可以復原
  },
};
