import type { FurnitureType } from "./furnitureCatalog";
import { FURNITURE_CATALOG } from "./furnitureCatalog";
import type { PlacedItemData } from "./layout";
import type { PoseId } from "./catPose";

/**
 * 貓咪與家具的互動，全部用資料描述（新增家具互動只需要加一筆）：
 * - target：哪種家具（或固定設施 "window"）
 * - activity：互動種類（也是時間偏好與顯示文字的依據）
 * - approach：貓咪先走到的地板點
 * - anchor：互動時貓咪的位置（含高度）
 * - facing：互動時的朝向（家具本地座標，弧度）
 * - exit：結束後落地的地板點
 * - mount：到達 anchor 的方式，walk 直接走到、hop 跳上去
 * - allowedStates：從哪些狀態可以開始這個互動
 * - duration：停留秒數範圍（真實時間）
 * 本地座標：原點在家具中心，rot=0 時正面朝 +z。
 */

export type CatActivity = "sleep" | "sit" | "watch" | "play" | "scratch" | "eat" | "groom" | "perch";

export type CatState =
  | "idle"
  | "wander"
  | "approach"
  | "mount"
  | "interact"
  | "dismount"
  | "called"
  | "reacting";

export type InteractionTarget = FurnitureType | "window";

export interface InteractionDef {
  readonly id: string;
  readonly target: InteractionTarget;
  readonly activity: CatActivity;
  readonly pose: PoseId;
  readonly approach: readonly [number, number];
  readonly anchor: readonly [number, number, number];
  readonly facing: number;
  readonly exit: readonly [number, number];
  readonly mount: "walk" | "hop";
  readonly allowedStates: readonly CatState[];
  readonly duration: readonly [number, number];
  /** 基礎權重，越大越常被選到 */
  readonly weight: number;
  readonly label: string;
}

const FROM_FREE: readonly CatState[] = ["idle", "wander"];

const I = (def: InteractionDef): InteractionDef => def;

export const INTERACTIONS: readonly InteractionDef[] = [
  I({ id: "cat-bed-sleep", target: "cat-bed", activity: "sleep", pose: "sleep", approach: [0, 0.55], anchor: [0, 0.1, 0], facing: 0.7, exit: [0, 0.6], mount: "hop", allowedStates: FROM_FREE, duration: [22, 45], weight: 1.4, label: "在貓窩裡睡覺" }),
  I({ id: "cat-bed-sit", target: "cat-bed", activity: "sit", pose: "sit", approach: [0, 0.55], anchor: [0, 0.1, 0], facing: 0.3, exit: [0, 0.6], mount: "hop", allowedStates: FROM_FREE, duration: [8, 16], weight: 0.8, label: "坐在貓窩裡" }),
  I({ id: "bed-sleep", target: "bed", activity: "sleep", pose: "sleep", approach: [0.4, 1.25], anchor: [0.35, 0.76, 0.5], facing: 2.4, exit: [0.4, 1.25], mount: "hop", allowedStates: FROM_FREE, duration: [25, 50], weight: 1.2, label: "在小床上睡覺" }),
  I({ id: "sofa-sleep", target: "sofa", activity: "sleep", pose: "sleep", approach: [-0.4, 0.65], anchor: [-0.4, 0.58, 0.1], facing: 1.2, exit: [-0.4, 0.65], mount: "hop", allowedStates: FROM_FREE, duration: [18, 36], weight: 1, label: "在沙發上打盹" }),
  I({ id: "sofa-sit", target: "sofa", activity: "sit", pose: "sit", approach: [0.4, 0.65], anchor: [0.4, 0.58, 0.1], facing: 0, exit: [0.4, 0.65], mount: "hop", allowedStates: FROM_FREE, duration: [8, 16], weight: 0.8, label: "坐在沙發上" }),
  I({ id: "beanbag-sleep", target: "beanbag", activity: "sleep", pose: "sleep", approach: [0, 0.6], anchor: [0, 0.4, 0], facing: 0.5, exit: [0, 0.6], mount: "hop", allowedStates: FROM_FREE, duration: [18, 36], weight: 1, label: "窩在懶骨頭上" }),
  I({ id: "chair-sit", target: "chair", activity: "sit", pose: "sit", approach: [0, 0.45], anchor: [0, 0.5, 0], facing: 0, exit: [0, 0.45], mount: "hop", allowedStates: FROM_FREE, duration: [8, 16], weight: 0.7, label: "坐在椅子上" }),
  I({ id: "desk-watch", target: "desk", activity: "watch", pose: "watch", approach: [-0.45, 0.6], anchor: [-0.45, 0.78, -0.15], facing: Math.PI, exit: [-0.45, 0.6], mount: "hop", allowedStates: FROM_FREE, duration: [12, 24], weight: 0.9, label: "在桌上看窗外" }),
  I({ id: "tree-perch", target: "cat-tree", activity: "perch", pose: "sit", approach: [0, 0.55], anchor: [0, 1.72, 0], facing: 0.4, exit: [0, 0.55], mount: "hop", allowedStates: FROM_FREE, duration: [14, 28], weight: 1.1, label: "在跳台頂端巡視" }),
  I({ id: "tree-sleep", target: "cat-tree", activity: "sleep", pose: "sleep", approach: [0, 0.55], anchor: [0, 1.72, 0], facing: 0.9, exit: [0, 0.55], mount: "hop", allowedStates: FROM_FREE, duration: [20, 40], weight: 0.9, label: "在跳台上睡覺" }),
  I({ id: "steps-perch", target: "cat-steps", activity: "perch", pose: "sit", approach: [0.4, 0.5], anchor: [0.4, 0.78, 0], facing: 0.2, exit: [0.4, 0.5], mount: "hop", allowedStates: FROM_FREE, duration: [10, 20], weight: 0.8, label: "坐在階梯跳台上" }),
  I({ id: "scratcher-scratch", target: "cat-scratcher", activity: "scratch", pose: "scratch", approach: [0, 0.32], anchor: [0, 0, 0.3], facing: Math.PI, exit: [0, 0.5], mount: "walk", allowedStates: FROM_FREE, duration: [5, 9], weight: 0.9, label: "磨爪子" }),
  I({ id: "bowl-eat", target: "cat-bowl", activity: "eat", pose: "eat", approach: [0, 0.3], anchor: [0, 0, 0.3], facing: Math.PI, exit: [0, 0.5], mount: "walk", allowedStates: FROM_FREE, duration: [6, 10], weight: 0.7, label: "吃點心" }),
  I({ id: "box-sit", target: "cardboard-box", activity: "sit", pose: "sit", approach: [0, 0.55], anchor: [0, 0.06, 0], facing: 0.3, exit: [0, 0.55], mount: "hop", allowedStates: FROM_FREE, duration: [10, 20], weight: 1.2, label: "躲進紙箱" }),
  I({ id: "box-sleep", target: "cardboard-box", activity: "sleep", pose: "sleep", approach: [0, 0.55], anchor: [0, 0.06, 0], facing: 0.9, exit: [0, 0.55], mount: "hop", allowedStates: FROM_FREE, duration: [18, 34], weight: 0.9, label: "在紙箱裡睡覺" }),
  I({ id: "toy-play", target: "cat-toy", activity: "play", pose: "play", approach: [0, 0.3], anchor: [0, 0, 0.28], facing: Math.PI, exit: [0, 0.5], mount: "walk", allowedStates: FROM_FREE, duration: [8, 16], weight: 1.3, label: "玩逗貓玩具" }),
  // 固定設施：窗台（世界座標，不依附任何家具；桌子擋住時走不到就不會被選）
  I({ id: "window-watch", target: "window", activity: "watch", pose: "watch", approach: [0.35, -2.0], anchor: [0.95, 1.4, -2.4], facing: Math.PI, exit: [0.35, -2.0], mount: "hop", allowedStates: FROM_FREE, duration: [14, 28], weight: 1.3, label: "趴在窗台看風景" }),
];

export interface ResolvedInteraction {
  readonly key: string;
  readonly def: InteractionDef;
  readonly itemId: string;
  /** 家具位置簽章：家具被移動或移除時，貓咪要放棄互動 */
  readonly sig: string;
  readonly approach: { readonly x: number; readonly z: number };
  readonly anchor: { readonly x: number; readonly y: number; readonly z: number };
  readonly yaw: number;
  readonly exit: { readonly x: number; readonly z: number };
}

const round3 = (v: number) => Math.round(v * 1000) / 1000;

export const itemSignature = (i: PlacedItemData) => `${i.x},${i.z},${i.rot}`;

function resolve(def: InteractionDef, item: PlacedItemData): ResolvedInteraction {
  const th = (item.rot * Math.PI) / 2;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const toWorld = (lx: number, lz: number) => ({
    x: round3(item.x + lx * c + lz * s),
    z: round3(item.z - lx * s + lz * c),
  });
  const a = toWorld(def.anchor[0], def.anchor[2]);
  return {
    key: `${item.id}:${def.id}`,
    def,
    itemId: item.id,
    sig: itemSignature(item),
    approach: toWorld(def.approach[0], def.approach[1]),
    anchor: { x: a.x, y: def.anchor[1], z: a.z },
    yaw: def.facing + th,
    exit: toWorld(def.exit[0], def.exit[1]),
  };
}

const WINDOW_ITEM: PlacedItemData = { id: "window", type: "rug", x: 0, z: 0, rot: 0 };

/** 目前房間裡所有可用的互動（家具 + 固定設施） */
export function resolveInteractions(items: readonly PlacedItemData[]): ResolvedInteraction[] {
  const out: ResolvedInteraction[] = [];
  for (const def of INTERACTIONS) {
    if (def.target === "window") {
      out.push(resolve(def, WINDOW_ITEM));
      continue;
    }
    for (const item of items) {
      if (item.type === def.target && FURNITURE_CATALOG[item.type]) out.push(resolve(def, item));
    }
  }
  return out;
}

/** 互動是否仍然成立（家具還在、位置沒變） */
export function isInteractionValid(r: ResolvedInteraction, items: readonly PlacedItemData[]): boolean {
  if (r.itemId === "window") return true;
  const item = items.find((i) => i.id === r.itemId);
  return item !== undefined && itemSignature(item) === r.sig;
}

export const ACTIVITY_LABEL: Readonly<Record<CatActivity, string>> = {
  sleep: "睡覺",
  sit: "休息",
  watch: "看窗外",
  play: "玩耍",
  scratch: "磨爪子",
  eat: "吃點心",
  groom: "理毛",
  perch: "站在高處",
};
