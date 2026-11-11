import { BufferGeometry, Color, Float32BufferAttribute } from "three";

/** 英國短毛貓的藍灰色與純白色 */
export const FUR_BLUE = "#6a84a6";
export const FUR_WHITE = "#fffdf8";

const BLUE = new Color(FUR_BLUE);
const WHITE = new Color(FUR_WHITE);
const tmp = new Color();

/** smoothstep；邊界可以反向（e0 > e1）以表示「由大到小」的漸層 */
export function smooth(e0: number, e1: number, x: number): number {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * 依頂點位置替幾何體上色：white(x, y, z) 回傳 0（藍灰）到 1（純白）。
 * 以頂點色呈現柔和的雙色分界，不需貼圖，也不增加面數。
 */
export function paintBicolor(
  geometry: BufferGeometry,
  white: (x: number, y: number, z: number) => number,
): BufferGeometry {
  const pos = geometry.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const w = Math.min(Math.max(white(pos.getX(i), pos.getY(i), pos.getZ(i)), 0), 1);
    tmp.copy(BLUE).lerp(WHITE, w);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

/* ---- 各部位的花色（座標皆為單位球 / 部位本地座標，+z 為前方）---- */

/** 頭：頭頂、耳朵、額頭藍灰；口鼻、臉頰、下巴純白，額頭中央有細細的白色鼻樑 */
export const headWhite = (x: number, y: number, z: number) => {
  const face = smooth(0.12, 0.55, -y + 0.4 * z);
  const blaze =
    smooth(0.0, 0.5, z) *
    Math.exp(-(x * x) / (2 * 0.1 * 0.1)) *
    smooth(0.5, 0.2, y);
  return Math.max(face, blaze * 0.95);
};

/** 身體：背與上側身藍灰；肚子、胸口白，白色胸襟向上漸層 */
export const bodyWhite = (x: number, y: number, z: number) => {
  const edge = -0.1 + 0.1 * z;
  const belly = smooth(edge + 0.2, edge - 0.2, y);
  const bib = smooth(0.3, 0.7, z) * smooth(0.65, 0.25, y);
  return Math.max(belly, bib);
};

/** 後腿肌肉（大腿）：上藍下白 */
export const haunchWhite = (_x: number, y: number) => smooth(-0.1, -0.8, y);

/** 腿：只有最上端帶一點藍灰，其餘都是白色 */
export const legWhite = (_x: number, y: number) => smooth(0.07, -0.02, y);
