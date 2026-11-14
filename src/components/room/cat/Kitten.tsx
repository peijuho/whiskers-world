import { memo, useMemo, type ReactNode } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { CapsuleGeometry, CatmullRomCurve3, SphereGeometry, TubeGeometry, Vector3 } from "three";
import { FUR_BLUE, FUR_WHITE, bodyWhite, haunchWhite, headWhite, legWhite, paintBicolor } from "./paint";

/**
 * 藍白雙色英國短毛貓幼貓（程序化 3D 模型，無外部資源）。
 * - 面數低：球體 32×20、膠囊 6×12，適合遊戲使用。
 * - 骨架友善：所有關節都是命名的巢狀 group（spine / head / ear / leg / tail1-4），
 *   之後可直接對這些節點做旋轉動畫或換成真正的 skeleton。
 * - 朝向 +z，站姿中立，原點在兩腳之間的地面。
 */

const HEAD_R = [0.215, 0.19, 0.19] as const;

/** 設計圖配色：粉紅的耳朵與鼻子、藍色項圈、金色鈴鐺、藍色眼睛 */
const PINK = "#f2a9b8";
const MOUTH = "#b9707c";
const COLLAR = "#5f93cc";
const BELL = "#e8b53f";
const IRIS_OUTER = "#3566a8";
const IRIS_INNER = "#6fb0ea";

/** 單位球上的方向 → 頭部橢球表面座標 */
function headSurface(ux: number, uy: number, uz: number, inset = 1): [number, number, number] {
  const l = Math.hypot(ux, uy, uz);
  return [(ux / l) * HEAD_R[0] * inset, (uy / l) * HEAD_R[1] * inset, (uz / l) * HEAD_R[2] * inset];
}

/** 絨毛質感：霧面 + sheen，像天鵝絨 */
function Fur({ color, painted = false }: { color?: string; painted?: boolean }) {
  return (
    <meshPhysicalMaterial
      color={painted ? "#ffffff" : color}
      vertexColors={painted}
      roughness={1}
      metalness={0}
      sheen={0.6}
      sheenRoughness={0.9}
      sheenColor="#dbe7f7"
    />
  );
}

function Matte({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={0.95} metalness={0} />;
}

function Eye({ side }: { side: 1 | -1 }) {
  const pos = headSurface(side * 0.56, 0.02, 0.83, 0.97);
  return (
    <group name={side === 1 ? "eyeR" : "eyeL"} position={pos} rotation={[-0.04, side * 0.5, 0]}>
      {/* 深藍虹膜外圈 */}
      <mesh scale={[1, 1.12, 0.5]}>
        <sphereGeometry args={[0.07, 28, 18]} />
        <meshStandardMaterial color={IRIS_OUTER} roughness={0.3} />
      </mesh>
      {/* 亮藍虹膜內圈 */}
      <mesh position={[0, -0.006, 0.012]} scale={[1, 1.1, 0.5]}>
        <sphereGeometry args={[0.057, 24, 16]} />
        <meshStandardMaterial color={IRIS_INNER} roughness={0.28} />
      </mesh>
      {/* 瞳孔 */}
      <mesh position={[0, 0.002, 0.024]} scale={[0.95, 1.15, 0.55]}>
        <sphereGeometry args={[0.033, 20, 14]} />
        <meshStandardMaterial color="#0b1020" roughness={0.3} />
      </mesh>
      {/* 閃亮的高光 */}
      <mesh position={[-0.021, 0.028, 0.046]}>
        <sphereGeometry args={[0.016, 14, 10]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0.022, -0.024, 0.042]}>
        <sphereGeometry args={[0.008, 10, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Ear({ side }: { side: 1 | -1 }) {
  const pos = headSurface(side * 0.6, 0.82, -0.02, 0.98);
  return (
    <group name={side === 1 ? "earR" : "earL"} position={pos} rotation={[-0.1, side * 0.25, -side * 0.45]}>
      <mesh scale={[0.075, 0.088, 0.042]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <Fur color={FUR_BLUE} />
      </mesh>
      <mesh position={[0, -0.004, 0.026]} scale={[0.046, 0.056, 0.02]}>
        <sphereGeometry args={[1, 16, 10]} />
        <Matte color={PINK} />
      </mesh>
    </group>
  );
}

function Whiskers({ side }: { side: 1 | -1 }) {
  const base = headSurface(side * 0.22, -0.3, 0.9, 0.98);
  return (
    <group position={base}>
      {[-0.28, 0, 0.28].map((tilt) => (
        <group key={tilt} rotation={[0, 0, side * tilt]}>
          <mesh position={[side * 0.06, 0, 0.0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.0022, 0.0012, 0.12, 5]} />
            <meshStandardMaterial color={FUR_WHITE} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Face() {
  const nose = headSurface(0, -0.2, 0.985);
  const mouthY = nose[1] - 0.038;
  const mouthZ = headSurface(0, -0.45, 0.9)[2] + 0.004;
  return (
    <group name="face">
      <Eye side={1} />
      <Eye side={-1} />
      {/* 圓潤的白色口鼻墊 */}
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={headSurface(s * 0.2, -0.3, 0.9, 0.96)} scale={[1, 0.82, 0.85]} castShadow>
          <sphereGeometry args={[0.062, 20, 14]} />
          <Fur color={FUR_WHITE} />
        </mesh>
      ))}
      {/* 粉灰色小鼻子 */}
      <mesh position={nose} scale={[1.25, 0.85, 0.8]}>
        <sphereGeometry args={[0.022, 14, 10]} />
        <Matte color={PINK} />
      </mesh>
      {/* 甜甜的小嘴 */}
      <mesh position={[0, nose[1] - 0.02, nose[2] - 0.004]}>
        <cylinderGeometry args={[0.0035, 0.0035, 0.024, 6]} />
        <Matte color={MOUTH} />
      </mesh>
      {([1, -1] as const).map((s) => (
        <mesh key={s} position={[s * 0.026, mouthY, mouthZ]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.026, 0.0035, 6, 14, Math.PI]} />
          <Matte color={MOUTH} />
        </mesh>
      ))}
      <Whiskers side={1} />
      <Whiskers side={-1} />
    </group>
  );
}

interface LegProps {
  readonly name: string;
  readonly position: [number, number, number];
}

function Leg({ name, position }: LegProps) {
  const geo = useMemo(() => paintBicolor(new CapsuleGeometry(0.05, 0.1, 4, 12), legWhite), []);
  return (
    <group name={name} position={position}>
      <mesh geometry={geo} position={[0, -0.075, 0]} castShadow>
        <Fur painted />
      </mesh>
      {/* 圓滾滾的白色小腳掌 */}
      <mesh name={`${name}Paw`} position={[0, -0.165, 0.012]} scale={[1.05, 0.62, 1.2]} castShadow receiveShadow>
        <sphereGeometry args={[0.058, 20, 14]} />
        <Fur color={FUR_WHITE} />
      </mesh>
    </group>
  );
}

const TAIL_SEGMENTS = [
  { r: 0.068, rot: -1.15 },
  { r: 0.067, rot: 0.5 },
  { r: 0.065, rot: 0.5 },
  { r: 0.06, rot: 0.5 },
] as const;
const TAIL_LEN = 0.1;

/** 粗厚蓬鬆的藍灰色尾巴：四節巢狀關節，自然向上彎 */
function Tail({ index = 0 }: { index?: number }): ReactNode {
  const seg = TAIL_SEGMENTS[index];
  if (!seg) return null;
  return (
    <group name={`tail${index + 1}`} position={index === 0 ? [0, 0.3, -0.25] : [0, TAIL_LEN, 0]} rotation={[seg.rot, 0, 0]}>
      <mesh position={[0, TAIL_LEN / 2, 0]} castShadow>
        <capsuleGeometry args={[seg.r, TAIL_LEN, 4, 12]} />
        <Fur color={FUR_BLUE} />
      </mesh>
      {/* 關節處的圓球，讓尾巴彎曲處保持平滑 */}
      <mesh castShadow>
        <sphereGeometry args={[seg.r * 1.02, 16, 12]} />
        <Fur color={FUR_BLUE} />
      </mesh>
      <Tail index={index + 1} />
    </group>
  );
}

/** 藍色項圈與金色鈴鐺：項圈是一圈貼著胸口的橢圓管，前低後高 */
function Collar() {
  const geo = useMemo(() => {
    const n = 20;
    const points: Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const z = Math.cos(a) * 0.262;
      const x = Math.sin(a) * 0.182;
      points.push(new Vector3(x, 0.335 - 0.016 * (z / 0.262), z));
    }
    return new TubeGeometry(new CatmullRomCurve3(points, true), 64, 0.014, 10, true);
  }, []);
  return (
    <group name="collar">
      <mesh geometry={geo} castShadow>
        <Matte color={COLLAR} />
      </mesh>
      <group name="bell" position={[0, 0.294, 0.274]}>
        <mesh castShadow>
          <sphereGeometry args={[0.025, 20, 14]} />
          <meshStandardMaterial color={BELL} roughness={0.35} metalness={0.5} />
        </mesh>
        {/* 鈴鐺下方的小細縫 */}
        <mesh position={[0, -0.006, 0.022]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.002, 0.002, 0.03, 6]} />
          <Matte color="#3a2a1a" />
        </mesh>
      </group>
    </group>
  );
}

function KittenBase(props: ThreeElements["group"]) {
  const headGeo = useMemo(() => paintBicolor(new SphereGeometry(1, 40, 28), headWhite), []);
  const bodyGeo = useMemo(() => paintBicolor(new SphereGeometry(1, 36, 24), bodyWhite), []);
  const haunchGeo = useMemo(() => paintBicolor(new SphereGeometry(1, 24, 16), haunchWhite), []);

  return (
    <group name="kitten" {...props}>
      <group name="spine">
        <mesh name="body" geometry={bodyGeo} position={[0, 0.27, 0]} scale={[0.19, 0.18, 0.27]} castShadow receiveShadow>
          <Fur painted />
        </mesh>
        {([1, -1] as const).map((s) => (
          <mesh key={s} name="haunch" geometry={haunchGeo} position={[s * 0.15, 0.22, -0.13]} scale={[0.1, 0.11, 0.12]} castShadow>
            <Fur painted />
          </mesh>
        ))}

        <Leg name="legFR" position={[0.1, 0.2, 0.15]} />
        <Leg name="legFL" position={[-0.1, 0.2, 0.15]} />
        <Leg name="legBR" position={[0.13, 0.2, -0.15]} />
        <Leg name="legBL" position={[-0.13, 0.2, -0.15]} />

        <Tail />
        <Collar />

        <group name="head" position={[0, 0.5, 0.17]}>
          <mesh geometry={headGeo} scale={[...HEAD_R]} castShadow receiveShadow>
            <Fur painted />
          </mesh>
          <Ear side={1} />
          <Ear side={-1} />
          <Face />
        </group>
      </group>
    </group>
  );
}

export const Kitten = memo(KittenBase);
