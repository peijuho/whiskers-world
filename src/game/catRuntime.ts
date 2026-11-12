import { createStore } from "./createStore";
import { createBrain } from "./catBrain";

/** 唯一一隻小貓的執行期狀態（每幀由 CatController 更新，不放進 React state）。 */
export const brain = createBrain();

/** 給 HUD 顯示的低頻資訊：只有行為改變時才更新，不會造成每幀重繪。 */
export const catStatus = createStore({ label: "發呆中", state: "idle" as string });

export function publishCatStatus() {
  const s = catStatus.get();
  if (s.label !== brain.label || s.state !== brain.state) {
    catStatus.set({ label: brain.label, state: brain.state });
  }
}
