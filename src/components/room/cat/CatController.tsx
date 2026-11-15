import { useEffect, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import type { Group, Object3D } from "three";
import { callCat, forceInteraction, petCat, stepBrain, type WorldCtx } from "@/game/catBrain";
import { resolveInteractions } from "@/game/catInteractions";
import { buildGrid, findPath, isFree } from "@/game/catNav";
import { createPose, POSES, stepPose } from "@/game/catPose";
import { brain, publishCatStatus } from "@/game/catRuntime";
import { getEnv } from "@/game/environmentStore";
import { ROOM } from "@/game/layout";
import { getRoomState, roomActions, useRoomStore } from "@/game/roomStore";
import { Kitten } from "./Kitten";

/**
 * 把 brain（純邏輯）套到 Kitten 的命名關節上：
 * 位置 / 朝向 / 姿勢平滑 / 走路擺腿 / 呼吸 / 尾巴擺動。
 * 同時處理玩家互動：點小貓 = 摸摸，點地板 = 呼喚。
 */

const JOINT_NAMES = ["spine", "head", "legFR", "legFL", "legBR", "legBL", "tail1", "tail2", "tail3", "tail4"] as const;
type JointName = (typeof JOINT_NAMES)[number];
type Joints = Record<JointName, Object3D>;

const TAIL_BASE = [-1.15, 0.5, 0.5, 0.5] as const;
const pose = createPose("stand");
const noRaycast = () => null;

function collectJoints(root: Object3D): Joints | null {
  const out: Partial<Joints> = {};
  for (const n of JOINT_NAMES) {
    const o = root.getObjectByName(n);
    if (!o) return null;
    out[n] = o;
  }
  return out as Joints;
}

/** 每幀把姿勢參數寫到關節（模組層級函式，避免在元件閉包裡修改 hook 值） */
function applyPose(j: Joints, time: number, walkPhase: number, walking: boolean, moving: number) {
  const bob = walking ? Math.abs(Math.sin(walkPhase)) * 0.012 : 0;
  const breath = Math.sin(time * 2.2) * pose.breath;
  j.spine.position.set(0, pose.spineY + bob + breath * 0.5, pose.spineZ);
  j.spine.rotation.x = pose.spinePitch;
  j.spine.scale.set(1 + breath * 0.4, 1 + breath, 1);

  const swing = Math.sin(walkPhase) * 0.7 * moving;
  const front = pose.legFront;
  const back = pose.legBack;
  j.legFR.rotation.x = front + swing;
  j.legFL.rotation.x = front - swing;
  j.legBR.rotation.x = back - swing;
  j.legBL.rotation.x = back + swing;
  for (const n of ["legFR", "legFL", "legBR", "legBL"] as const) j[n].scale.y = pose.legScale;

  j.head.rotation.x = pose.headPitch - pose.spinePitch * 0.85;
  j.head.rotation.y = pose.headYaw + Math.sin(time * 0.7) * 0.05;

  const sway = Math.sin(time * 1.6) * pose.tailSway;
  j.tail1.rotation.x = TAIL_BASE[0] + pose.tailBase;
  j.tail1.rotation.z = sway;
  j.tail2.rotation.z = sway * 0.8;
  j.tail3.rotation.z = sway * 0.8;
  j.tail4.rotation.z = sway * 0.8;
}

export function CatController() {
  const root = useRef<Group>(null);
  const joints = useRef<Joints | null>(null);
  const timer = useRef<number | null>(null);
  const time = useRef(0);
  const phase = useRef(0);
  const moving = useRef(0);
  const get = useThree((s) => s.get);
  const editing = useRoomStore((s) => s.mode === "edit");

  useEffect(() => {
    if (root.current) joints.current = collectJoints(root.current);
    get().invalidate();
    // 開發時暴露除錯入口，方便實機測試各種行為（正式版不存在）
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as { __whiskers?: unknown };
      w.__whiskers = {
        brain,
        diagnose: () => {
          const items = getRoomState().items;
          const grid = buildGrid(items);
          return resolveInteractions(items).map((r) => ({
            key: r.key,
            approach: r.approach,
            free: isFree(grid, r.approach.x, r.approach.z),
            path: findPath(grid, { x: brain.x, z: brain.z }, r.approach) !== null,
          }));
        },
        pet: () => petCat(brain),
        remove: (id: string) => {
          roomActions.setMode("edit");
          roomActions.select(id);
          roomActions.removeSelected();
          roomActions.setMode("view");
        },
        force: (key: string) =>
          forceInteraction(brain, key, { items: getRoomState().items, hour: getEnv().hour, rand: Math.random }),
      };
    }
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [get]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const room = getRoomState();
    if (room.hydrated) {
      const ctx: WorldCtx = { items: room.items, hour: getEnv().hour, rand: Math.random };
      stepBrain(brain, dt, ctx);
    }
    time.current += dt;
    const walking = brain.walking;
    moving.current += ((walking ? 1 : 0) - moving.current) * Math.min(1, dt * 10);
    if (walking) phase.current += dt * 11;
    stepPose(pose, POSES[brain.pose], dt);

    const g = root.current;
    if (g) {
      g.position.set(brain.x, brain.y, brain.z);
      g.rotation.y = brain.yaw;
    }
    if (joints.current) applyPose(joints.current, time.current, phase.current, walking, moving.current);
    publishCatStatus();

    // demand 模式：小貓一直在動，用 ~30fps 自己排下一幀（走動時全速）
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => state.invalidate(), walking || brain.hop ? 0 : 33);
  });

  const onCatClick = (e: ThreeEvent<MouseEvent>) => {
    if (getRoomState().mode === "edit" || e.delta > 6) return;
    e.stopPropagation();
    petCat(brain);
  };

  const onFloorClick = (e: ThreeEvent<MouseEvent>) => {
    if (getRoomState().mode === "edit" || e.delta > 6) return;
    e.stopPropagation();
    const room = getRoomState();
    callCat(brain, e.point.x, e.point.z, { items: room.items, hour: getEnv().hour, rand: Math.random });
    roomActions.notify("小貓聽到了，跑過來囉", "ok");
  };

  return (
    <>
      <group ref={root} onClick={onCatClick}>
        <Kitten />
      </group>
      {/* 透明地板：瀏覽模式下點一下就能呼喚小貓 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.012, 0]}
        onClick={onFloorClick}
        raycast={editing ? noRaycast : undefined}
      >
        <planeGeometry args={[ROOM.maxX - ROOM.minX, ROOM.maxZ - ROOM.minZ]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}
