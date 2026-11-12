import { palette } from "@/components/room/palette";
import type { FurnitureType } from "./furnitureCatalog";

export type Palette = Record<keyof typeof palette, string>;

export const STYLE_IDS = [
  "classic",
  "scandinavian",
  "japanese",
  "pastel",
  "cottagecore",
  "modern",
] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export interface FurnitureStyle {
  readonly id: StyleId;
  readonly label: string;
  readonly blurb: string;
  readonly palette: Palette;
}

const base: Palette = { ...palette };

/** 風格 = 同一批模型換一套材質配色（沒有外部 3D 資產可用） */
export const FURNITURE_STYLES: Readonly<Record<StyleId, FurnitureStyle>> = {
  classic: { id: "classic", label: "繪本原味", blurb: "預設的鼠尾草綠與暖木色", palette: base },
  scandinavian: {
    id: "scandinavian",
    label: "北歐",
    blurb: "淺木色、中性色、極簡",
    palette: {
      ...base,
      cream: "#f7f3ea", creamDeep: "#e6dfd0",
      wood: "#e3cfae", woodLight: "#efe0c5", woodDeep: "#c4a77d",
      sage: "#bcc6b4", sageDeep: "#93a08b", leaf: "#8fa88a",
      mist: "#c8cfd5", mistDeep: "#9aa6b0",
    },
  },
  japanese: {
    id: "japanese",
    label: "和風",
    blurb: "自然木色、榻榻米與抹茶色",
    palette: {
      ...base,
      cream: "#efe5cf", creamDeep: "#ddd0b0",
      wood: "#b98a5e", woodLight: "#cfa77a", woodDeep: "#8a5f3d",
      sage: "#a8ad8b", sageDeep: "#7d8461", leaf: "#8c9a6a",
      mist: "#cdbda3", mistDeep: "#a08e72",
    },
  },
  pastel: {
    id: "pastel",
    label: "粉彩夢境",
    blurb: "粉紅、淺藍、柔軟裝飾",
    palette: {
      ...base,
      cream: "#fff4f2", creamDeep: "#f6e2df",
      wood: "#f0cfc6", woodLight: "#f8e0d8", woodDeep: "#d9a9a0",
      sage: "#f4b8c8", sageDeep: "#e592ac", leaf: "#a9d8b8",
      mist: "#b9d8ee", mistDeep: "#8ebde0",
    },
  },
  cottagecore: {
    id: "cottagecore",
    label: "鄉村",
    blurb: "天然素材、植物與木質家具",
    palette: {
      ...base,
      cream: "#f4ead5", creamDeep: "#e3d5b6",
      wood: "#b5835a", woodLight: "#d0a273", woodDeep: "#855a3a",
      sage: "#9bb08a", sageDeep: "#6f8f63", leaf: "#6f9a5f",
      mist: "#d9a9b4", mistDeep: "#b9808e",
    },
  },
  modern: {
    id: "modern",
    label: "現代極簡",
    blurb: "幾何、乾淨表面、中性色",
    palette: {
      ...base,
      cream: "#f2f2f0", creamDeep: "#d8d8d4",
      wood: "#c8c0b4", woodLight: "#ddd7cd", woodDeep: "#5f5a55",
      sage: "#8f9a96", sageDeep: "#5e6a66", leaf: "#6f8a7a",
      mist: "#aab4bd", mistDeep: "#6f7b86",
    },
  },
};

export const isStyleId = (v: unknown): v is StyleId =>
  typeof v === "string" && (STYLE_IDS as readonly string[]).includes(v);

const ALL: readonly StyleId[] = STYLE_IDS;
const S = "scandinavian", J = "japanese", P = "pastel", C = "cottagecore", M = "modern";

/** 每種家具適合的風格（用於家具面板的風格篩選） */
export const STYLE_AFFINITY: Readonly<Record<FurnitureType, readonly StyleId[]>> = {
  bed: ALL, "cat-bed": ALL, desk: [S, J, C, M], "coffee-table": [S, J, P, M],
  nightstand: [S, C, P, M], chair: [S, J, C, M], stool: [S, J, P, C],
  sofa: [S, P, M], beanbag: [P, M], "cat-tree": ALL, "cat-steps": [S, P, M],
  "cat-scratcher": ALL, bookshelf: [S, J, C, M], wardrobe: [S, J, C, M],
  "floor-lamp": [S, J, P, M], plant: [S, J, C], "big-plant": [S, C, M],
  rug: [S, J, P, C], "round-rug": [S, P, C], "cat-bowl": ALL,
};
