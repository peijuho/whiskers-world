import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, type Mesh, type MeshBasicMaterial } from "three";
import { getEnv } from "@/game/environmentStore";
import { createLightingState, sampleLighting, sunPatchTransform } from "@/game/lighting";

function makePatchTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 192;
  const g = c.getContext("2d");
  if (g) {
    g.filter = "blur(5px)";
    g.fillStyle = "#fff";
    // 兩列兩欄的窗格，中間留出窗框的陰影
    for (const [x, y] of [[20, 14], [134, 14], [20, 100], [134, 100]]) g.fillRect(x, y, 102, 78);
  }
  return new CanvasTexture(c);
}

/** 窗外陽光投在地板上的柔和光斑（早晨與黃昏最明顯，陰雨天會變淡）。 */
export function SunPatch() {
  const mesh = useRef<Mesh>(null);
  const mat = useRef<MeshBasicMaterial>(null);
  const tex = useMemo(() => makePatchTexture(), []);
  const state = useMemo(() => createLightingState(), []);
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame(() => {
    sampleLighting(getEnv().hour, state);
    const m = mesh.current;
    const material = mat.current;
    if (!m || !material) return;
    const t = sunPatchTransform(state.arc, state.elevation);
    m.position.set(t.x, 0.06, t.z);
    m.scale.set(1, t.stretch, 1);
    m.visible = state.sunPatch > 0.01;
    material.opacity = state.sunPatch * 0.45;
    material.color.copy(state.sunColor);
  });

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} raycast={() => null}>
      <planeGeometry args={[1.5, 1.1]} />
      <meshBasicMaterial
        ref={mat}
        map={tex}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
