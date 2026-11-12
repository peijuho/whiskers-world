import { FURNITURE_CATALOG } from "./furnitureCatalog";
import { footprint, ROOM, type PlacedItemData } from "./layout";

/** 小貓走路用的格線導航：實體家具是障礙，A* 找路，再把路徑拉直。 */

export const CELL = 0.25;
export const COLS = Math.round((ROOM.maxX - ROOM.minX) / CELL);
export const ROWS = Math.round((ROOM.maxZ - ROOM.minZ) / CELL);
/** 貓咪身體半徑：障礙往外多留一點 */
const MARGIN = 0.1;

export interface Vec2 {
  readonly x: number;
  readonly z: number;
}

export type Grid = Uint8Array;

export function buildGrid(items: readonly PlacedItemData[]): Grid {
  const g = new Uint8Array(COLS * ROWS);
  for (const item of items) {
    if (!FURNITURE_CATALOG[item.type].solid) continue;
    const f = footprint(item.type, item.rot);
    const x0 = item.x - f.w / 2 - MARGIN;
    const x1 = item.x + f.w / 2 + MARGIN;
    const z0 = item.z - f.d / 2 - MARGIN;
    const z1 = item.z + f.d / 2 + MARGIN;
    for (let r = 0; r < ROWS; r++) {
      const cz = ROOM.minZ + (r + 0.5) * CELL;
      if (cz < z0 || cz > z1) continue;
      for (let c = 0; c < COLS; c++) {
        const cx = ROOM.minX + (c + 0.5) * CELL;
        if (cx >= x0 && cx <= x1) g[r * COLS + c] = 1;
      }
    }
  }
  return g;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const colOf = (x: number) => clamp(Math.floor((x - ROOM.minX) / CELL), 0, COLS - 1);
const rowOf = (z: number) => clamp(Math.floor((z - ROOM.minZ) / CELL), 0, ROWS - 1);
const centerX = (c: number) => ROOM.minX + (c + 0.5) * CELL;
const centerZ = (r: number) => ROOM.minZ + (r + 0.5) * CELL;

export const isFree = (g: Grid, x: number, z: number) =>
  x >= ROOM.minX && x <= ROOM.maxX && z >= ROOM.minZ && z <= ROOM.maxZ && g[rowOf(z) * COLS + colOf(x)] === 0;

function lineClear(g: Grid, a: Vec2, b: Vec2): boolean {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.08);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (!isFree(g, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

/** 最近的空格中心（用於家具被移走、貓咪需要落地時） */
export function nearestFree(g: Grid, x: number, z: number): Vec2 {
  const c0 = colOf(x);
  const r0 = rowOf(z);
  let best: Vec2 | null = null;
  let bestD = Infinity;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r * COLS + c]) continue;
      const d = (c - c0) ** 2 + (r - r0) ** 2;
      if (d < bestD) {
        bestD = d;
        best = { x: centerX(c), z: centerZ(r) };
      }
    }
  }
  return best ?? { x: 0, z: 1.5 };
}

/** 在 maxDist 範圍內找離 (x,z) 最近的空格中心；已經是空格就直接回傳原點。 */
export function nearestFreeWithin(g: Grid, x: number, z: number, maxDist: number): Vec2 | null {
  if (isFree(g, x, z)) return { x, z };
  let best: Vec2 | null = null;
  let bestD = maxDist * maxDist;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r * COLS + c]) continue;
      const cx = centerX(c);
      const cz = centerZ(r);
      const d = (cx - x) ** 2 + (cz - z) ** 2;
      if (d <= bestD) {
        bestD = d;
        best = { x: cx, z: cz };
      }
    }
  }
  return best;
}

/** A* 找路；起點即使被家具圍住也允許離開；終點必須是空格。回傳拉直後的路徑點（不含起點）。 */
export function findPath(g: Grid, from: Vec2, to: Vec2): Vec2[] | null {
  if (!isFree(g, to.x, to.z)) return null;
  const sc = colOf(from.x);
  const sr = rowOf(from.z);
  const gc = colOf(to.x);
  const gr = rowOf(to.z);
  const N = COLS * ROWS;
  const cost = new Float32Array(N).fill(Infinity);
  const prev = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const open: number[] = [];
  const start = sr * COLS + sc;
  const goal = gr * COLS + gc;
  const h = (i: number) => Math.hypot((i % COLS) - gc, Math.floor(i / COLS) - gr);
  cost[start] = 0;
  open.push(start);
  while (open.length > 0) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      if (cost[open[i]] + h(open[i]) < cost[open[bi]] + h(open[bi])) bi = i;
    }
    const cur = open.splice(bi, 1)[0];
    if (cur === goal) break;
    closed[cur] = 1;
    const cc = cur % COLS;
    const cr = Math.floor(cur / COLS);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dc === 0 && dr === 0) continue;
        const nc = cc + dc;
        const nr = cr + dr;
        if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
        const ni = nr * COLS + nc;
        if (closed[ni] || (g[ni] && ni !== goal)) continue;
        if (dc !== 0 && dr !== 0 && (g[cr * COLS + nc] || g[nr * COLS + cc])) continue; // 不切角
        const nc2 = cost[cur] + (dc !== 0 && dr !== 0 ? 1.414 : 1);
        if (nc2 < cost[ni]) {
          cost[ni] = nc2;
          prev[ni] = cur;
          if (!open.includes(ni)) open.push(ni);
        }
      }
    }
  }
  if (!Number.isFinite(cost[goal])) return null;
  const cells: Vec2[] = [];
  for (let i = goal; i !== -1 && i !== start; i = prev[i]) {
    cells.push({ x: centerX(i % COLS), z: centerZ(Math.floor(i / COLS)) });
  }
  cells.reverse();
  if (cells.length > 0) cells[cells.length - 1] = { x: to.x, z: to.z };
  else cells.push({ x: to.x, z: to.z });
  // 拉直：從目前點盡量直接連到最遠的可視點
  const out: Vec2[] = [];
  let anchor: Vec2 = from;
  let i = 0;
  while (i < cells.length) {
    let j = cells.length - 1;
    while (j > i && !lineClear(g, anchor, cells[j])) j--;
    out.push(cells[j]);
    anchor = cells[j];
    i = j + 1;
  }
  return out;
}
