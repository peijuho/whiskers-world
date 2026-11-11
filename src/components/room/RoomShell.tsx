import { memo } from "react";
import { RoundedBox } from "@react-three/drei";
import { MATTE, palette } from "./palette";

/**
 * 房間外殼：地板、後牆（含窗戶開口）、左牆。
 * 房間內部：x ∈ [-3, 3]、z ∈ [-2.5, 2.5]、牆高 3.2，前方與右側開放。
 */

const WALL_H = 3.2;
const RAIL_Y = 1.1; // 鼠尾草綠護牆板高度
const WIN = { cx: 1.5, cy: 1.9, w: 1.5, h: 1.1 } as const;
const WIN_L = WIN.cx - WIN.w / 2;
const WIN_R = WIN.cx + WIN.w / 2;
const WIN_B = WIN.cy - WIN.h / 2;
const WIN_T = WIN.cy + WIN.h / 2;

const PLANK_TONES = [
  palette.wood,
  "#c19a70",
  palette.woodLight,
  "#bb9268",
] as const;

function Matte({ color }: { color: string }) {
  return <meshStandardMaterial color={color} {...MATTE} />;
}

function Floor() {
  return (
    <group>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[6.4, 0.2, 5.4]} />
        <Matte color={palette.woodDeep} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          position={[0, 0.01, -2.25 + i * 0.5]}
          receiveShadow
        >
          <boxGeometry args={[6, 0.02, 0.48]} />
          <Matte color={PLANK_TONES[i % PLANK_TONES.length]} />
        </mesh>
      ))}
    </group>
  );
}

function BackWall() {
  const z = -2.6;
  return (
    <group>
      {/* 下半：鼠尾草綠 */}
      <mesh position={[0, RAIL_Y / 2, z]} receiveShadow>
        <boxGeometry args={[6.4, RAIL_Y, 0.2]} />
        <Matte color={palette.sage} />
      </mesh>
      {/* 上半：奶油白，圍繞窗戶開口分成四塊 */}
      <mesh
        position={[(-3.2 + WIN_L) / 2, (RAIL_Y + WALL_H) / 2, z]}
        receiveShadow
      >
        <boxGeometry args={[WIN_L + 3.2, WALL_H - RAIL_Y, 0.2]} />
        <Matte color={palette.cream} />
      </mesh>
      <mesh
        position={[(WIN_R + 3.2) / 2, (RAIL_Y + WALL_H) / 2, z]}
        receiveShadow
      >
        <boxGeometry args={[3.2 - WIN_R, WALL_H - RAIL_Y, 0.2]} />
        <Matte color={palette.cream} />
      </mesh>
      <mesh position={[WIN.cx, (WIN_T + WALL_H) / 2, z]} receiveShadow>
        <boxGeometry args={[WIN.w, WALL_H - WIN_T, 0.2]} />
        <Matte color={palette.cream} />
      </mesh>
      <mesh position={[WIN.cx, (RAIL_Y + WIN_B) / 2, z]} receiveShadow>
        <boxGeometry args={[WIN.w, WIN_B - RAIL_Y, 0.2]} />
        <Matte color={palette.cream} />
      </mesh>
    </group>
  );
}

function LeftWall() {
  const x = -3.1;
  return (
    <group>
      <mesh position={[x, RAIL_Y / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, RAIL_Y, 5.4]} />
        <Matte color={palette.sage} />
      </mesh>
      <mesh position={[x, (RAIL_Y + WALL_H) / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, WALL_H - RAIL_Y, 5.4]} />
        <Matte color={palette.cream} />
      </mesh>
    </group>
  );
}

/** 護牆板上緣與踢腳板，讓牆面更有手作繪本的層次 */
function Trim() {
  return (
    <group>
      {/* 後牆 */}
      <RoundedBox
        args={[6.0, 0.07, 0.1]}
        radius={0.03}
        position={[0, RAIL_Y, -2.45]}
        receiveShadow
      >
        <Matte color={palette.cream} />
      </RoundedBox>
      <RoundedBox
        args={[6.0, 0.14, 0.07]}
        radius={0.03}
        position={[0, 0.07, -2.46]}
        receiveShadow
      >
        <Matte color={palette.cream} />
      </RoundedBox>
      {/* 左牆 */}
      <RoundedBox
        args={[0.1, 0.07, 5.0]}
        radius={0.03}
        position={[-2.95, RAIL_Y, 0]}
        receiveShadow
      >
        <Matte color={palette.cream} />
      </RoundedBox>
      <RoundedBox
        args={[0.07, 0.14, 5.0]}
        radius={0.03}
        position={[-2.96, 0.07, 0]}
        receiveShadow
      >
        <Matte color={palette.cream} />
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
      <BackWall />
      <LeftWall />
      <Trim />
      <WindowAssembly />
    </group>
  );
}

export const RoomShell = memo(RoomShellBase);
