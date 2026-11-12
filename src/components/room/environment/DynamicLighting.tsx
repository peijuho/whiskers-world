import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type AmbientLight, DirectionalLight, HemisphereLight, PointLight } from "three";
import { getEnv } from "@/game/environmentStore";
import { createLightingState, sampleLighting } from "@/game/lighting";

/**
 * 隨遊戲時間平滑變化的光源：環境光 + 半球光 + 一盞帶陰影的太陽/月亮 + 窗邊暖光。
 * 光源數量固定（避免 shader 重新編譯），只更新顏色與強度。
 */
export function DynamicLighting() {
  const amb = useRef<AmbientLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const win = useRef<PointLight>(null);
  const state = useMemo(() => createLightingState(), []);
  const bg = useMemo(
    () => ({ day: new Color("#fbf6ea"), dayEdge: new Color("#dfe6e4"), night: new Color("#34406c"), nightEdge: new Color("#1f2748"), a: new Color(), b: new Color() }),
    [],
  );

  useFrame(() => {
    sampleLighting(getEnv().hour, state);
    if (amb.current) {
      amb.current.color.copy(state.ambColor);
      amb.current.intensity = state.ambIntensity;
    }
    if (hemi.current) {
      hemi.current.color.copy(state.hemiSky);
      hemi.current.groundColor.copy(state.hemiGround);
      hemi.current.intensity = state.hemiIntensity;
    }
    if (sun.current) {
      sun.current.color.copy(state.sunColor);
      sun.current.intensity = state.sunIntensity;
      const reach = state.isDay ? 5 : 4;
      sun.current.position.set(reach * Math.cos(Math.PI * state.arc), 3 + (state.isDay ? 5 : 3) * state.elevation, 5.5);
    }
    // 頁面背景跟著天色（星空 → 晨光 → 暖奶油）
    const lum = state.sky.r * 0.3 + state.sky.g * 0.59 + state.sky.b * 0.11;
    const k = Math.min(Math.max((lum - 0.2) / 0.4, 0), 1);
    bg.a.copy(bg.night).lerp(bg.day, k).lerp(state.sky, 0.18);
    bg.b.copy(bg.nightEdge).lerp(bg.dayEdge, k);
    const root = document.documentElement.style;
    root.setProperty("--bg-center", `#${bg.a.getHexString()}`);
    root.setProperty("--bg-edge", `#${bg.b.getHexString()}`);
    if (win.current) {
      win.current.intensity = Math.max(0, state.sunIntensity - 0.55) * 2.4;
      win.current.color.copy(state.sunColor);
    }
  });

  return (
    <>
      <ambientLight ref={amb} />
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sun}
        position={[4.5, 7, 5.5]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={5}
      />
      <pointLight ref={win} position={[1.5, 2.2, -1.6]} distance={6} decay={2} />
    </>
  );
}
