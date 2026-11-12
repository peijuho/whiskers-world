import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Float32BufferAttribute, BufferGeometry, type Group, type Mesh, type MeshBasicMaterial, type PointsMaterial } from "three";
import { getEnv } from "@/game/environmentStore";
import { createLightingState, sampleLighting } from "@/game/lighting";

const WIN_X = 1.5;
const WHITE = new Color("#ffffff");
const CLOUDS = [
  [0.9, 1.95, 0.32],
  [1.2, 1.9, 0.24],
  [2.0, 2.15, 0.28],
] as const;

/** 窗外景色：天空顏色、太陽 / 月亮、星星、雲朵，隨遊戲時間變化。 */
export function WindowView() {
  const sky = useRef<MeshBasicMaterial>(null);
  const sunRef = useRef<Mesh>(null);
  const moonRef = useRef<Mesh>(null);
  const stars = useRef<PointsMaterial>(null);
  const clouds = useRef<Group>(null);
  const state = useMemo(() => createLightingState(), []);
  const cloudColor = useMemo(() => new Color(), []);

  const starGeo = useMemo(() => {
    const g = new BufferGeometry();
    const pos: number[] = [];
    // 固定的偽隨機星點（不使用 Math.random，保持穩定）
    for (let i = 0; i < 36; i++) {
      pos.push(WIN_X - 1.2 + ((i * 0.6180339) % 1) * 2.4, 1.3 + ((i * 0.7548776) % 1) * 1.3, -2.98);
    }
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame(() => {
    sampleLighting(getEnv().hour, state);
    sky.current?.color.copy(state.sky);
    const lum = state.sky.r * 0.3 + state.sky.g * 0.59 + state.sky.b * 0.11;
    if (stars.current) stars.current.opacity = Math.min(Math.max((0.35 - lum) * 4, 0), 1);

    const x = WIN_X + 0.9 * (1 - 2 * state.arc);
    if (sunRef.current) {
      sunRef.current.visible = state.isDay;
      sunRef.current.position.set(x, 1.4 + 1.0 * state.elevation, -2.97);
    }
    if (moonRef.current) {
      moonRef.current.visible = !state.isDay;
      moonRef.current.position.set(x, 1.5 + 0.8 * state.elevation, -2.97);
    }
    cloudColor.copy(WHITE).lerp(state.sky, 0.55);
    clouds.current?.children.forEach((c) => {
      ((c as Mesh).material as MeshBasicMaterial).color.copy(cloudColor);
    });
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
        {CLOUDS.map(([x, y, r], i) => (
          <mesh key={i} position={[x, y, -2.95]} scale={[r * 1.8, r, 0.1]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
