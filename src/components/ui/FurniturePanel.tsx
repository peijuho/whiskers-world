"use client";

import { useState } from "react";
import {
  CATEGORIES,
  FURNITURE_CATALOG,
  FURNITURE_TYPES,
  MAX_ITEMS,
  type CategoryId,
} from "@/game/furnitureCatalog";
import { FURNITURE_STYLES, STYLE_AFFINITY, STYLE_IDS } from "@/game/furnitureStyles";
import { roomActions, useRoomStore } from "@/game/roomStore";
import { settingsActions, useSettings } from "@/game/settingsStore";

export function FurnitureTab() {
  const count = useRoomStore((s) => s.items.length);
  const [confirmReset, setConfirmReset] = useState(false);
  const [category, setCategory] = useState<CategoryId>("bed");
  const style = useSettings((s) => s.furnitureStyle);
  const types = FURNITURE_TYPES.filter(
    (t) =>
      FURNITURE_CATALOG[t].category === category &&
      (style === "classic" || STYLE_AFFINITY[t].includes(style)),
  );

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs text-ink/60">風格</span>
        <span className="text-xs text-ink/60">
          {count} / {MAX_ITEMS}
        </span>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {STYLE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            title={FURNITURE_STYLES[id].blurb}
            aria-pressed={style === id}
            onClick={() => settingsActions.update({ furnitureStyle: id })}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              style === id ? "bg-wood-deep text-white" : "bg-cream/70 text-ink/70 hover:bg-white/70"
            }`}
          >
            {FURNITURE_STYLES[id].label}
          </button>
        ))}
      </div>

      <div role="tablist" className="mb-3 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={category === c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              category === c.id
                ? "bg-sage text-white"
                : "bg-cream/70 text-ink/70 hover:bg-white/70"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {types.length === 0 && (
        <p className="py-2 text-center text-xs text-ink/60">這個分類沒有適合此風格的家具</p>
      )}
      <ul className="grid grid-cols-2 gap-2">
        {types.map((type) => {
          const def = FURNITURE_CATALOG[type];
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => roomActions.addItem(type)}
                className="flex w-full items-center gap-2 rounded-2xl border border-wood/40 bg-cream/70 px-3 py-2 text-sm text-ink transition hover:-translate-y-0.5 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-sage-deep"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                  style={{ background: def.swatch }}
                  aria-hidden
                />
                {def.label}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => {
          if (!confirmReset) {
            setConfirmReset(true);
            return;
          }
          roomActions.resetLayout();
          setConfirmReset(false);
        }}
        onBlur={() => setConfirmReset(false)}
        className="mt-3 w-full rounded-full px-3 py-1.5 text-xs text-ink/70 underline-offset-2 hover:underline"
      >
        {confirmReset ? "再按一次確認：恢復預設布置" : "恢復預設布置"}
      </button>
    </div>
  );
}
