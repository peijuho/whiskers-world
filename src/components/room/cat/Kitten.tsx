import { memo, useMemo, type ReactNode } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { BufferGeometry, CatmullRomCurve3, LatheGeometry, SphereGeometry, SplineCurve, TubeGeometry, Vector2, Vector3 } from "three";
import { FUR_BLUE, FUR_WHITE, bodyWhite, headWhite, legWhite, paintBicolor } from "./paint";

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

/** 平面的眼睛：一層層疊起來的扁圓片（像繪本貼紙），不是立體球 */
function EyeDisc({ rx, ry, z, x = 0, y = 0, color, glow = 0.35 }: { rx: number; ry: number; z: number; x?: number; y?: number; color: string; glow?: number }) {
  return (
    <mesh position={[x, y, z]} scale={[rx, ry, 1]}>
      <circleGeometry args={[1, 36]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} roughness={0.7} polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  );
}

function Eye({ side }: { side: 1 | -1 }) {
  const pos = headSurface(side * 0.42, 0.02, 0.87, 1.0);
  return (
    <group name={side === 1 ? "eyeR" : "eyeL"} position={pos} rotation={[-0.04, side * 0.5, 0]}>
      <EyeDisc rx={0.05} ry={0.058} z={0.008} color={IRIS_OUTER} />
      <EyeDisc rx={0.04} ry={0.047} y={-0.003} z={0.0095} color={IRIS_INNER} />
      <EyeDisc rx={0.022} ry={0.032} y={0.0} z={0.011} color="#0b1020" glow={0} />
      <EyeDisc rx={0.011} ry={0.011} x={-0.015} y={0.02} z={0.0125} color="#ffffff" glow={1} />
      <EyeDisc rx={0.0055} ry={0.0055} x={0.016} y={-0.017} z={0.0125} color="#ffffff" glow={1} />
    </group>
  );
}

/** 尖耳朵輪廓（旋轉後壓扁）：整體是尖的，但頂端倒成小圓角 */
function earGeometry(): BufferGeometry {
  const pts = [
    new Vector2(0.0, 0.1),
    new Vector2(0.01, 0.098),
    new Vector2(0.02, 0.09),
    new Vector2(0.03, 0.074),
    new Vector2(0.045, 0.042),
    new Vector2(0.062, 0.0),
    new Vector2(0.074, -0.04),
    new Vector2(0.0, -0.05),
  ];
  return new LatheGeometry(pts, 24);
}

function Ear({ side }: { side: 1 | -1 }) {
  const pos = headSurface(side * 0.6, 0.82, -0.02, 0.98);
  const geo = useMemo(() => earGeometry(), []);
  return (
    <group name={side === 1 ? "earR" : "earL"} position={pos} rotation={[-0.1, side * 0.25, -side * 0.45]}>
      <mesh geometry={geo} scale={[1.2, 1.15, 0.62]} castShadow>
        <Fur color={FUR_BLUE} />
      </mesh>
      <mesh geometry={geo} position={[0, -0.012, 0.018]} scale={[0.66, 0.7, 0.44]}>
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

/** 四條腿共用的輪廓（前腿與後腿粗細取平均）：大腿微粗 → 細腳踝，座標為腿節點本地 */
function legGeometry(): BufferGeometry {
  const curve = new SplineCurve([
    new Vector2(0.0, 0.1),
    new Vector2(0.06, 0.085),
    new Vector2(0.082, 0.03),
    new Vector2(0.075, -0.03),
    new Vector2(0.06, -0.09),
    new Vector2(0.052, -0.14),
    new Vector2(0.05, -0.17),
    new Vector2(0.0, -0.185),
  ]);
  return paintBicolor(new LatheGeometry(curve.getPoints(28), 20), legWhite);
}

function Leg({ name, position }: LegProps) {
  const geo = useMemo(() => legGeometry(), []);
  return (
    <group name={name} position={position}>
      <mesh geometry={geo} position={[0, -0.02, 0]} scale={[0.92, 1, 1.1]} castShadow>
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

/** r：該節根部半徑；尾巴由粗漸細，最後一節收成圓圓的尾尖 */
const TAIL_SEGMENTS = [
  { r: 0.068, rot: -1.15 },
  { r: 0.064, rot: 0.42 },
  { r: 0.059, rot: 0.42 },
  { r: 0.053, rot: 0.42 },
] as const;
const TAIL_TIP_R = 0.046;
const TAIL_LEN = 0.1;

/** 蓬鬆的藍灰色尾巴：四節巢狀關節（動畫用），每節是連續漸細的圓錐，接頭用同半徑球體抹平 */
function Tail({ index = 0 }: { index?: number }): ReactNode {
  const seg = TAIL_SEGMENTS[index];
  if (!seg) return null;
  const next = TAIL_SEGMENTS[index + 1]?.r ?? TAIL_TIP_R;
  return (
    <group name={`tail${index + 1}`} position={index === 0 ? [0, 0.3, -0.25] : [0, TAIL_LEN, 0]} rotation={[seg.rot, 0, 0]}>
      <mesh position={[0, TAIL_LEN / 2, 0]} castShadow>
        <cylinderGeometry args={[next, seg.r, TAIL_LEN, 20, 1]} />
        <Fur color={FUR_BLUE} />
      </mesh>
      {/* 關節球：半徑與該節根部相同，彎曲處不會冒出一圈 */}
      <mesh castShadow>
        <sphereGeometry args={[seg.r, 20, 14]} />
        <Fur color={FUR_BLUE} />
      </mesh>
      {index === TAIL_SEGMENTS.length - 1 && (
        <mesh position={[0, TAIL_LEN, 0]} castShadow>
          <sphereGeometry args={[TAIL_TIP_R, 20, 14]} />
          <Fur color={FUR_BLUE} />
        </mesh>
      )}
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
      const t = (i / n) * Math.PI * 2;
      const c = Math.cos(t);
      // 圍在脖子上：胸前最低（z 大），後頸最高，左右略寬於身體
      points.push(new Vector3(Math.sin(t) * 0.17, 0.37 - c * 0.07, 0.158 + c * 0.107));
    }
    return new TubeGeometry(new CatmullRomCurve3(points, true), 64, 0.014, 10, true);
  }, []);
  return (
    <group name="collar">
      <mesh geometry={geo} castShadow>
        <Matte color={COLLAR} />
      </mesh>
      <group name="bell" position={[0, 0.286, 0.282]}>
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
  
  return (
    <group name="kitten" {...props}>
      <group name="spine">
        <mesh name="body" geometry={bodyGeo} position={[0, 0.27, 0]} scale={[0.19, 0.18, 0.27]} castShadow receiveShadow>
          <Fur painted />
        </mesh>

        <Leg name="legFR" position={[0.1, 0.2, 0.15]} />
        <Leg name="legFL" position={[-0.1, 0.2, 0.15]} />
        <Leg name="legBR" position={[0.103, 0.2, -0.14]} />
        <Leg name="legBL" position={[-0.103, 0.2, -0.14]} />

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
