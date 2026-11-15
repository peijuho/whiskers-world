"use client";

import { useEffect } from "react";
import { roomActions, useRoomStore } from "@/game/roomStore";
import { DecorPanel } from "./DecorPanel";
import { catStatus } from "@/game/catRuntime";
import { ClockBadge } from "./LightingTab";
import { SelectionBar } from "./SelectionBar";
import { Toast } from "./Toast";

/** 繪本風格的精簡 HUD：標題、房間名、編輯模式、家具面板。 */

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 2.5c.5 4.6 2.9 7 7.5 7.5-4.6.5-7 2.9-7.5 7.5-.5-4.6-2.9-7-7.5-7.5C9.1 9.5 11.5 7.1 12 2.5Z" />
    </svg>
  );
}

function ChairIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 3.5h10l-1 8H8l-1-8Z" />
      <path d="M6 11.5h12v3H6zM8 14.5V21M16 14.5V21" />
    </svg>
  );
}

/** 鍵盤快捷鍵：R 旋轉、Delete 移除、Esc 取消選取 / 關閉面板 */
function UndoIcon({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

/** 小貓目前在做什麼（只在行為改變時更新） */
function CatBadge() {
  const label = catStatus.use((s) => s.label);
  return (
    <p
      data-testid="cat-status"
      className="paper-card mt-2 inline-block rounded-full px-3.5 py-1 text-xs text-wood-deep"
    >
      <span className="font-semibold text-sage-deep">小貓</span> {label}
    </p>
  );
}

function useEditShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) roomActions.redo();
        else roomActions.undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        roomActions.redo();
      } else if (mod || e.altKey) return;
      else if (e.key === "r" || e.key === "R") roomActions.rotateSelected();
      else if (e.key === "Delete" || e.key === "Backspace") roomActions.removeSelected();
      else if (e.key === "Escape") {
        roomActions.select(null);
        roomActions.closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function RoomHud() {
  useEditShortcuts();
  const editing = useRoomStore((s) => s.mode === "edit");
  const panelOpen = useRoomStore((s) => s.panelOpen);
  const focus = useRoomStore((s) => s.focus);
  const canUndo = useRoomStore((s) => s.past.length > 0);
  const canRedo = useRoomStore((s) => s.future.length > 0);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
        <div className="paper-card rounded-3xl px-5 py-3">
          <h1 className="font-storybook text-2xl font-semibold italic tracking-wide text-wood-deep sm:text-3xl">
            Whisker&apos;s World
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-sage-deep">
            <SparkleIcon />
            My Little Room
            <span className="text-ink/30">·</span>
            <ClockBadge />
          </p>
        </div>
        <CatBadge />
        </div>

        <div className="flex items-center gap-2">
        {editing && (
          <div className="paper-card pointer-events-auto flex items-center rounded-full p-1">
            <button
              type="button"
              onClick={roomActions.undo}
              disabled={!canUndo}
              aria-label="復原"
              title="復原 (Ctrl/⌘+Z)"
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-wood-deep transition hover:bg-white/70 disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <UndoIcon />
              復原
            </button>
            <button
              type="button"
              onClick={roomActions.redo}
              disabled={!canRedo}
              aria-label="重做"
              title="重做 (Ctrl/⌘+Shift+Z)"
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-wood-deep transition hover:bg-white/70 disabled:opacity-35 disabled:hover:bg-transparent"
            >
              <UndoIcon flip />
              重做
            </button>
          </div>
        )}
        <button
          type="button"
          aria-pressed={focus === "cat"}
          onClick={roomActions.toggleFocus}
          className="paper-card pointer-events-auto rounded-full px-5 py-2.5 text-sm font-semibold text-wood-deep transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-deep"
        >
          {focus === "cat" ? "回到房間" : "看看小貓"}
        </button>
        <button
          type="button"
          aria-pressed={editing}
          onClick={roomActions.toggleEdit}
          className={`paper-card pointer-events-auto rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-deep ${
            editing ? "!bg-sage text-white" : "text-wood-deep"
          }`}
        >
          {editing ? "完成布置" : "編輯房間"}
        </button>
        </div>
      </header>

      <Toast />
      <SelectionBar />

      <footer className="flex items-end justify-between gap-3">
        <p className="paper-card max-w-[15rem] rounded-2xl px-4 py-2.5 text-xs leading-relaxed text-ink/80 sm:max-w-xs sm:text-sm">
          {editing ? (
            <>
              <span className="font-semibold text-sage-deep">編輯模式</span>{" "}
              拖曳家具移動，點空白處取消選取。
              <span className="mt-1 block text-ink/60">
                靠牆自動貼齊 · R 旋轉 · Ctrl+Z 復原
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold text-mist-deep">瀏覽模式</span>{" "}
              點「編輯房間」開始布置。
              <span className="mt-1 block text-ink/60">
                拖曳旋轉 · 滾輪／雙指縮放
              </span>
            </>
          )}
        </p>

        <div className="flex flex-col items-end gap-3">
          {panelOpen && <DecorPanel />}
          <button
            type="button"
            aria-expanded={panelOpen}
            onClick={roomActions.togglePanel}
            className="paper-card pointer-events-auto inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-wood-deep transition hover:-translate-y-0.5 hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-deep"
          >
            <ChairIcon />
            裝飾
          </button>
        </div>
      </footer>
    </div>
  );
}
