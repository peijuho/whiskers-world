import { memo } from "react";
import { useRoomStore } from "@/game/roomStore";
import { DragController } from "./DragController";
import { CatController } from "./cat/CatController";
import { PlacedItem } from "./PlacedItem";
import { RoomShell } from "./RoomShell";
import { DynamicLighting } from "./environment/DynamicLighting";
import { EnvironmentTicker } from "./environment/EnvironmentTicker";
import { LampLights } from "./environment/LampLights";
import { SunPatch } from "./environment/SunPatch";

/** 場景內容；燈光由 DynamicLighting 依遊戲時間控制。 */
function RoomSceneBase() {
  const items = useRoomStore((s) => s.items);
  const hydrated = useRoomStore((s) => s.hydrated);
  return (
    <>
      <EnvironmentTicker />
      <DynamicLighting />
      <LampLights />
      <SunPatch />
      <RoomShell />
      {hydrated &&
        items.map((item) => <PlacedItem key={item.id} item={item} />)}
      <CatController />
      <DragController />
    </>
  );
}

export const RoomScene = memo(RoomSceneBase);
