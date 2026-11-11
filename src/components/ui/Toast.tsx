"use client";

import { useEffect, useState } from "react";
import { useRoomStore } from "@/game/roomStore";

/** 簡短提示：已儲存 / 放不下等 */
export function Toast() {
  const notice = useRoomStore((s) => s.notice);
  const [visibleId, setVisibleId] = useState<number | null>(null);

  useEffect(() => {
    if (!notice) return;
    const show = window.setTimeout(() => setVisibleId(notice.id), 0);
    const hide = window.setTimeout(() => setVisibleId(null), 1800);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [notice]);

  if (!notice || visibleId !== notice.id) return null;
  const warn = notice.tone === "warn";
  return (
    <div
      role="status"
      className={`paper-card absolute left-1/2 top-20 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm sm:top-6 ${
        warn ? "text-[#b8604f]" : "text-sage-deep"
      }`}
    >
      {warn ? "⚠ " : "✓ "}
      {notice.text}
    </div>
  );
}
