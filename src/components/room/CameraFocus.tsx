import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useRoomStore, type Focus } from "@/game/roomStore";

interface OrbitLike {
  enabled: boolean;
  target: Vector3;
  update: () => void;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  minAzimuthAngle: number;
  maxAzimuthAngle: number;
}

function isOrbit(c: unknown): c is OrbitLike {
  return typeof c === "object" && c !== null && "target" in c && "update" in c;
}

interface View {
  readonly position: Vector3;
  readonly target: Vector3;
  readonly limits: Pick<
    OrbitLike,
    "minDistance" | "maxDistance" | "minPolarAngle" | "maxPolarAngle" | "minAzimuthAngle" | "maxAzimuthAngle"
  >;
}

const VIEWS: Record<Focus, View> = {
  room: {
    position: new Vector3(6.2, 5.6, 8.2),
    target: new Vector3(0, 1, 0),
    limits: {
      minDistance: 6,
      maxDistance: 16,
      minPolarAngle: 0.45,
      maxPolarAngle: 1.4,
      minAzimuthAngle: -0.25,
      maxAzimuthAngle: 1.25,
    },
  },
  cat: {
    position: new Vector3(1.75, 0.75, 2.25),
    target: new Vector3(0.6, 0.32, 0.9),
    limits: {
      minDistance: 0.8,
      maxDistance: 4,
      minPolarAngle: 0.35,
      maxPolarAngle: 1.5,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
    },
  },
};

const DURATION = 700;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** 切換焦點時，平滑移動鏡頭並切換對應的 OrbitControls 限制。 */
export function CameraFocus() {
  const get = useThree((s) => s.get);
  const focus = useRoomStore((s) => s.focus);

  useEffect(() => {
    const { camera, controls, invalidate } = get();
    if (!isOrbit(controls)) return;
    const view = VIEWS[focus];
    const fromPos = camera.position.clone();
    const fromTarget = controls.target.clone();
    // 移動期間先解除限制，避免被夾回舊範圍
    Object.assign(controls, {
      minDistance: 0,
      maxDistance: Infinity,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
    });

    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      const k = ease(t);
      camera.position.lerpVectors(fromPos, view.position, k);
      controls.target.lerpVectors(fromTarget, view.target, k);
      controls.update();
      invalidate();
      if (t < 1) raf = requestAnimationFrame(step);
      else Object.assign(controls, view.limits);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [focus, get]);

  return null;
}
