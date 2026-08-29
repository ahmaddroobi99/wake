import { type ColorMode } from "./settings";

const MAX = 8000;
const WAVE_CAP = 10;

type Wave = {
  x: number;
  y: number;
  r: number;
  vr: number;
  life: number;
  max: number;
};

export type EngineConfig = {
  count: number;
  force: number;
  trail: number;
  colorMode: ColorMode;
  bgHex: string;
};

export class WakeEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private raf = 0;
  private running = false;
  private last = 0;
  private dpr = 1;
  w = 0;
  h = 0;

  private x = new Float32Array(MAX);
  private y = new Float32Array(MAX);
  private vx = new Float32Array(MAX);
  private vy = new Float32Array(MAX);
  private size = new Float32Array(MAX);
  private seed = new Float32Array(MAX);
  private n = 0;

  private px = 0;
  private py = 0;
  private spx = 0;
  private spy = 0;
  private pvx = 0;
  private pvy = 0;
  private hasPointer = false;
  private down = false;
  private t = 0;
  private hueShift = 0;

  private waves: Wave[] = [];
  private waveI = 0;

  private count = 2800;
  private force = 1;
  private trail = 0.72;
  private colorMode: ColorMode = "speed";
  private bgHex = "#07070a";
  private light = false;
  private bgR = 7;
  private bgG = 7;
  private bgB = 10;

  private fps = 60;
  private fpsAccum = 0;
  private fpsFrames = 0;
  onFps?: (fps: number) => void;

  private ro: ResizeObserver | null = null;
  private unbind: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.ctx = ctx;
    for (let i = 0; i < WAVE_CAP; i++) {
      this.waves.push({ x: 0, y: 0, r: 0, vr: 0, life: 0, max: 0 });
    }
  }

  configure(cfg: Partial<EngineConfig>) {
    if (cfg.count !== undefined) this.setCount(cfg.count);
    if (cfg.force !== undefined) this.force = cfg.force;
    if (cfg.trail !== undefined) this.trail = cfg.trail;
    if (cfg.colorMode !== undefined) this.colorMode = cfg.colorMode;
    if (cfg.bgHex !== undefined) this.setBackground(cfg.bgHex);
  }

  setCount(n: number) {
    const next = Math.max(1, Math.min(MAX, Math.round(n)));
    if (next > this.n) {
      for (let i = this.n; i < next; i++) this.spawn(i);
    }
    this.n = next;
    this.count = next;
  }

  setBackground(hex: string) {
    this.bgHex = hex;
    this.light = isLight(hex);
    const v = parseInt(hex.slice(1), 16);
    this.bgR = (v >> 16) & 255;
    this.bgG = (v >> 8) & 255;
    this.bgB = v & 255;
    this.paintOpaque();
  }

  attach() {
    this.resize();
    this.reseed();
    this.paintOpaque();

    const parent = this.canvas.parentElement ?? this.canvas;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(parent);

    const onMove = (e: PointerEvent) => this.pointer(e, false);
    const onDown = (e: PointerEvent) => {
      this.canvas.setPointerCapture(e.pointerId);
      this.pointer(e, true);
      this.burst();
    };
    const onUp = (e: PointerEvent) => {
      this.down = false;
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };
    const onLeave = () => {
      this.down = false;
    };

    this.canvas.addEventListener("pointermove", onMove);
    this.canvas.addEventListener("pointerdown", onDown);
    this.canvas.addEventListener("pointerup", onUp);
    this.canvas.addEventListener("pointercancel", onUp);
    this.canvas.addEventListener("pointerleave", onLeave);
    this.unbind.push(
      () => this.canvas.removeEventListener("pointermove", onMove),
      () => this.canvas.removeEventListener("pointerdown", onDown),
      () => this.canvas.removeEventListener("pointerup", onUp),
      () => this.canvas.removeEventListener("pointercancel", onUp),
      () => this.canvas.removeEventListener("pointerleave", onLeave),
    );
  }

  start() {
    if (this.running) return;
    this.running = true;
    for (let i = 0; i < 50; i++) this.step(1 / 60);
    this.draw();
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.step(dt);
      this.draw();
      this.fpsAccum += dt;
      this.fpsFrames += 1;
      if (this.fpsAccum >= 0.4) {
        this.fps = this.fpsFrames / this.fpsAccum;
        this.fpsAccum = 0;
        this.fpsFrames = 0;
        this.onFps?.(this.fps);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    this.ro?.disconnect();
    this.ro = null;
    for (const off of this.unbind) off();
    this.unbind = [];
  }

  clearTrails() {
    this.paintOpaque();
  }

  reseed() {
    for (let i = 0; i < this.count; i++) this.spawn(i);
    this.n = this.count;
    this.paintOpaque();
  }

  download(filename = `wake-${stamp()}.png`) {
    const a = document.createElement("a");
    a.href = this.canvas.toDataURL("image/png");
    a.download = filename;
    a.click();
  }

  private spawn(i: number) {
    const cx = this.w * 0.5;
    const cy = this.h * 0.5;
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.sqrt(Math.random()) * Math.min(this.w, this.h) * 0.46;
    this.x[i] = cx + Math.cos(ang) * rad;
    this.y[i] = cy + Math.sin(ang) * rad;
    const orbit = 120 + Math.random() * 180;
    this.vx[i] = -Math.sin(ang) * orbit + (Math.random() - 0.5) * 20;
    this.vy[i] = Math.cos(ang) * orbit + (Math.random() - 0.5) * 20;
    this.size[i] = 0.7 + Math.random() * 2.1;
    this.seed[i] = Math.random();
  }

  private resize() {
    const parent = this.canvas.parentElement ?? this.canvas;
    const rect = parent.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const need = this.w !== cssW || this.h !== cssH || this.dpr !== dpr;
    if (!need) return;
    this.w = cssW;
    this.h = cssH;
    this.dpr = dpr;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.hasPointer) {
      this.px = cssW * 0.5;
      this.py = cssH * 0.5;
      this.spx = this.px;
      this.spy = this.py;
    }
    this.paintOpaque();
  }

  private pointer(e: PointerEvent, down: boolean) {
    const rect = this.canvas.getBoundingClientRect();
    this.px = e.clientX - rect.left;
    this.py = e.clientY - rect.top;
    this.hasPointer = true;
    if (down) this.down = true;
  }

  private burst() {
    const w = this.waves[this.waveI % WAVE_CAP];
    this.waveI += 1;
    w.x = this.px;
    w.y = this.py;
    w.r = 8;
    w.vr = 560;
    w.life = 1;
    w.max = 240 + this.force * 90;

    const reach = 260;
    const impulse = 720 * this.force;
    for (let i = 0; i < this.n; i++) {
      const dx = this.x[i] - this.px;
      const dy = this.y[i] - this.py;
      const d2 = dx * dx + dy * dy;
      if (d2 > reach * reach || d2 < 0.01) continue;
      const d = Math.sqrt(d2);
      const fall = 1 - d / reach;
      const k = impulse * fall * fall;
      this.vx[i] += (dx / d) * k;
      this.vy[i] += (dy / d) * k;
    }
  }

  private step(dt: number) {
    this.t += dt;
    this.hueShift += dt * 18;

    const follow = 1 - Math.exp(-26 * dt);
    const prevSx = this.spx;
    const prevSy = this.spy;
    this.spx += (this.px - this.spx) * follow;
    this.spy += (this.py - this.spy) * follow;
    const invDt = dt > 0.0001 ? 1 / dt : 0;
    this.pvx = (this.spx - prevSx) * invDt;
    this.pvy = (this.spy - prevSy) * invDt;
    const pSp2 = this.pvx * this.pvx + this.pvy * this.pvy;
    if (pSp2 > 2800 * 2800) {
      const s = 2800 / Math.sqrt(pSp2);
      this.pvx *= s;
      this.pvy *= s;
    }

    const force = this.force * (this.down ? 1.75 : 1);
    const hold = this.down ? 1.3 : 1;
    const tx = this.spx;
    const ty = this.spy;
    const damp = Math.exp(-1.28 * dt);
    const maxSp = 1600 * Math.max(0.5, this.force);
    const maxSp2 = maxSp * maxSp;
    const windX = Math.sin(this.t * 0.31) * 14;
    const windY = Math.cos(this.t * 0.23) * 11;
    const dragK = 1 - Math.exp(-8 * dt);
    const n = this.n;
    const x = this.x;
    const y = this.y;
    const vx = this.vx;
    const vy = this.vy;

    for (let i = 0; i < n; i++) {
      const dx = tx - x[i];
      const dy = ty - y[i];
      const d = Math.sqrt(dx * dx + dy * dy) + 0.0008;
      const inv = 1 / d;
      const nx = dx * inv;
      const ny = dy * inv;
      const dSafe = Math.max(28, d);

      const pull = force * (380 + 64000 / dSafe);
      const spin = force * (160 + 30000 / dSafe) * hold;

      vx[i] += (nx * pull + -ny * spin + windX) * dt;
      vy[i] += (ny * pull + nx * spin + windY) * dt;

      const near = Math.exp(-d / 95);
      vx[i] += (this.pvx - vx[i]) * near * dragK;
      vy[i] += (this.pvy - vy[i]) * near * dragK;

      vx[i] *= damp;
      vy[i] *= damp;

      const sp2 = vx[i] * vx[i] + vy[i] * vy[i];
      if (sp2 > maxSp2) {
        const s = maxSp / Math.sqrt(sp2);
        vx[i] *= s;
        vy[i] *= s;
      }

      x[i] += vx[i] * dt;
      y[i] += vy[i] * dt;
    }

    for (let i = 0; i < WAVE_CAP; i++) {
      const w = this.waves[i];
      if (w.life <= 0) continue;
      w.r += w.vr * dt;
      w.life -= dt * 1.35;
      if (w.r > w.max) w.life = 0;
    }
  }

  private paintOpaque() {
    const { ctx, w, h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.bgHex;
    ctx.fillRect(0, 0, w, h);
  }

  private draw() {
    const { ctx, w, h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const fade = 0.04 + 0.96 * (1 - this.trail) * (1 - this.trail);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${this.bgR},${this.bgG},${this.bgB},${fade.toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);

    if (!this.light) {
      ctx.globalCompositeOperation = "lighter";
    }

    const mode = this.colorMode;
    const n = this.n;
    const x = this.x;
    const y = this.y;
    const vx = this.vx;
    const vy = this.vy;
    const size = this.size;
    const seed = this.seed;
    const tx = this.spx;
    const ty = this.spy;
    const shift = this.hueShift;
    const lightBg = this.light;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - tx;
      const dy = y[i] - ty;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
      const nt = Math.min(1, sp / 720);
      let hue = 175;
      let sat = 72;
      let lit = 62;

      if (mode === "speed") {
        hue = 178 - 145 * nt + seed[i] * 10;
        sat = 68 + 22 * nt;
        lit = 58 + 20 * nt;
      } else if (mode === "orbit") {
        hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360 + shift * 0.4) % 360;
        sat = 70;
        lit = 56 + 16 * nt;
      } else if (mode === "spectrum") {
        hue = (shift + seed[i] * 360 + dist * 0.12) % 360;
        sat = 64;
        lit = 58 + 12 * nt;
      } else {
        const near = 1 - Math.min(1, dist / 380);
        hue = 22 + 14 * near + nt * 18 + seed[i] * 8;
        sat = 78 - 10 * near;
        lit = 48 + 28 * near + 10 * nt;
      }

      if (lightBg) {
        sat = Math.min(sat, 55);
        lit = 28 + nt * 14;
      }

      const s = size[i] * (0.85 + nt * 1.15);
      const px = x[i];
      const py = y[i];
      ctx.fillStyle = `hsla(${hue.toFixed(1)},${sat.toFixed(0)}%,${lit.toFixed(0)}%,0.32)`;
      ctx.fillRect(px - s * 2.2, py - s * 2.2, s * 4.4, s * 4.4);
      ctx.fillStyle = `hsla(${hue.toFixed(1)},${sat.toFixed(0)}%,${Math.min(94, lit + 18).toFixed(0)}%,0.98)`;
      ctx.fillRect(px - s * 0.6, py - s * 0.6, s * 1.2, s * 1.2);
    }

    ctx.globalCompositeOperation = "source-over";

    if (this.hasPointer) {
      const glowR = this.down ? 150 : 110;
      const g = ctx.createRadialGradient(
        this.px,
        this.py,
        0,
        this.px,
        this.py,
        glowR,
      );
      if (lightBg) {
        g.addColorStop(0, "rgba(20,24,28,0.10)");
        g.addColorStop(0.45, "rgba(20,24,28,0.04)");
        g.addColorStop(1, "rgba(20,24,28,0)");
      } else {
        g.addColorStop(0, "rgba(232,236,228,0.16)");
        g.addColorStop(0.35, "rgba(126,200,196,0.07)");
        g.addColorStop(1, "rgba(0,0,0,0)");
      }
      ctx.fillStyle = g;
      ctx.fillRect(this.px - glowR, this.py - glowR, glowR * 2, glowR * 2);

      ctx.beginPath();
      ctx.arc(this.px, this.py, this.down ? 3.4 : 2.2, 0, Math.PI * 2);
      ctx.fillStyle = lightBg ? "rgba(20,24,28,0.55)" : "rgba(236,236,232,0.85)";
      ctx.fill();
    }

    for (let i = 0; i < WAVE_CAP; i++) {
      const wv = this.waves[i];
      if (wv.life <= 0) continue;
      ctx.beginPath();
      ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2);
      const a = Math.max(0, wv.life);
      ctx.strokeStyle = lightBg
        ? `rgba(20,24,28,${(a * 0.35).toFixed(3)})`
        : `rgba(236,236,232,${(a * 0.45).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
