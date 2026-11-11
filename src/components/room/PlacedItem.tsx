import { memo } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Plane, Vector3 } from "three";
import { FURNITURE_CATALOG } from "@/game/furnitureCatalog";
import type { PlacedItemData } from "@/game/layout";
import { roomActions, useRoomStore } from "@/game/roomStore";
import { FURNITURE_MODELS } from "./furniture";
import { palette } from "./palette";

const GROUND = new Plane(new Vector3(0, 1, 0), 0);
const hit = new Vector3();
const noRaycast = () => null;

function setControlsEnabled(controls: unknown, enabled: boolean) {
  if (typeof controls === "object" && controls !== null && "enabled" in controls) {
    controls.enabled = enabled;
  }
}

interface Props {
  readonly item: PlacedItemData;
}

function PlacedItemBase({ item }: Props) {
  const editing = useRoomStore((s) => s.mode === "edit");
  const selected = useRoomStore((s) => s.selectedId === item.id);
  const draft = useRoomStore((s) => (s.draft?.id === item.id ? s.draft : null));
  const get = useThree((s) => s.get);

  const def = FURNITURE_CATALOG[item.type];
  const Model = FURNITURE_MODELS[item.type];
  const x = draft ? draft.x : item.x;
  const z = draft ? draft.z : item.z;
  const rot = draft ? draft.rot : item.rot;
  const invalid = draft !== null && !draft.valid;

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // 原生事件仍會傳到 OrbitControls，必須同步停用
    setControlsEnabled(get().controls, false);
    if (!e.ray.intersectPlane(GROUND, hit)) {
      setControlsEnabled(get().controls, true);
      return;
    }
    roomActions.startDrag(item.id, hit.x, hit.z);
    window.addEventListener("pointerup", roomActions.endDrag, { once: true });
  };

  return (
    <group
      position={[x, draft ? 0.12 : 0, z]}
      rotation={[0, (rot * Math.PI) / 2, 0]}
      onPointerDown={editing ? onPointerDown : undefined}
      onClick={editing ? (e) => e.stopPropagation() : undefined}
      onPointerOver={
        editing
          ? (e) => {
              e.stopPropagation();
              get().gl.domElement.style.cursor = "grab";
            }
          : undefined
      }
      onPointerOut={
        editing
          ? () => {
              get().gl.domElement.style.cursor = "";
            }
          : undefined
      }
    >
      <Model />
      {editing && (selected || draft) && (
        <RoundedBox
          args={[def.w + 0.14, 0.01, def.d + 0.14]}
          radius={0.005}
          position={[0, draft ? -0.05 : 0.07, 0]}
          raycast={noRaycast}
          renderOrder={10}
        >
          <meshBasicMaterial
            color={invalid ? "#d98b7c" : palette.sageDeep}
            transparent
            opacity={0.5}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </RoundedBox>
      )}
    </group>
  );
}

export const PlacedItem = memo(PlacedItemBase);
