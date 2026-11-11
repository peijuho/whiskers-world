"use client";

import { FURNITURE_CATALOG } from "@/game/furnitureCatalog";
import { roomActions, useRoomStore } from "@/game/roomStore";

const btn =
  "rounded-full px-3 py-1.5 text-sm font-semibold transition hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-sage-deep";

/** 選取家具後的浮動工具列：旋轉、移除、完成 */
export function SelectionBar() {
  const type = useRoomStore(
    (s) => s.items.find((i) => i.id === s.selectedId)?.type ?? null,
  );
  const editing = useRoomStore((s) => s.mode === "edit");
  if (!editing || !type) return null;

  return (
    <div className="paper-card pointer-events-auto absolute bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1.5 sm:bottom-6">
      <span className="px-2 text-sm text-ink/70">
        {FURNITURE_CATALOG[type].label}
      </span>
      <button type="button" className={`${btn} text-mist-deep`} onClick={roomActions.rotateSelected}>
        旋轉 <kbd className="text-xs opacity-60">R</kbd>
      </button>
      <button type="button" className={`${btn} text-[#b8604f]`} onClick={roomActions.removeSelected}>
        移除 <kbd className="text-xs opacity-60">Del</kbd>
      </button>
      <button type="button" className={`${btn} text-sage-deep`} onClick={() => roomActions.select(null)}>
        完成
      </button>
    </div>
  );
}
