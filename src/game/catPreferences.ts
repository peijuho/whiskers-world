import type { CatActivity } from "./catInteractions";

/**
 * 小貓的時段偏好：只是「傾向」，不是行程表。
 * 每個活動在每個時段有一個權重倍率，乘進 decide() 的隨機抽選；
 * 所有倍率都大於 0（貓咪晚上也可能玩一下、白天也可能打盹），
 * 玩家的呼喚 / 撫摸則永遠優先，不受偏好影響。
 * 時段之間用平滑插值，不會在整點突然改變個性。
 */
export type PreferredActivity = CatActivity | "wander";

type Weights = Readonly<Record<PreferredActivity, number>>;

const W = (w: Partial<Weights>): Weights => ({
  sleep: 1, sit: 1, watch: 1, play: 1, scratch: 1, eat: 1, groom: 1, perch: 1, wander: 1,
  ...w,
});

/** 各時段「中心點」的偏好（小時, 權重）；中間以平滑曲線插值，首尾相接成 24 小時循環。 */
const KEYS: readonly { readonly hour: number; readonly w: Weights }[] = [
  // 深夜：睡覺為主，偶爾走走
  { hour: 1, w: W({ sleep: 3.5, sit: 0.5, watch: 0.4, play: 0.3, scratch: 0.3, eat: 0.4, groom: 0.7, perch: 0.5, wander: 0.35 }) },
  // 清晨～早上：愛趴窗邊曬太陽、看外面
  { hour: 8.5, w: W({ sleep: 0.5, watch: 2.4, perch: 1.5, eat: 1.5, wander: 1.2 }) },
  // 下午：精神最好，玩耍、磨爪子
  { hour: 14.5, w: W({ sleep: 0.6, play: 2.4, scratch: 1.7, wander: 1.4, watch: 0.8 }) },
  // 黃昏：理毛、看夕陽
  { hour: 18, w: W({ sleep: 0.7, groom: 2.8, watch: 1.5, play: 0.8 }) },
  // 傍晚～夜間：回到床 / 貓窩睡覺
  { hour: 21.5, w: W({ sleep: 2.4, sit: 1.2, groom: 1.2, play: 0.5, scratch: 0.5, wander: 0.6 }) },
];

const smooth = (t: number) => t * t * (3 - 2 * t);

export function preferenceWeight(activity: PreferredActivity, hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  const n = KEYS.length;
  for (let i = 0; i < n; i++) {
    const a = KEYS[i];
    const b = KEYS[(i + 1) % n];
    const aH = a.hour;
    const bH = i + 1 < n ? b.hour : b.hour + 24;
    const hh = h < KEYS[0].hour ? h + 24 : h;
    if (hh >= aH && hh < bH) {
      const t = smooth((hh - aH) / (bH - aH));
      return a.w[activity] + (b.w[activity] - a.w[activity]) * t;
    }
  }
  return 1;
}
