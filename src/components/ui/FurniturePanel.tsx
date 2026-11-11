"use client";

import { useState } from "react";
import {
  CATEGORIES,
  FURNITURE_CATALOG,
  FURNITURE_TYPES,
  MAX_ITEMS,
  type CategoryId,
} from "@/game/furnitureCatalog";
import { roomActions, useRoomStore } from "@/game/roomStore";

export function FurniturePanel() {
  const count = useRoomStore((s) => s.items.length);
  const [confirmReset, setConfirmReset] = useState(false);
  const [category, setCategory] = useState<CategoryId>("bed");
  const types = FURNITURE_TYPES.filter(
    (t) => FURNITURE_CATALOG[t].category === category,
  );

  return (
    <section
      aria-label="家具清單"
      className="paper-card pointer-events-auto w-72 max-w-[calc(100vw-2rem)] rounded-3xl p-4"
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-storybook text-lg font-semibold italic text-wood-deep">
          家具
        </h2>
        <span className="text-xs text-ink/60">
          {count} / {MAX_ITEMS}
        </span>
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
    </section>
  );
}
