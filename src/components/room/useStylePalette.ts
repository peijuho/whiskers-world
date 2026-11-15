import { FURNITURE_STYLES, type Palette } from "@/game/furnitureStyles";
import { useSettings } from "@/game/settingsStore";

/** 目前家具風格的配色；風格改變時所有家具即時換色。 */
export function useStylePalette(): Palette {
  return useSettings((s) => FURNITURE_STYLES[s.furnitureStyle].palette);
}
