import { useEffect, useRef } from "react";
import { WakeEngine } from "@/lib/wake/engine";
import { bgById } from "@/lib/wake/settings";
import { useWake } from "@/lib/wake/store";

export function WakeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WakeEngine | null>(null);
  const count = useWake((s) => s.count);
  const force = useWake((s) => s.force);
  const trail = useWake((s) => s.trail);
  const colorMode = useWake((s) => s.colorMode);
  const bgId = useWake((s) => s.bgId);
  const clearGen = useWake((s) => s.clearGen);
  const resetGen = useWake((s) => s.resetGen);
  const downloadGen = useWake((s) => s.downloadGen);
  const setFps = useWake((s) => s.setFps);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new WakeEngine(canvas);
    engineRef.current = engine;
    const state = useWake.getState();
    engine.configure({
      count: state.count,
      force: state.force,
      trail: state.trail,
      colorMode: state.colorMode,
      bgHex: bgById(state.bgId).hex,
    });
    engine.onFps = (fps) => setFps(Math.round(fps));
    engine.attach();
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [setFps]);

  useEffect(() => {
    engineRef.current?.configure({ count });
  }, [count]);

  useEffect(() => {
    engineRef.current?.configure({ force });
  }, [force]);

  useEffect(() => {
    engineRef.current?.configure({ trail });
  }, [trail]);

  useEffect(() => {
    engineRef.current?.configure({ colorMode });
  }, [colorMode]);

  useEffect(() => {
    engineRef.current?.configure({ bgHex: bgById(bgId).hex });
  }, [bgId]);

  useEffect(() => {
    if (clearGen === 0) return;
    engineRef.current?.clearTrails();
  }, [clearGen]);

  useEffect(() => {
    if (resetGen === 0) return;
    engineRef.current?.reseed();
  }, [resetGen]);

  useEffect(() => {
    if (downloadGen === 0) return;
    engineRef.current?.download();
  }, [downloadGen]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full cursor-none touch-none"
      aria-label="Particle field canvas"
    />
  );
}
