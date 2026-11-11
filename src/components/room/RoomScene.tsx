import { memo } from "react";
import { useRoomStore } from "@/game/roomStore";
import { DragController } from "./DragController";
import { Kitten } from "./cat/Kitten";
import { PlacedItem } from "./PlacedItem";
import { RoomShell } from "./RoomShell";

/** 場景內容與燈光：柔和環境光 + 暖色日光 + 窗邊暖光。 */
function RoomSceneBase() {
  const items = useRoomStore((s) => s.items);
  const hydrated = useRoomStore((s) => s.hydrated);
  return (
    <>
      <ambientLight intensity={0.7} color="#fff4e2" />
      <hemisphereLight args={["#dcebf2", "#c9a27a", 0.55]} />
      <directionalLight
        position={[4.5, 7, 5.5]}
        intensity={2.1}
        color="#fff0d4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={5}
      />
      {/* 窗邊透進來的暖光 */}
      <pointLight
        position={[1.5, 2.2, -1.6]}
        intensity={4}
        distance={6}
        decay={2}
        color="#ffe2b0"
      />
      <RoomShell />
      {hydrated &&
        items.map((item) => <PlacedItem key={item.id} item={item} />)}
      <Kitten position={[0.6, 0.035, 0.9]} rotation={[0, 0.6, 0]} />
      <DragController />
    </>
  );
}

export const RoomScene = memo(RoomSceneBase);
