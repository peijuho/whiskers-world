import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { FloorStyleId } from "@/game/roomTheme";

/** 以 canvas 即時繪製的小型貼圖（無外部資源）。僅限瀏覽器端呼叫。 */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.min(255, Math.max(0, Math.round(c + amt * 255)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function make(canvas: HTMLCanvasElement, repeat = false): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

/** 地板：6m × 5m，256px/m；畫布上緣 = 後牆側 */
export function makeFloorTexture(style: FloorStyleId, color: string): CanvasTexture {
  const PX = 256;
  const c = document.createElement("canvas");
  c.width = 6 * PX;
  c.height = 5 * PX;
  const g = c.getContext("2d");
  if (!g) return make(c);
  const rand = rng(style.length * 977 + color.charCodeAt(1) * 31);

  g.fillStyle = shade(color, -0.12);
  g.fillRect(0, 0, c.width, c.height);

  if (style === "wood" || style === "light-wood") {
    const rowH = PX / 2;
    for (let r = 0; r < 10; r++) {
      let x = -rand() * PX * 1.5;
      while (x < c.width) {
        const len = PX * (1.3 + rand() * 1.2);
        g.fillStyle = shade(color, (rand() - 0.5) * 0.09);
        g.fillRect(x + 2, r * rowH + 2, len - 4, rowH - 4);
        g.strokeStyle = shade(color, -0.07);
        g.globalAlpha = 0.35;
        g.lineWidth = 1.2;
        for (let k = 0; k < 3; k++) {
          const y = r * rowH + 8 + rand() * (rowH - 16);
          g.beginPath();
          g.moveTo(x + 6, y);
          g.lineTo(x + len - 6, y + (rand() - 0.5) * 3);
          g.stroke();
        }
        g.globalAlpha = 1;
        x += len;
      }
    }
  } else if (style === "stone") {
    const T = PX / 2;
    for (let r = 0; r < 10; r++) {
      for (let col = 0; col < 12; col++) {
        g.fillStyle = shade(color, (rand() - 0.5) * 0.07);
        g.fillRect(col * T + 3, r * T + 3, T - 6, T - 6);
        g.fillStyle = "rgba(255,255,255,0.06)";
        g.fillRect(col * T + 3, r * T + 3, T - 6, 6);
      }
    }
  } else {
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 40000; i++) {
      g.fillStyle = shade(color, (rand() - 0.5) * 0.12);
      g.fillRect(rand() * c.width, rand() * c.height, 2, 2);
    }
  }
  return make(c);
}

/** 牆面貼圖（可重複拼貼）；paint 不需要貼圖 */
export function makeWallTexture(kind: "plaster" | "wallpaper"): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  if (!g) return make(c, true);
  const rand = rng(kind === "plaster" ? 11 : 23);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);
  if (kind === "plaster") {
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = `rgba(${rand() > 0.5 ? "120,110,100" : "255,255,255"},${0.012 + rand() * 0.022})`;
      g.beginPath();
      g.arc(rand() * 256, rand() * 256, 2 + rand() * 9, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    for (let x = 0; x < 256; x += 64) {
      g.fillStyle = "#ececec";
      g.fillRect(x + 32, 0, 32, 256);
    }
    g.fillStyle = "rgba(0,0,0,0.05)";
    for (let y = 8; y < 256; y += 32) for (let x = 16; x < 256; x += 64) g.fillRect(x, y, 3, 3);
  }
  return make(c, true);
}
