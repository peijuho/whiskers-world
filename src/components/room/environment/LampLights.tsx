import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { PointLight } from "three";
import type { FurnitureType } from "@/game/furnitureCatalog";
import { getEnv, lampLevel } from "@/game/environmentStore";
import { autoLampAt } from "@/game/lighting";
import { useRoomStore } from "@/game/roomStore";

/** 各家具上燈泡的本地座標（未旋轉時） */
const LAMP_OFFSET: Partial<Record<FurnitureType, readonly [number, number, number]>> = {
  nightstand: [0, 0.72, 0],
  desk: [0.6, 1.2, -0.15],
  "floor-lamp": [0, 1.45, 0],
};
const POOL = 3;
const PARKED: [number, number, number] = [0, 6, 0];

/** 固定 3 盞暖色點光源，依序分配給場景中的檯燈／床頭櫃／落地燈。 */
export function LampLights() {
  const items = useRoomStore((s) => s.items);
  const refs = useRef<(PointLight | null)[]>([]);

  const sources = useMemo(() => {
    const out: [number, number, number][] = [];
    for (const it of items) {
      const o = LAMP_OFFSET[it.type];
      if (!o || out.length >= POOL) continue;
      const a = (it.rot * Math.PI) / 2;
      out.push([
        it.x + o[0] * Math.cos(a) + o[2] * Math.sin(a),
        o[1],
        it.z - o[0] * Math.sin(a) + o[2] * Math.cos(a),
      ]);
    }
    return out;
  }, [items]);

  useFrame(() => {
    const env = getEnv();
    const level = lampLevel(autoLampAt(env.hour), env.lampMode);
    refs.current.forEach((l, i) => {
      if (l) l.intensity = i < sources.length ? level * 3.2 : 0;
    });
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <pointLight
          key={i}
          ref={(l) => {
            refs.current[i] = l;
          }}
          position={sources[i] ?? PARKED}
          color="#ffcf8a"
          distance={4.5}
          decay={2}
          intensity={0}
        />
      ))}
    </>
  );
}
