"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PerspectiveCamera } from "three";
import { roomActions, useRoomStore } from "@/game/roomStore";
import { CameraFocus } from "./CameraFocus";
import { RoomScene } from "./RoomScene";

const TARGET: [number, number, number] = [0, 1, 0];
const INITIAL_POSITION: [number, number, number] = [6.2, 5.6, 8.2];

/** 直向（窄）螢幕拉大視角，避免房間被裁切。 */
function ResponsiveFov() {
  const get = useThree((s) => s.get);
  const aspect = useThree((s) => s.size.width / s.size.height);

  useEffect(() => {
    const { camera, invalidate } = get();
    if (camera instanceof PerspectiveCamera) {
      camera.fov = aspect < 1 ? 62 : aspect < 1.4 ? 46 : 38;
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [get, aspect]);

  return null;
}

export default function RoomCanvas() {
  const dragging = useRoomStore((s) => s.draft !== null);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop="demand"
      camera={{ position: INITIAL_POSITION, fov: 38, near: 0.1, far: 60 }}
      onPointerMissed={() => roomActions.select(null)}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.3; // 讓奶油白更明亮、不灰
      }}
    >
      <ResponsiveFov />
      <CameraFocus />
      <RoomScene />
      <OrbitControls
        makeDefault
        enabled={!dragging}
        target={TARGET}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={6}
        maxDistance={16}
        minPolarAngle={0.45}
        maxPolarAngle={1.4}
        minAzimuthAngle={-0.25}
        maxAzimuthAngle={1.25}
        rotateSpeed={0.6}
        zoomSpeed={0.7}
      />
    </Canvas>
  );
}
