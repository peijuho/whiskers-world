import { FURNITURE_CATALOG } from "./furnitureCatalog";
import { footprint, ROOM, type PlacedItemData } from "./layout";
import {
  ACTIVITY_LABEL,
  isInteractionValid,
  resolveInteractions,
  type CatActivity,
  type CatState,
  type ResolvedInteraction,
} from "./catInteractions";
import { buildGrid, findPath, isFree, nearestFree, nearestFreeWithin, type Grid, type Vec2 } from "./catNav";
import type { PoseId } from "./catPose";
import { preferenceWeight, type PreferredActivity } from "./catPreferences";

/**
 * 小貓行為狀態機（純邏輯，沒有 three.js / React 相依，方便測試）。
 *
 *  idle ─┬─> wander ──────────────┐
 *        ├─> approach ─> mount ─> interact ─> dismount ─┐
 *        └─> interact（原地理毛 / 休息）─────────────────┤
 *  called / reacting 由玩家觸發，可在任何狀態打斷；結束後回到 idle。
 *  貓咪是自主的：玩家不介入時，由 decide() 依權重 × 時段偏好 × 變化性隨機選擇行動。
 */

export type BrainActivity = PreferredActivity | "idle" | "called" | "pet";

export interface Hop {
  t: number;
  readonly dur: number;
  readonly from: { x: number; y: number; z: number };
  readonly to: { x: number; y: number; z: number };
  readonly peak: number;
}

export interface Brain {
  state: CatState;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pose: PoseId;
  walking: boolean;
  path: Vec2[];
  timer: number;
  cooldown: number;
  current: ResolvedInteraction | null;
  hop: Hop | null;
  /** 落地後要接著走去的點（玩家呼喚時使用） */
  after: Vec2 | null;
  activity: BrainActivity;
  last: BrainActivity | null;
  label: string;
}

const WALK_SPEED = 0.6;
const FLOOR_Y = 0;
const RUG_Y = 0.05;
const BIG = 0.05;

export function createBrain(): Brain {
  return {
    state: "idle",
    x: 0.6,
    y: RUG_Y,
    z: 0.9,
    yaw: 0.6,
    pose: "stand",
    walking: false,
    path: [],
    timer: 2,
    cooldown: 0,
    current: null,
    hop: null,
    after: null,
    activity: "idle",
    last: null,
    label: "發呆中",
  };
}

export interface WorldCtx {
  readonly items: readonly PlacedItemData[];
  /** 遊戲內小時 0–24 */
  readonly hour: number;
  readonly rand: () => number;
}

// ---- 世界快取：家具沒變就不重算 ----
let cacheItems: readonly PlacedItemData[] | null = null;
let cacheGrid: Grid = new Uint8Array(0);
let cacheInter: ResolvedInteraction[] = [];
function world(items: readonly PlacedItemData[]) {
  if (cacheItems !== items) {
    cacheItems = items;
    cacheGrid = buildGrid(items);
    cacheInter = resolveInteractions(items);
  }
  return { grid: cacheGrid, interactions: cacheInter };
}

function groundY(items: readonly PlacedItemData[], x: number, z: number): number {
  for (const it of items) {
    const def = FURNITURE_CATALOG[it.type];
    if (def.solid) continue;
    const f = footprint(it.type, it.rot);
    if (Math.abs(x - it.x) < f.w / 2 && Math.abs(z - it.z) < f.d / 2) return RUG_Y;
  }
  return FLOOR_Y;
}

const between = (r: () => number, [a, b]: readonly [number, number]) => a + (b - a) * r();

function angleLerp(from: number, to: number, a: number) {
  let d = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d * a;
}

function setIdle(b: Brain, rand: () => number, cooldown = 0) {
  b.state = "idle";
  b.activity = "idle";
  b.label = "發呆中";
  b.pose = rand() < 0.4 ? "sit" : "stand";
  b.timer = 1.5 + rand() * 3;
  b.cooldown = cooldown;
  b.walking = false;
  b.current = null;
  b.hop = null;
  b.after = null;
}

function startPath(b: Brain, path: Vec2[], state: CatState, activity: BrainActivity, label: string) {
  b.state = state;
  b.path = path;
  b.activity = activity;
  b.label = label;
  b.pose = "stand";
  b.walking = true;
}

function startHop(b: Brain, to: { x: number; y: number; z: number }, state: "mount" | "dismount") {
  const dy = Math.abs(to.y - b.y);
  b.state = state;
  b.walking = false;
  b.pose = "stand";
  b.hop = {
    t: 0,
    dur: 0.45 + 0.55 * dy,
    from: { x: b.x, y: b.y, z: b.z },
    to,
    peak: 0.12 + dy * 0.3,
  };
}

function startInteract(b: Brain, r: ResolvedInteraction | null, activity: CatActivity, label: string, pose: PoseId, dur: number) {
  b.state = "interact";
  b.current = r;
  b.activity = activity;
  b.label = label;
  b.pose = pose;
  b.timer = dur;
  b.walking = false;
  b.hop = null;
}

/** 預先算好路徑；接近點若被家具擋住，就改用附近最近的空地（最多 0.45m）。 */
function prepare(grid: Grid, from: Vec2, r: ResolvedInteraction): { r: ResolvedInteraction; path: Vec2[] } | null {
  const spot = nearestFreeWithin(grid, r.approach.x, r.approach.z, 0.45);
  if (!spot) return null;
  const path = findPath(grid, from, spot);
  if (!path) return null;
  return { r: { ...r, approach: spot }, path };
}

interface Candidate {
  readonly weight: number;
  readonly start: () => void;
}

function decide(b: Brain, w: WorldCtx) {
  const { grid, interactions } = world(w.items);
  const here: Vec2 = { x: b.x, z: b.z };
  const cands: Candidate[] = [];
  const adj = (activity: PreferredActivity, base: number, dist: number) =>
    base * preferenceWeight(activity, w.hour) * (b.last === activity ? 0.35 : 1) / (1 + 0.15 * dist);

  for (const r of interactions) {
    if (!r.def.allowedStates.includes(b.state)) continue;
    if (!isInteractionValid(r, w.items)) continue;
    const ready = prepare(grid, here, r);
    if (!ready) continue;
    const dist = Math.hypot(ready.r.approach.x - b.x, ready.r.approach.z - b.z);
    cands.push({
      weight: adj(r.def.activity, r.def.weight, dist),
      start: () => {
        b.current = ready.r;
        startPath(b, ready.path, "approach", r.def.activity, `走向${ACTIVITY_LABEL[r.def.activity]}的地方`);
      },
    });
  }

  // 原地理毛 / 休息：不需要任何家具
  cands.push({
    weight: adj("groom", 0.9, 0),
    start: () => startInteract(b, null, "groom", "理毛中", "groom", between(w.rand, [6, 12])),
  });
  cands.push({
    weight: adj("sit", 0.6, 0),
    start: () => startInteract(b, null, "sit", "坐著休息", "sit", between(w.rand, [6, 14])),
  });

  // 隨處走走
  for (let i = 0; i < 3; i++) {
    const tx = Math.min(Math.max(b.x + (w.rand() - 0.5) * 4, ROOM.minX + 0.3), ROOM.maxX - 0.3);
    const tz = Math.min(Math.max(b.z + (w.rand() - 0.5) * 3.5, ROOM.minZ + 0.3), ROOM.maxZ - 0.3);
    if (!isFree(grid, tx, tz) || Math.hypot(tx - b.x, tz - b.z) < 0.8) continue;
    const path = findPath(grid, here, { x: tx, z: tz });
    if (!path) continue;
    cands.push({
      weight: adj("wander", 1.1, 0),
      start: () => startPath(b, path, "wander", "wander", "在房間裡散步"),
    });
  }

  const total = cands.reduce((s, c) => s + c.weight, 0);
  if (total <= 0) return setIdle(b, w.rand);
  let pick = w.rand() * total;
  for (const c of cands) {
    pick -= c.weight;
    if (pick <= 0) {
      b.last = b.activity;
      return c.start();
    }
  }
  cands[cands.length - 1].start();
}

/** 家具被搬走：不管貓咪在哪，直接落到最近的空地。 */
function abort(b: Brain, w: WorldCtx) {
  const { grid } = world(w.items);
  b.current = null;
  b.path = [];
  b.after = null;
  if (b.y > BIG || b.hop) {
    const p = nearestFree(grid, b.x, b.z);
    startHop(b, { x: p.x, y: groundY(w.items, p.x, p.z), z: p.z }, "dismount");
  } else {
    setIdle(b, w.rand, 2);
  }
}

function finishInteract(b: Brain, w: WorldCtx) {
  b.last = b.activity;
  const r = b.current;
  if (r && (b.y > BIG || r.def.mount === "hop")) {
    startHop(b, { x: r.exit.x, y: groundY(w.items, r.exit.x, r.exit.z), z: r.exit.z }, "dismount");
  } else {
    setIdle(b, w.rand, 1.5);
  }
}

function followPath(b: Brain, dt: number, items: readonly PlacedItemData[]): boolean {
  const next = b.path[0];
  if (!next) return true;
  const dx = next.x - b.x;
  const dz = next.z - b.z;
  const dist = Math.hypot(dx, dz);
  const step = WALK_SPEED * dt;
  if (dist <= step) {
    b.x = next.x;
    b.z = next.z;
    b.path.shift();
  } else {
    b.x += (dx / dist) * step;
    b.z += (dz / dist) * step;
  }
  if (dist > 1e-4) b.yaw = angleLerp(b.yaw, Math.atan2(dx, dz), Math.min(1, dt * 9));
  b.y += (groundY(items, b.x, b.z) - b.y) * Math.min(1, dt * 12);
  return b.path.length === 0;
}

function stepHop(b: Brain, dt: number): boolean {
  const h = b.hop;
  if (!h) return true;
  h.t = Math.min(1, h.t + dt / h.dur);
  const k = h.t;
  b.x = h.from.x + (h.to.x - h.from.x) * k;
  b.z = h.from.z + (h.to.z - h.from.z) * k;
  b.y = h.from.y + (h.to.y - h.from.y) * k + 4 * h.peak * k * (1 - k);
  const dx = h.to.x - h.from.x;
  const dz = h.to.z - h.from.z;
  if (Math.hypot(dx, dz) > 0.05) b.yaw = angleLerp(b.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10));
  return k >= 1;
}

export function stepBrain(b: Brain, dt: number, w: WorldCtx): void {
  b.cooldown = Math.max(0, b.cooldown - dt);

  // 互動對象被移動或移除 → 放棄
  if (b.current && b.state !== "dismount" && !isInteractionValid(b.current, w.items)) abort(b, w);

  switch (b.state) {
    case "idle": {
      b.timer -= dt;
      if (b.timer <= 0 && b.cooldown <= 0) decide(b, w);
      else if (b.timer <= 0) b.timer = 0.5;
      break;
    }
    case "wander":
    case "called": {
      if (followPath(b, dt, w.items)) {
        b.walking = false;
        if (b.state === "called") {
          b.state = "reacting";
          b.activity = "pet";
          b.label = "開心地等你";
          b.pose = "happy";
          b.timer = 3.5;
        } else setIdle(b, w.rand);
      }
      break;
    }
    case "approach": {
      if (followPath(b, dt, w.items) && b.current) {
        const r = b.current;
        b.walking = false;
        if (r.def.mount === "walk") {
          b.x = r.anchor.x;
          b.z = r.anchor.z;
          startInteract(b, r, r.def.activity, r.def.label, r.def.pose, between(w.rand, r.def.duration));
        } else {
          startHop(b, r.anchor, "mount");
        }
      }
      break;
    }
    case "mount": {
      if (stepHop(b, dt) && b.current) {
        const r = b.current;
        startInteract(b, r, r.def.activity, r.def.label, r.def.pose, between(w.rand, r.def.duration));
      }
      break;
    }
    case "interact": {
      if (b.current) b.yaw = angleLerp(b.yaw, b.current.yaw, Math.min(1, dt * 6));
      b.timer -= dt;
      if (b.timer <= 0) finishInteract(b, w);
      break;
    }
    case "dismount": {
      if (stepHop(b, dt)) {
        b.hop = null;
        b.current = null;
        if (b.after) {
          const { grid } = world(w.items);
          const path = findPath(grid, { x: b.x, z: b.z }, b.after);
          b.after = null;
          if (path) startPath(b, path, "called", "called", "朝你跑過來");
          else setIdle(b, w.rand, 1.5);
        } else setIdle(b, w.rand, 1.5);
      }
      break;
    }
    case "reacting": {
      b.timer -= dt;
      if (b.timer <= 0) {
        if (b.current && b.y > BIG) {
          const r = b.current;
          startHop(b, { x: r.exit.x, y: groundY(w.items, r.exit.x, r.exit.z), z: r.exit.z }, "dismount");
        } else setIdle(b, w.rand, 6);
      }
      break;
    }
  }
}

/** 玩家呼喚：點地板某處，小貓走過去（任何狀態都可以打斷）。 */
export function callCat(b: Brain, x: number, z: number, w: WorldCtx): void {
  const { grid } = world(w.items);
  const target = isFree(grid, x, z) ? { x, z } : nearestFree(grid, x, z);
  if (b.y > BIG || b.hop || b.state === "mount") {
    const r = b.current;
    const exit = r ? r.exit : nearestFree(grid, b.x, b.z);
    b.after = target;
    startHop(b, { x: exit.x, y: groundY(w.items, exit.x, exit.z), z: exit.z }, "dismount");
    return;
  }
  b.current = null;
  b.hop = null;
  const path = findPath(grid, { x: b.x, z: b.z }, target);
  if (path) startPath(b, path, "called", "called", "朝你跑過來");
}

/** 玩家摸小貓：任何狀態都會醒來撒嬌，結束後回到自己的生活。 */
export function petCat(b: Brain): void {
  b.walking = false;
  b.path = [];
  b.after = null;
  b.hop = b.state === "mount" || b.state === "dismount" ? b.hop : null;
  if (b.state === "mount" || b.state === "dismount") return; // 跳躍中不打斷，落地後再說
  b.state = "reacting";
  b.activity = "pet";
  b.label = "被摸得好開心";
  b.pose = "happy";
  b.timer = 2.5;
}

/** 測試 / 除錯用：直接指定互動。 */
export function forceInteraction(b: Brain, key: string, w: WorldCtx): boolean {
  const { grid, interactions } = world(w.items);
  const r = interactions.find((i) => i.key === key || i.def.id === key);
  if (!r) return false;
  const ready = prepare(grid, { x: b.x, z: b.z }, r);
  if (!ready) return false;
  b.current = ready.r;
  startPath(b, ready.path, "approach", r.def.activity, `走向${ACTIVITY_LABEL[r.def.activity]}的地方`);
  return true;
}
