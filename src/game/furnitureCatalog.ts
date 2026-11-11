import { palette } from "@/components/room/palette";

export const FURNITURE_TYPES = [
  "bed",
  "cat-bed",
  "desk",
  "coffee-table",
  "nightstand",
  "chair",
  "stool",
  "sofa",
  "beanbag",
  "cat-tree",
  "cat-steps",
  "cat-scratcher",
  "bookshelf",
  "wardrobe",
  "floor-lamp",
  "plant",
  "big-plant",
  "rug",
  "round-rug",
  "cat-bowl",
] as const;
export type FurnitureType = (typeof FURNITURE_TYPES)[number];

export const CATEGORIES = [
  { id: "bed", label: "床" },
  { id: "table", label: "桌子" },
  { id: "seat", label: "椅子" },
  { id: "cat", label: "跳台" },
  { id: "storage", label: "收納" },
  { id: "decor", label: "裝飾" },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export interface FurnitureDef {
  readonly type: FurnitureType;
  readonly label: string;
  readonly category: CategoryId;
  /** 未旋轉時 x 方向寬度 */
  readonly w: number;
  /** 未旋轉時 z 方向深度 */
  readonly d: number;
  /** 地毯等貼地物件不參與碰撞 */
  readonly solid: boolean;
  /** 靠近牆時自動貼牆並讓背面朝牆 */
  readonly wall: boolean;
  readonly swatch: string;
}

const def = (
  type: FurnitureType,
  label: string,
  category: CategoryId,
  w: number,
  d: number,
  swatch: string,
  opts: { solid?: boolean; wall?: boolean } = {},
): FurnitureDef => ({
  type,
  label,
  category,
  w,
  d,
  swatch,
  solid: opts.solid ?? true,
  wall: opts.wall ?? false,
});

export const FURNITURE_CATALOG: Readonly<Record<FurnitureType, FurnitureDef>> = {
  bed: def("bed", "小床", "bed", 1.5, 2.1, palette.sage, { wall: true }),
  "cat-bed": def("cat-bed", "貓窩", "bed", 0.7, 0.7, palette.mist),
  desk: def("desk", "書桌", "table", 1.6, 0.8, palette.woodLight, { wall: true }),
  "coffee-table": def("coffee-table", "圓茶几", "table", 0.9, 0.9, palette.wood),
  nightstand: def("nightstand", "床頭櫃", "table", 0.5, 0.45, palette.woodDeep, { wall: true }),
  chair: def("chair", "椅子", "seat", 0.55, 0.55, palette.mistDeep),
  stool: def("stool", "圓凳", "seat", 0.45, 0.45, palette.sage),
  sofa: def("sofa", "沙發", "seat", 1.9, 0.9, palette.mist, { wall: true }),
  beanbag: def("beanbag", "懶骨頭", "seat", 0.9, 0.9, palette.sageDeep),
  "cat-tree": def("cat-tree", "貓跳台", "cat", 0.7, 0.7, "#d9c19a", { wall: true }),
  "cat-steps": def("cat-steps", "階梯跳台", "cat", 1.2, 0.5, palette.woodLight, { wall: true }),
  "cat-scratcher": def("cat-scratcher", "貓抓柱", "cat", 0.4, 0.4, "#d9c19a"),
  bookshelf: def("bookshelf", "書櫃", "storage", 1.0, 0.35, palette.wood, { wall: true }),
  wardrobe: def("wardrobe", "衣櫃", "storage", 1.2, 0.6, palette.creamDeep, { wall: true }),
  "floor-lamp": def("floor-lamp", "落地燈", "decor", 0.4, 0.4, palette.cream),
  plant: def("plant", "盆栽", "decor", 0.5, 0.5, palette.leaf),
  "big-plant": def("big-plant", "大型盆栽", "decor", 0.7, 0.7, palette.sageDeep),
  rug: def("rug", "橢圓地毯", "decor", 3.6, 2.5, palette.mist, { solid: false }),
  "round-rug": def("round-rug", "圓地毯", "decor", 1.6, 1.6, palette.sage, { solid: false }),
  "cat-bowl": def("cat-bowl", "貓碗", "decor", 0.4, 0.3, palette.mistDeep),
};

export const MAX_ITEMS = 24;

export function isFurnitureType(value: unknown): value is FurnitureType {
  return (
    typeof value === "string" &&
    (FURNITURE_TYPES as readonly string[]).includes(value)
  );
}
