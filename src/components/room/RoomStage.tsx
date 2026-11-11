"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { roomActions } from "@/game/roomStore";

/** 3D Canvas 只在瀏覽器端載入，避免 SSR / hydration 問題。 */
const RoomCanvas = dynamic(() => import("./RoomCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <p className="font-storybook text-lg italic text-wood-deep/80">
        Tidying up the room…
      </p>
    </div>
  ),
});

export function RoomStage() {
  useEffect(() => {
    roomActions.hydrate(); // 載入 localStorage 存檔（僅瀏覽器端）
  }, []);

  return (
    <div className="absolute inset-0 touch-none">
      <RoomCanvas />
    </div>
  );
}
