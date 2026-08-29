export type ColorMode = "speed" | "orbit" | "spectrum" | "ember";

export type BgPreset = {
  id: string;
  label: string;
  hex: string;
};

export const BG_PRESETS: readonly BgPreset[] = [
  { id: "void", label: "Void", hex: "#07070a" },
  { id: "ink", label: "Ink", hex: "#0a1222" },
  { id: "abyss", label: "Abyss", hex: "#071411" },
  { id: "dusk", label: "Dusk", hex: "#1a1014" },
  { id: "slate", label: "Slate", hex: "#16171d" },
  { id: "paper", label: "Paper", hex: "#e8e4da" },
] as const;

export const COLOR_MODES: readonly { id: ColorMode; label: string }[] = [
  { id: "speed", label: "Speed" },
  { id: "orbit", label: "Orbit" },
  { id: "spectrum", label: "Spectrum" },
  { id: "ember", label: "Ember" },
] as const;

export const COUNT_MIN = 400;
export const COUNT_MAX = 8000;
export const COUNT_STEP = 100;
export const FORCE_MIN = 0.2;
export const FORCE_MAX = 2.5;
export const FORCE_STEP = 0.05;
export const TRAIL_MIN = 0;
export const TRAIL_MAX = 1;
export const TRAIL_STEP = 0.01;

export const DEFAULT_COUNT = 2800;
export const DEFAULT_FORCE = 1;
export const DEFAULT_TRAIL = 0.72;
export const DEFAULT_COLOR: ColorMode = "speed";
export const DEFAULT_BG = "void";

export function bgById(id: string): BgPreset {
  return BG_PRESETS.find((p) => p.id === id) ?? BG_PRESETS[0];
}

export function isLightHex(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
