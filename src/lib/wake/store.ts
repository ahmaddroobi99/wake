import { create } from "zustand";
import {
  DEFAULT_BG,
  DEFAULT_COLOR,
  DEFAULT_COUNT,
  DEFAULT_FORCE,
  DEFAULT_TRAIL,
  type ColorMode,
} from "./settings";

export type WakeState = {
  count: number;
  force: number;
  trail: number;
  colorMode: ColorMode;
  bgId: string;
  clearGen: number;
  resetGen: number;
  downloadGen: number;
  fps: number;
  setCount: (count: number) => void;
  setForce: (force: number) => void;
  setTrail: (trail: number) => void;
  setColorMode: (colorMode: ColorMode) => void;
  setBgId: (bgId: string) => void;
  setFps: (fps: number) => void;
  clearTrails: () => void;
  resetAll: () => void;
  requestDownload: () => void;
};

export const useWake = create<WakeState>((set) => ({
  count: DEFAULT_COUNT,
  force: DEFAULT_FORCE,
  trail: DEFAULT_TRAIL,
  colorMode: DEFAULT_COLOR,
  bgId: DEFAULT_BG,
  clearGen: 0,
  resetGen: 0,
  downloadGen: 0,
  fps: 0,
  setCount: (count) => set({ count }),
  setForce: (force) => set({ force }),
  setTrail: (trail) => set({ trail }),
  setColorMode: (colorMode) => set({ colorMode }),
  setBgId: (bgId) => set({ bgId }),
  setFps: (fps) => set({ fps }),
  clearTrails: () => set((s) => ({ clearGen: s.clearGen + 1 })),
  resetAll: () =>
    set((s) => ({
      count: DEFAULT_COUNT,
      force: DEFAULT_FORCE,
      trail: DEFAULT_TRAIL,
      colorMode: DEFAULT_COLOR,
      bgId: DEFAULT_BG,
      clearGen: s.clearGen + 1,
      resetGen: s.resetGen + 1,
    })),
  requestDownload: () => set((s) => ({ downloadGen: s.downloadGen + 1 })),
}));
