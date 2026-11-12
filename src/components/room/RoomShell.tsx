import { memo, useEffect, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { CanvasTexture } from "three";
import {
  FLOOR_TONES,
  WALL_COLORS,
  type WallMaterialId,
} from "@/game/roomTheme";
import { useSettings } from "@/game/settingsStore";
import { MATTE, palette } from "./palette";
import { makeFloorTexture, makeWallTexture } from "./textures";

/**
 * 房間外殼：地板、後牆（含窗戶開口）、左牆。
 * 房間內部：x ∈ [-3, 3]、z ∈ [-2.5, 2.5]、牆高 3.2，前方與右側開放。
 * 牆面與地板外觀由 settingsStore 驅動。
 */

const WALL_H = 3.2;
const RAIL_Y = 1.1; // 護牆板高度
const WIN = { cx: 1.5, cy: 1.9, w: 1.5, h: 1.1 } as const;
const WIN_L = WIN.cx - WIN.w / 2;
const WIN_R = WIN.cx + WIN.w / 2;
const WIN_B = WIN.cy - WIN.h / 2;
const WIN_T = WIN.cy + WIN.h / 2;
const TILE = 1; // 牆面貼圖每 1m 重複一次

function Matte({ color }: { color: string }) {
  return <meshStandardMaterial color={color} {...MATTE} />;
}

function Floor() {
  const style = useSettings((s) => s.floorStyle);
  const toneIdx = useSettings((s) => s.floorTone);
  const color = FLOOR_TONES[style][toneIdx]?.color ?? FLOOR_TONES[style][0].color;
  const tex = useMemo(() => makeFloorTexture(style, color), [style, color]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[6.4, 0.2, 5.4]} />
        <Matte color="#a07850" />
      </mesh>
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial
          map={tex}
          roughness={style === "stone" ? 0.8 : 1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

interface BlockProps {
  /** 中心座標與尺寸 */
  readonly pos: readonly [number, number, number];
  readonly size: readonly [number, number, number];
  readonly color: string;
  readonly tex: CanvasTexture | null;
  /** 貼圖對齊用：橫向（沿牆）起點與寬度、垂直起點與高度 */
  readonly u: readonly [number, number];
  readonly v: readonly [number, number];
}

/** 牆面區塊：貼圖依世界座標對齊，相鄰區塊的條紋才會接得起來 */
function WallBlock({ pos, size, color, tex, u, v }: BlockProps) {
  const local = useMemo(() => {
    if (!tex) return null;
    const t = tex.clone();
    t.repeat.set(u[1] / TILE, v[1] / TILE);
    t.offset.set(u[0] / TILE, v[0] / TILE);
    t.needsUpdate = true;
    return t;
  }, [tex, u, v]);
  useEffect(() => () => local?.dispose(), [local]);
  return (
    <mesh position={[...pos]} receiveShadow>
      <boxGeometry args={[...size]} />
      {/* map 有無會改變 shader，用 key 強制重建材質 */}
      <meshStandardMaterial key={local ? "map" : "flat"} color={color} map={local} {...MATTE} />
    </mesh>
  );
}

function useWallTexture(material: WallMaterialId) {
  const tex = useMemo(
    () => (material === "paint" ? null : makeWallTexture(material)),
    [material],
  );
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

function Walls() {
  const colorId = useSettings((s) => s.wallColor);
  const material = useSettings((s) => s.wallMaterial);
  const style = useSettings((s) => s.wallStyle);
  const tex = useWallTexture(material);
  const preset = WALL_COLORS.find((c) => c.id === colorId) ?? WALL_COLORS[0];
  const upper = preset.upper;
  const lower = style === "two-tone" ? preset.lower : preset.upper;
  // 壁紙只貼在上半牆；灰泥上下都貼
  const lowerTex = material === "plaster" ? tex : null;
  const z = -2.6;
  const upperH = WALL_H - RAIL_Y;
  const backW = 6.4;
  return (
    <group>
      {/* 後牆 */}
      <WallBlock pos={[0, RAIL_Y / 2, z]} size={[backW, RAIL_Y, 0.2]} color={lower} tex={lowerTex} u={[-3.2, backW]} v={[0, RAIL_Y]} />
      <WallBlock pos={[(-3.2 + WIN_L) / 2, (RAIL_Y + WALL_H) / 2, z]} size={[WIN_L + 3.2, upperH, 0.2]} color={upper} tex={tex} u={[-3.2, WIN_L + 3.2]} v={[RAIL_Y, upperH]} />
      <WallBlock pos={[(WIN_R + 3.2) / 2, (RAIL_Y + WALL_H) / 2, z]} size={[3.2 - WIN_R, upperH, 0.2]} color={upper} tex={tex} u={[WIN_R, 3.2 - WIN_R]} v={[RAIL_Y, upperH]} />
      <WallBlock pos={[WIN.cx, (WIN_T + WALL_H) / 2, z]} size={[WIN.w, WALL_H - WIN_T, 0.2]} color={upper} tex={tex} u={[WIN_L, WIN.w]} v={[WIN_T, WALL_H - WIN_T]} />
      <WallBlock pos={[WIN.cx, (RAIL_Y + WIN_B) / 2, z]} size={[WIN.w, WIN_B - RAIL_Y, 0.2]} color={upper} tex={tex} u={[WIN_L, WIN.w]} v={[RAIL_Y, WIN_B - RAIL_Y]} />
      {/* 左牆 */}
      <WallBlock pos={[-3.1, RAIL_Y / 2, 0]} size={[0.2, RAIL_Y, 5.4]} color={lower} tex={lowerTex} u={[-2.7, 5.4]} v={[0, RAIL_Y]} />
      <WallBlock pos={[-3.1, (RAIL_Y + WALL_H) / 2, 0]} size={[0.2, upperH, 5.4]} color={upper} tex={tex} u={[-2.7, 5.4]} v={[RAIL_Y, upperH]} />
      <Trim showRail={style === "two-tone"} />
    </group>
  );
}

/** 護牆板上緣與踢腳板 */
function Trim({ showRail }: { showRail: boolean }) {
  const c = palette.cream;
  return (
    <group>
      {showRail && (
        <>
          <RoundedBox args={[6.0, 0.07, 0.1]} radius={0.03} position={[0, RAIL_Y, -2.45]} receiveShadow>
            <Matte color={c} />
          </RoundedBox>
          <RoundedBox args={[0.1, 0.07, 5.0]} radius={0.03} position={[-2.95, RAIL_Y, 0]} receiveShadow>
            <Matte color={c} />
          </RoundedBox>
        </>
      )}
      <RoundedBox args={[6.0, 0.14, 0.07]} radius={0.03} position={[0, 0.07, -2.46]} receiveShadow>
        <Matte color={c} />
      </RoundedBox>
      <RoundedBox args={[0.07, 0.14, 5.0]} radius={0.03} position={[-2.96, 0.07, 0]} receiveShadow>
        <Matte color={c} />
      </RoundedBox>
    </group>
  );
}

function WindowAssembly() {
  const frame = palette.cream;
  return (
    <group>
      {/* 窗框 */}
      <RoundedBox
        args={[WIN.w + 0.2, 0.1, 0.3]}
        radius={0.04}
        position={[WIN.cx, WIN_T + 0.05, -2.58]}
        castShadow
        receiveShadow
      >
        <Matte color={frame} />
      </RoundedBox>
      <RoundedBox
        args={[WIN.w + 0.3, 0.1, 0.42]}
        radius={0.045}
        position={[WIN.cx, WIN_B - 0.05, -2.53]}
        castShadow
        receiveShadow
      >
        <Matte color={frame} />
      </RoundedBox>
      {[WIN_L - 0.05, WIN_R + 0.05].map((x) => (
        <RoundedBox
          key={x}
          args={[0.1, WIN.h, 0.3]}
          radius={0.04}
          position={[x, WIN.cy, -2.58]}
          castShadow
          receiveShadow
        >
          <Matte color={frame} />
        </RoundedBox>
      ))}
      {/* 十字窗格 */}
      <RoundedBox
        args={[0.05, WIN.h, 0.08]}
        radius={0.02}
        position={[WIN.cx, WIN.cy, -2.6]}
      >
        <Matte color={frame} />
      </RoundedBox>
      <RoundedBox
        args={[WIN.w, 0.05, 0.08]}
        radius={0.02}
        position={[WIN.cx, WIN.cy, -2.6]}
      >
        <Matte color={frame} />
      </RoundedBox>
      {/* 玻璃（半透明霧藍） */}
      <mesh position={[WIN.cx, WIN.cy, -2.6]}>
        <planeGeometry args={[WIN.w, WIN.h]} />
        <meshBasicMaterial
          color={palette.sky}
          transparent
          opacity={0.45}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {/* 窗外天空與雲朵 */}
      <mesh position={[WIN.cx, WIN.cy, -3.0]}>
        <planeGeometry args={[2.6, 2.0]} />
        <meshBasicMaterial color={palette.sky} toneMapped={false} />
      </mesh>
      {(
        [
          [0.9, 1.95, 0.32],
          [1.2, 1.9, 0.24],
          [2.0, 2.15, 0.28],
        ] as const
      ).map(([x, y, r], i) => (
        <mesh
          key={i}
          position={[x, y, -2.95]}
          scale={[r * 1.8, r, 0.1]}
        >
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
      {/* 窗簾 */}
      {[WIN_L - 0.22, WIN_R + 0.22].map((x) => (
        <RoundedBox
          key={x}
          args={[0.26, 1.55, 0.1]}
          radius={0.05}
          position={[x, 1.95, -2.38]}
          castShadow
        >
          <Matte color={palette.mist} />
        </RoundedBox>
      ))}
    </group>
  );
}

function RoomShellBase() {
  return (
    <group>
      <Floor />
      <Walls />
      <WindowAssembly />
    </group>
  );
}

export const RoomShell = memo(RoomShellBase);
