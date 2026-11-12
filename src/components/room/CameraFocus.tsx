import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { brain } from "@/game/catRuntime";
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

/** 近看小貓：鏡頭跟著小貓目前的位置 */
const CAT_OFFSET = new Vector3(1.15, 0.45, 1.35);
const CAT_LOOK = new Vector3(0, 0.32, 0);
function currentView(focus: Focus): View {
  if (focus === "room") return VIEWS.room;
  const c = new Vector3(brain.x, brain.y, brain.z);
  return {
    position: c.clone().add(CAT_OFFSET),
    target: c.clone().add(CAT_LOOK),
    limits: VIEWS.cat.limits,
  };
}

const DURATION = 700;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** 切換焦點時，平滑移動鏡頭並切換對應的 OrbitControls 限制。 */
export function CameraFocus() {
  const get = useThree((s) => s.get);
  const focus = useRoomStore((s) => s.focus);
  /** 鏡頭移動完成後，持續跟隨小貓 */
  const follow = useRef<Vector3 | null>(null);

  useFrame(() => {
    const f = follow.current;
    const { controls } = get();
    if (!f || !isOrbit(controls)) return;
    const dx = brain.x - f.x;
    const dy = brain.y - f.y;
    const dz = brain.z - f.z;
    if (dx === 0 && dy === 0 && dz === 0) return;
    f.set(brain.x, brain.y, brain.z);
    get().camera.position.add(new Vector3(dx, dy, dz));
    controls.target.add(new Vector3(dx, dy, dz));
    controls.update();
  });

  useEffect(() => {
    follow.current = null;
    const { camera, controls, invalidate } = get();
    if (!isOrbit(controls)) return;
    const startFocus = focus;
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
      const view = currentView(startFocus);
      camera.position.lerpVectors(fromPos, view.position, k);
      controls.target.lerpVectors(fromTarget, view.target, k);
      controls.update();
      invalidate();
      if (t < 1) raf = requestAnimationFrame(step);
      else {
        Object.assign(controls, view.limits);
        if (startFocus === "cat") follow.current = new Vector3(brain.x, brain.y, brain.z);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [focus, get]);

  return null;
}
