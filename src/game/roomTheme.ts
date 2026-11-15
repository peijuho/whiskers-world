/** 牆面與地板的預設選項（純資料） */

export const WALL_COLORS = [
  { id: "sage-green", label: "鼠尾草綠", upper: "#f6efe0", lower: "#a9b8a0" },
  { id: "warm-cream", label: "暖奶油", upper: "#f8f0e0", lower: "#ead9b8" },
  { id: "pastel-blue", label: "粉彩藍", upper: "#eaf1f6", lower: "#aebfcc" },
  { id: "soft-pink", label: "柔粉紅", upper: "#fbefee", lower: "#e8bdc0" },
  { id: "light-beige", label: "淺米色", upper: "#f1e8d8", lower: "#d3bf9f" },
  { id: "lavender", label: "薰衣草", upper: "#f1edf7", lower: "#bfb3d6" },
] as const;
export type WallColorId = (typeof WALL_COLORS)[number]["id"];

export const WALL_MATERIALS = [
  { id: "paint", label: "霧面塗漆" },
  { id: "plaster", label: "灰泥" },
  { id: "wallpaper", label: "條紋壁紙" },
] as const;
export type WallMaterialId = (typeof WALL_MATERIALS)[number]["id"];

export const WALL_STYLES = [
  { id: "two-tone", label: "雙色護牆" },
  { id: "plain", label: "純色" },
] as const;
export type WallStyleId = (typeof WALL_STYLES)[number]["id"];

export const FLOOR_STYLES = [
  { id: "wood", label: "木地板" },
  { id: "light-wood", label: "淺木" },
  { id: "stone", label: "石材" },
  { id: "carpet", label: "軟地毯" },
] as const;
export type FloorStyleId = (typeof FLOOR_STYLES)[number]["id"];

/** 每種地板 3 個色調（[0] 為預設） */
export const FLOOR_TONES: Readonly<
  Record<FloorStyleId, readonly { readonly label: string; readonly color: string }[]>
> = {
  wood: [
    { label: "暖木", color: "#c9a27a" },
    { label: "蜜糖", color: "#b98f66" },
    { label: "淺暖", color: "#d6b390" },
  ],
  "light-wood": [
    { label: "樺木", color: "#e6cfa8" },
    { label: "奶茶", color: "#dcc29a" },
    { label: "白橡", color: "#efdcb9" },
  ],
  stone: [
    { label: "暖灰", color: "#cfc8bd" },
    { label: "冷灰", color: "#b9bec2" },
    { label: "沙色", color: "#d9cfc0" },
  ],
  carpet: [
    { label: "燕麥", color: "#d8cbb6" },
    { label: "鼠尾草", color: "#b9c4ae" },
    { label: "霧藍", color: "#c3d0dc" },
  ],
};

const has = <T extends { id: string }>(list: readonly T[], v: unknown): v is T["id"] =>
  typeof v === "string" && list.some((x) => x.id === v);
export const isWallColor = (v: unknown): v is WallColorId => has(WALL_COLORS, v);
export const isWallMaterial = (v: unknown): v is WallMaterialId => has(WALL_MATERIALS, v);
export const isWallStyle = (v: unknown): v is WallStyleId => has(WALL_STYLES, v);
export const isFloorStyle = (v: unknown): v is FloorStyleId => has(FLOOR_STYLES, v);
