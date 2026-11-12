import { createStore } from "./createStore";

/**
 * 環境音效：全部以 Web Audio 即時合成（雨聲、風聲、室內底噪、夜間蟲鳴），
 * 沒有外部音檔，因此沒有授權問題。
 *  - 單一 AudioContext、每種聲音只建立一份音源（循環播放），只調整增益 → 不會重複疊加。
 *  - 音量變化一律用 setTargetAtTime 做平滑淡入淡出。
 *  - 瀏覽器自動播放限制：必須等第一次使用者互動才建立 / 恢復 AudioContext。
 *  - 環境音（ambient）與音樂（music）是各自獨立的匯流排，目前尚未有音樂。
 */

export interface AudioParams {
  readonly master: number;
  readonly muted: boolean;
  readonly ambient: boolean;
  readonly rainVolume: number;
  readonly rain: number;
  readonly snow: number;
  /** 0..1：夜晚程度（蟲鳴用） */
  readonly night: number;
}

export const audioStatus = createStore({ unlocked: false });

interface Nodes {
  readonly master: GainNode;
  readonly rain: GainNode;
  readonly wind: GainNode;
  readonly indoor: GainNode;
  readonly night: GainNode;
}

let ctx: AudioContext | null = null;
let nodes: Nodes | null = null;
let last: AudioParams | null = null;

type NoiseKind = "white" | "brown";
function noiseBuffer(c: AudioContext, seconds: number, kind: NoiseKind): AudioBuffer {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === "white") d[i] = w;
    else {
      lastOut = (lastOut + 0.02 * w) / 1.02;
      d[i] = lastOut * 3.5;
    }
  }
  return buf;
}

function loop(c: AudioContext, kind: NoiseKind, seconds = 4): AudioBufferSourceNode {
  const s = c.createBufferSource();
  s.buffer = noiseBuffer(c, seconds, kind);
  s.loop = true;
  s.start();
  return s;
}

function build(c: AudioContext): Nodes {
  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);
  const envBus = c.createGain(); // 環境音匯流排
  const musicBus = c.createGain(); // 音樂匯流排（預留，與環境音分離）
  envBus.connect(master);
  musicBus.connect(master);

  const chain = (src: AudioNode, nodesList: AudioNode[]) => {
    let n = src;
    for (const x of nodesList) {
      n.connect(x);
      n = x;
    }
    return n;
  };
  const gain = () => {
    const g = c.createGain();
    g.gain.value = 0;
    g.connect(envBus);
    return g;
  };

  // 雨：高頻白噪聲 + 低頻厚度
  const rain = gain();
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 700;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 7500;
  chain(loop(c, "white"), [hp, lp, rain]);
  const body = c.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.value = 1100;
  const bodyGain = c.createGain();
  bodyGain.gain.value = 0.35;
  chain(loop(c, "brown"), [body, bodyGain, rain]);

  // 風：棕噪聲帶通，濾波中心與音量被慢速 LFO 輕輕擺動
  const wind = gain();
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 380;
  bp.Q.value = 0.7;
  const windMod = c.createGain();
  windMod.gain.value = 0.7;
  chain(loop(c, "brown"), [bp, windMod, wind]);
  const lfo1 = c.createOscillator();
  lfo1.frequency.value = 0.07;
  const lfo1Gain = c.createGain();
  lfo1Gain.gain.value = 140;
  lfo1.connect(lfo1Gain).connect(bp.frequency);
  lfo1.start();
  const lfo2 = c.createOscillator();
  lfo2.frequency.value = 0.13;
  const lfo2Gain = c.createGain();
  lfo2Gain.gain.value = 0.3;
  lfo2.connect(lfo2Gain).connect(windMod.gain);
  lfo2.start();

  // 室內底噪：很低的房間聲
  const indoor = gain();
  const roomLp = c.createBiquadFilter();
  roomLp.type = "lowpass";
  roomLp.frequency.value = 200;
  chain(loop(c, "brown"), [roomLp, indoor]);

  // 夜間蟲鳴：高頻正弦被快速 LFO 切成短促的顫音
  const night = gain();
  const cricket = c.createOscillator();
  cricket.frequency.value = 4300;
  const amp = c.createGain();
  amp.gain.value = 0.5;
  const trem = c.createOscillator();
  trem.frequency.value = 9;
  const tremGain = c.createGain();
  tremGain.gain.value = 0.5;
  trem.connect(tremGain).connect(amp.gain);
  const gate = c.createGain();
  gate.gain.value = 0.5;
  const gateLfo = c.createOscillator();
  gateLfo.frequency.value = 0.35;
  const gateLfoGain = c.createGain();
  gateLfoGain.gain.value = 0.5;
  gateLfo.connect(gateLfoGain).connect(gate.gain);
  chain(cricket, [amp, gate, night]);
  cricket.start();
  trem.start();
  gateLfo.start();

  return { master, rain, wind, indoor, night };
}

function ramp(param: AudioParam, value: number, c: AudioContext, tc = 0.6) {
  param.setTargetAtTime(value, c.currentTime, tc);
}

/** 依目前狀態更新各聲音的目標音量（平滑淡入淡出） */
export function applyAudio(p: AudioParams): void {
  last = p;
  if (!ctx || !nodes) return;
  ramp(nodes.master.gain, p.muted ? 0 : p.master, ctx, 0.15);
  // 雨聲只在下雨時出現，並且有自己的音量
  ramp(nodes.rain.gain, p.rain * p.rainVolume * 0.5, ctx, 0.9);
  const windLevel = p.ambient ? 0.1 + 0.3 * p.rain + 0.18 * p.snow : 0;
  ramp(nodes.wind.gain, windLevel, ctx, 1.2);
  ramp(nodes.indoor.gain, p.ambient ? 0.05 : 0, ctx, 1.2);
  ramp(nodes.night.gain, p.ambient ? p.night * (1 - p.rain) * 0.03 : 0, ctx, 1.5);
}

/** 必須在使用者互動（點擊 / 按鍵 / 觸控）之後呼叫 */
export function unlockAudio(): void {
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    nodes = build(ctx);
  }
  if (ctx.state === "suspended") void ctx.resume();
  audioStatus.set({ unlocked: true });
  if (last) applyAudio(last);
}
