/**
 * 小貓姿勢：以少數幾個數值描述，套用到 Kitten 的命名關節上。
 * 數值每幀向目標姿勢平滑靠近，因此切換姿勢會自然過渡。
 */

export interface PoseParams {
  /** 整個脊椎組的高度 / 前後位移 / 俯仰（負 = 前半身抬起） */
  spineY: number;
  spineZ: number;
  spinePitch: number;
  /** 腿的長度縮放（趴下時收起） */
  legScale: number;
  /** 前腳、後腳額外的前後擺角 */
  legFront: number;
  legBack: number;
  /** 頭部俯仰（正 = 低頭）與左右轉動 */
  headPitch: number;
  headYaw: number;
  /** 尾巴根部抬升（負 = 上揚） */
  tailBase: number;
  /** 尾巴左右擺動幅度 */
  tailSway: number;
  /** 呼吸起伏幅度 */
  breath: number;
}

export const POSE_IDS = ["stand", "sit", "sleep", "watch", "groom", "scratch", "play", "eat", "happy"] as const;
export type PoseId = (typeof POSE_IDS)[number];

const P = (p: Partial<PoseParams>): PoseParams => ({
  spineY: 0,
  spineZ: 0,
  spinePitch: 0,
  legScale: 1,
  legFront: 0,
  legBack: 0,
  headPitch: 0,
  headYaw: 0,
  tailBase: 0,
  tailSway: 0.12,
  breath: 0.012,
  ...p,
});

export const POSES: Readonly<Record<PoseId, PoseParams>> = {
  stand: P({}),
  sit: P({ spineY: -0.02, spineZ: -0.04, spinePitch: -0.62, legFront: 0.62, legBack: -1.2, headPitch: 0.62, tailBase: 0.25, tailSway: 0.08 }),
  watch: P({ spineY: -0.02, spineZ: -0.04, spinePitch: -0.68, legFront: 0.68, legBack: -1.2, headPitch: 0.5, tailBase: 0.3, tailSway: 0.2, breath: 0.01 }),
  sleep: P({ spineY: -0.14, legScale: 0.3, legFront: 0, legBack: 0, headPitch: 0.55, headYaw: 0.35, tailBase: 1.6, tailSway: 0.02, breath: 0.03 }),
  groom: P({ spineY: -0.02, spineZ: -0.04, spinePitch: -0.62, legFront: 0.62, legBack: -1.2, headPitch: 1.0, headYaw: 0.25, tailBase: 0.25, tailSway: 0.05 }),
  scratch: P({ spineY: 0.04, spineZ: -0.05, spinePitch: -1.0, legFront: -1.5, legBack: 0.2, headPitch: 0.9, tailBase: -0.2, tailSway: 0.2 }),
  play: P({ spineY: -0.07, spinePitch: 0.35, legScale: 0.9, legFront: -0.35, legBack: 0.1, headPitch: -0.3, tailBase: -0.4, tailSway: 0.45, breath: 0.02 }),
  eat: P({ spineY: -0.02, spinePitch: 0.3, legFront: -0.3, headPitch: 0.65, tailBase: 0, tailSway: 0.1 }),
  happy: P({ spineY: -0.02, spineZ: -0.04, spinePitch: -0.62, legFront: 0.62, legBack: -1.2, headPitch: -0.2, headYaw: 0, tailBase: -0.35, tailSway: 0.4 }),
};

export function createPose(id: PoseId): PoseParams {
  return { ...POSES[id] };
}

/** 讓目前姿勢以指數方式靠近目標姿勢（k 越大越快） */
export function stepPose(current: PoseParams, target: PoseParams, dt: number, k = 7): void {
  const a = 1 - Math.exp(-k * dt);
  for (const key of Object.keys(current) as (keyof PoseParams)[]) {
    current[key] += (target[key] - current[key]) * a;
  }
}
