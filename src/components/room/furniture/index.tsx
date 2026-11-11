import type { ComponentType } from "react";
import type { FurnitureType } from "@/game/furnitureCatalog";
import { Bed } from "./Bed";
import { CatBed, CatBowl, CatScratcher, CatSteps, CatTree } from "./Cat";
import { Chair } from "./Chair";
import { BigPlant, FloorLamp, RoundRug } from "./Decor";
import { Desk } from "./Desk";
import { Plant } from "./Plant";
import { Rug } from "./Rug";
import { Beanbag, Sofa, Stool } from "./Seating";
import { Bookshelf, Wardrobe } from "./Storage";
import { CoffeeTable, Nightstand } from "./Tables";

/** 家具類型 → 3D 模型（以各自中心為原點，背面朝 -z） */
export const FURNITURE_MODELS: Readonly<Record<FurnitureType, ComponentType>> = {
  bed: Bed,
  "cat-bed": CatBed,
  desk: Desk,
  "coffee-table": CoffeeTable,
  nightstand: Nightstand,
  chair: Chair,
  stool: Stool,
  sofa: Sofa,
  beanbag: Beanbag,
  "cat-tree": CatTree,
  "cat-steps": CatSteps,
  "cat-scratcher": CatScratcher,
  bookshelf: Bookshelf,
  wardrobe: Wardrobe,
  "floor-lamp": FloorLamp,
  plant: Plant,
  "big-plant": BigPlant,
  rug: Rug,
  "round-rug": RoundRug,
  "cat-bowl": CatBowl,
};
