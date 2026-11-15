import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  type Group,
  type LineBasicMaterial,
  type Mesh,
  type MeshBasicMaterial,
  type PointsMaterial,
} from "three";
import { getEnv, weatherBlend } from "@/game/environmentStore";
import { createLightingState, sampleLighting } from "@/game/lighting";

const WIN_X = 1.5;
const WHITE = new Color("#ffffff");
const X0 = 0.65; // 窗外效果的範圍（會被牆面遮住窗框之外的部分）
const X1 = 2.35;
const Y0 = 1.25;
const Y1 = 2.6;

const BASE_CLOUDS = [
  [0.9, 1.95, 0.32],
  [1.2, 1.9, 0.24],
  [2.0, 2.15, 0.28],
] as const;
/** 多雲 / 下雨時才出現的額外雲層 */
const EXTRA_CLOUDS = [
  [1.5, 2.25, 0.4],
  [1.9, 2.0, 0.34],
  [1.05, 2.3, 0.36],
] as const;

const golden = (i: number, k: number) => (i * k) % 1;
const RAIN_N = 70;
const SNOW_N = 60;
const DROP_N = 14;

interface Sim {
  rx: Float32Array; ry: Float32Array; rz: Float32Array; rs: Float32Array;
  sx: Float32Array; sy: Float32Array; sp: Float32Array;
  dx: Float32Array; dy: Float32Array; ds: Float32Array;
  rainGeo: BufferGeometry; snowGeo: BufferGeometry; dropGeo: BufferGeometry;
}

/** 固定、可重現的初始位置（不使用 Math.random） */
function createSim(): Sim {
    const rx = new Float32Array(RAIN_N), ry = new Float32Array(RAIN_N), rz = new Float32Array(RAIN_N), rs = new Float32Array(RAIN_N);
  for (let i = 0; i < RAIN_N; i++) {
    rx[i] = X0 + golden(i + 1, 0.618034) * (X1 - X0);
    ry[i] = Y0 + golden(i + 1, 0.754878) * (Y1 - Y0);
    rz[i] = -2.9 + golden(i + 1, 0.569841) * 0.22;
    rs[i] = 2.6 + golden(i + 1, 0.381966) * 1.4;
  }
  const sx = new Float32Array(SNOW_N), sy = new Float32Array(SNOW_N), sp = new Float32Array(SNOW_N);
  for (let i = 0; i < SNOW_N; i++) {
    sx[i] = X0 + golden(i + 1, 0.618034) * (X1 - X0);
    sy[i] = Y0 + golden(i + 1, 0.754878) * (Y1 - Y0);
    sp[i] = golden(i + 1, 0.569841) * 6.28;
  }
  const dx = new Float32Array(DROP_N), dy = new Float32Array(DROP_N), ds = new Float32Array(DROP_N);
  for (let i = 0; i < DROP_N; i++) {
    dx[i] = 0.85 + golden(i + 1, 0.618034) * 1.3;
    dy[i] = 1.4 + golden(i + 1, 0.754878) * 1.0;
    ds[i] = 0.05 + golden(i + 1, 0.381966) * 0.1;
  }
  const rainGeo = new BufferGeometry();
  rainGeo.setAttribute("position", new BufferAttribute(new Float32Array(RAIN_N * 6), 3));
  const snowGeo = new BufferGeometry();
  snowGeo.setAttribute("position", new BufferAttribute(new Float32Array(SNOW_N * 3), 3));
  const dropGeo = new BufferGeometry();
  dropGeo.setAttribute("position", new BufferAttribute(new Float32Array(DROP_N * 3), 3));
  return { rx, ry, rz, rs, sx, sy, sp, dx, dy, ds, rainGeo, snowGeo, dropGeo };
}

function stepRain(sim: Sim, delta: number, seed: number) {
  const pos = sim.rainGeo.getAttribute("position") as BufferAttribute;
  for (let i = 0; i < RAIN_N; i++) {
    sim.ry[i] -= sim.rs[i] * delta;
    sim.rx[i] -= 0.4 * delta;
    if (sim.ry[i] < Y0) {
      sim.ry[i] = Y1;
      sim.rx[i] = X0 + golden(i + 1 + seed, 0.618034) * (X1 - X0);
    }
    pos.setXYZ(i * 2, sim.rx[i], sim.ry[i], sim.rz[i]);
    pos.setXYZ(i * 2 + 1, sim.rx[i] + 0.012, sim.ry[i] + 0.14, sim.rz[i]);
  }
  pos.needsUpdate = true;
}

function stepDrops(sim: Sim, delta: number) {
  const pos = sim.dropGeo.getAttribute("position") as BufferAttribute;
  for (let i = 0; i < DROP_N; i++) {
    sim.dy[i] -= sim.ds[i] * delta;
    if (sim.dy[i] < 1.4) sim.dy[i] = 2.4;
    pos.setXYZ(i, sim.dx[i], sim.dy[i], -2.57);
  }
  pos.needsUpdate = true;
}

function stepSnow(sim: Sim, delta: number, t: number) {
  const pos = sim.snowGeo.getAttribute("position") as BufferAttribute;
  for (let i = 0; i < SNOW_N; i++) {
    sim.sy[i] -= (0.3 + (i % 5) * 0.04) * delta;
    if (sim.sy[i] < Y0) sim.sy[i] = Y1;
    pos.setXYZ(i, sim.sx[i] + Math.sin(t * 1.2 + sim.sp[i]) * 0.06, sim.sy[i], -2.88 + (i % 4) * 0.05);
  }
  pos.needsUpdate = true;
}

/** 窗外景色：天空、日月、星星、雲，以及天氣效果（雨絲、雪花、玻璃水珠、積雪）。全部只出現在窗外。 */
export function WindowView() {
  const invalidate = useThree((s) => s.invalidate);
  const sky = useRef<MeshBasicMaterial>(null);
  const sunRef = useRef<Mesh>(null);
  const moonRef = useRef<Mesh>(null);
  const stars = useRef<PointsMaterial>(null);
  const clouds = useRef<Group>(null);
  const rainMat = useRef<LineBasicMaterial>(null);
  const snowMat = useRef<PointsMaterial>(null);
  const dropMat = useRef<PointsMaterial>(null);
  const groundMat = useRef<MeshBasicMaterial>(null);
  const timer = useRef(0);
  const state = useMemo(() => createLightingState(), []);
  const cloudColor = useMemo(() => new Color(), []);

  const sim = useMemo(() => createSim(), []);
  useEffect(
    () => () => {
      sim.rainGeo.dispose();
      sim.snowGeo.dispose();
      sim.dropGeo.dispose();
      window.clearTimeout(timer.current);
    },
    [sim],
  );

  const starGeo = useMemo(() => {
    const g = new BufferGeometry();
    const pos: number[] = [];
    for (let i = 0; i < 36; i++) pos.push(WIN_X - 1.2 + golden(i, 0.618034) * 2.4, 1.3 + golden(i, 0.754878) * 1.3, -2.98);
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  useEffect(() => () => starGeo.dispose(), [starGeo]);

  useFrame((_, delta) => {
    sampleLighting(getEnv().hour, state, weatherBlend);
    const b = weatherBlend;
    sky.current?.color.copy(state.sky);
    const lum = state.sky.r * 0.3 + state.sky.g * 0.59 + state.sky.b * 0.11;
    if (stars.current) stars.current.opacity = Math.min(Math.max((0.35 - lum) * 4, 0), 1) * (1 - b.cloud * 0.8);

    const x = WIN_X + 0.9 * (1 - 2 * state.arc);
    if (sunRef.current) {
      sunRef.current.visible = state.isDay && b.cloud < 0.9;
      sunRef.current.position.set(x, 1.4 + 1.0 * state.elevation, -2.97);
    }
    if (moonRef.current) {
      moonRef.current.visible = !state.isDay && b.cloud < 0.9;
      moonRef.current.position.set(x, 1.5 + 0.8 * state.elevation, -2.97);
    }
    cloudColor.copy(WHITE).lerp(state.sky, 0.55);
    clouds.current?.children.forEach((c, i) => {
      const m = (c as Mesh).material as MeshBasicMaterial;
      m.color.copy(cloudColor);
      m.opacity = i < BASE_CLOUDS.length ? 0.55 + 0.45 * (1 - b.cloud * 0.3) : b.cloud;
      c.visible = i < BASE_CLOUDS.length || b.cloud > 0.02;
    });

    // ---- 雨絲：只在窗外（z < 窗玻璃）----
    const raining = b.rain > 0.01;
    if (rainMat.current) rainMat.current.opacity = 0.6 * b.rain;
    if (raining) stepRain(sim, delta, Math.floor(performance.now() / 700));
    // ---- 玻璃上的水珠 ----
    if (dropMat.current) dropMat.current.opacity = 0.75 * b.rain;
    if (raining) stepDrops(sim, delta);
    // ---- 雪花 ----
    const snowing = b.snow > 0.01;
    if (snowMat.current) snowMat.current.opacity = 0.9 * b.snow;
    if (snowing) stepSnow(sim, delta, performance.now() / 1000);
    if (groundMat.current) groundMat.current.opacity = b.snow;

    // 雨 / 雪需要持續動畫：以約 30fps 請求下一幀（frameloop="demand"）
    if (raining || snowing) {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(invalidate, 33);
    }
  });

  return (
    <group>
      <mesh position={[WIN_X, 1.9, -3.0]}>
        <planeGeometry args={[2.6, 2.0]} />
        <meshBasicMaterial ref={sky} toneMapped={false} />
      </mesh>
      <points geometry={starGeo}>
        <pointsMaterial ref={stars} color="#fffbe8" size={0.025} sizeAttenuation transparent opacity={0} toneMapped={false} depthWrite={false} />
      </points>
      <mesh ref={sunRef} scale={[0.16, 0.16, 0.02]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshBasicMaterial color="#fff3bf" toneMapped={false} />
      </mesh>
      <mesh ref={moonRef} scale={[0.12, 0.12, 0.02]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshBasicMaterial color="#f6f2dc" toneMapped={false} />
      </mesh>
      <group ref={clouds}>
        {[...BASE_CLOUDS, ...EXTRA_CLOUDS].map(([x, y, r], i) => (
          <mesh key={i} position={[x, y, -2.95 + (i >= BASE_CLOUDS.length ? 0.01 : 0)]} scale={[r * 1.8, r, 0.1]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color="#ffffff" transparent toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* 窗外積雪 */}
      <mesh position={[WIN_X, 1.4, -2.9]}>
        <planeGeometry args={[2.6, 0.22]} />
        <meshBasicMaterial ref={groundMat} color="#f4f8fc" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
      <lineSegments geometry={sim.rainGeo} frustumCulled={false}>
        <lineBasicMaterial ref={rainMat} color="#d6e8fa" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </lineSegments>
      <points geometry={sim.snowGeo} frustumCulled={false}>
        <pointsMaterial ref={snowMat} color="#ffffff" size={0.035} sizeAttenuation transparent opacity={0} toneMapped={false} depthWrite={false} />
      </points>
      <points geometry={sim.dropGeo} frustumCulled={false}>
        <pointsMaterial ref={dropMat} color="#eaf5ff" size={0.03} sizeAttenuation transparent opacity={0} toneMapped={false} depthWrite={false} />
      </points>
    </group>
  );
}
