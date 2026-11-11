import {
  FURNITURE_CATALOG,
  MAX_ITEMS,
  isFurnitureType,
  type FurnitureType,
} from "./furnitureCatalog";

/** 房間可擺放範圍（地板內部） */
export const ROOM = { minX: -3, maxX: 3, minZ: -2.5, maxZ: 2.5 } as const;
export const GRID = 0.25;
const EPS = 1e-6;

export type Rotation = 0 | 1 | 2 | 3;

export interface PlacedItemData {
  readonly id: string;
  readonly type: FurnitureType;
  readonly x: number;
  readonly z: number;
  readonly rot: Rotation;
}

const round3 = (v: number) => Math.round(v * 1000) / 1000;
export const snap = (v: number) => round3(Math.round(v / GRID) * GRID);

export function footprint(type: FurnitureType, rot: Rotation) {
  const { w, d } = FURNITURE_CATALOG[type];
  return rot % 2 === 1 ? { w: d, d: w } : { w, d };
}

/** 先吸附格線，再限制在房間內（貼牆時可能略偏離格線，屬正常） */
export function snapAndClamp(
  type: FurnitureType,
  rot: Rotation,
  x: number,
  z: number,
) {
  const { w, d } = footprint(type, rot);
  const cx = Math.min(Math.max(snap(x), ROOM.minX + w / 2), ROOM.maxX - w / 2);
  const cz = Math.min(Math.max(snap(z), ROOM.minZ + d / 2), ROOM.maxZ - d / 2);
  return { x: round3(cx), z: round3(cz) };
}

function overlaps(
  a: { type: FurnitureType; rot: Rotation; x: number; z: number },
  b: { type: FurnitureType; rot: Rotation; x: number; z: number },
) {
  const fa = footprint(a.type, a.rot);
  const fb = footprint(b.type, b.rot);
  return (
    Math.abs(a.x - b.x) < (fa.w + fb.w) / 2 - EPS &&
    Math.abs(a.z - b.z) < (fa.d + fb.d) / 2 - EPS
  );
}

/** 貼地物件永遠合法；實體家具不可與其他實體家具重疊 */
export function isPlacementValid(
  items: readonly PlacedItemData[],
  id: string,
  candidate: { type: FurnitureType; rot: Rotation; x: number; z: number },
): boolean {
  if (!FURNITURE_CATALOG[candidate.type].solid) return true;
  return !items.some(
    (other) =>
      other.id !== id &&
      FURNITURE_CATALOG[other.type].solid &&
      overlaps(candidate, other),
  );
}

export function nextId(
  items: readonly PlacedItemData[],
  type: FurnitureType,
): string {
  const used = new Set(items.map((i) => i.id));
  let n = 1;
  while (used.has(`${type}-${n}`)) n += 1;
  return `${type}-${n}`;
}

/** 靠牆家具的吸附距離（家具邊緣到牆面） */
export const WALL_SNAP = 0.6;
const CORNER_SNAP = 0.3;

/**
 * 計算家具最終位置與朝向。
 * 靠牆型家具靠近後牆或左牆時，自動貼齊牆面並讓背面朝牆（rot 0 = 背朝後牆，rot 1 = 背朝左牆）；
 * 離開牆邊則恢復原本的朝向。
 */
export function alignToWalls(
  type: FurnitureType,
  baseRot: Rotation,
  x: number,
  z: number,
): { x: number; z: number; rot: Rotation } {
  if (!FURNITURE_CATALOG[type].wall) {
    return { ...snapAndClamp(type, baseRot, x, z), rot: baseRot };
  }
  const f0 = footprint(type, 0);
  const f1 = footprint(type, 1);
  const dBack = z - f0.d / 2 - ROOM.minZ;
  const dLeft = x - f1.w / 2 - ROOM.minX;
  const nearest = Math.min(dBack, dLeft);
  if (nearest > WALL_SNAP) {
    return { ...snapAndClamp(type, baseRot, x, z), rot: baseRot };
  }
  const rot: Rotation = dBack <= dLeft ? 0 : 1;
  const p = snapAndClamp(type, rot, x, z);
  const f = footprint(type, rot);
  // 貼齊主要牆面；若同時靠近另一面牆（牆角）也一併貼齊
  const flushBack = rot === 0 || dBack <= CORNER_SNAP;
  const flushLeft = rot === 1 || dLeft <= CORNER_SNAP;
  return {
    x: round3(flushLeft ? ROOM.minX + f.w / 2 : p.x),
    z: round3(flushBack ? ROOM.minZ + f.d / 2 : p.z),
    rot,
  };
}

/** 由前方中央往外找第一個放得下的位置（靠牆家具由後牆開始找） */
export function findFreeSpot(
  items: readonly PlacedItemData[],
  type: FurnitureType,
): { x: number; z: number } | null {
  const def = FURNITURE_CATALOG[type];
  if (!def.solid) return { x: 0, z: 0 };
  const xs: number[] = [];
  for (let x = ROOM.minX; x <= ROOM.maxX + EPS; x += GRID) xs.push(round3(x));
  xs.sort((a, b) => Math.abs(a) - Math.abs(b));
  const zs: number[] = [];
  for (let z = ROOM.minZ; z <= ROOM.maxZ + EPS; z += GRID) zs.push(round3(z));
  if (!def.wall) zs.reverse();
  for (const z of zs) {
    for (const x of xs) {
      const p = snapAndClamp(type, 0, x, z);
      if (isPlacementValid(items, "", { type, rot: 0, ...p })) return p;
    }
  }
  return null;
}

export const DEFAULT_ITEMS: readonly PlacedItemData[] = [
  { id: "rug-1", type: "rug", x: 0.25, z: 0.75, rot: 0 },
  { id: "bed-1", type: "bed", x: -2, z: -1.45, rot: 0 },
  { id: "desk-1", type: "desk", x: 1.5, z: -2.1, rot: 0 },
  { id: "chair-1", type: "chair", x: 1.5, z: -1.35, rot: 0 },
  { id: "plant-1", type: "plant", x: -0.25, z: -2.25, rot: 0 },
];

/** 驗證並清理從 localStorage 讀到的資料；格式不符回傳 null */
export function sanitizeItems(raw: unknown): PlacedItemData[] | null {
  if (!Array.isArray(raw)) return null;
  const result: PlacedItemData[] = [];
  const ids = new Set<string>();
  for (const entry of raw) {
    if (result.length >= MAX_ITEMS) break;
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.id !== "string" ||
      ids.has(e.id) ||
      !isFurnitureType(e.type) ||
      typeof e.x !== "number" ||
      typeof e.z !== "number" ||
      !Number.isFinite(e.x) ||
      !Number.isFinite(e.z) ||
      (e.rot !== 0 && e.rot !== 1 && e.rot !== 2 && e.rot !== 3)
    ) {
      continue;
    }
    const p = snapAndClamp(e.type, e.rot, e.x, e.z);
    const item: PlacedItemData = { id: e.id, type: e.type, rot: e.rot, ...p };
    if (!isPlacementValid(result, item.id, item)) continue;
    ids.add(item.id);
    result.push(item);
  }
  return result;
}
