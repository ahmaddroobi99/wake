import { useEffect, useState } from "react";
import {
  ChevronDown,
  Download,
  Eraser,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  BG_PRESETS,
  COLOR_MODES,
  COUNT_MAX,
  COUNT_MIN,
  COUNT_STEP,
  FORCE_MAX,
  FORCE_MIN,
  FORCE_STEP,
  TRAIL_MAX,
  TRAIL_MIN,
  TRAIL_STEP,
} from "@/lib/wake/settings";
import { useWake } from "@/lib/wake/store";

export function WakePanel() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  }, []);
  const count = useWake((s) => s.count);
  const force = useWake((s) => s.force);
  const trail = useWake((s) => s.trail);
  const colorMode = useWake((s) => s.colorMode);
  const bgId = useWake((s) => s.bgId);
  const fps = useWake((s) => s.fps);
  const setCount = useWake((s) => s.setCount);
  const setForce = useWake((s) => s.setForce);
  const setTrail = useWake((s) => s.setTrail);
  const setColorMode = useWake((s) => s.setColorMode);
  const setBgId = useWake((s) => s.setBgId);
  const clearTrails = useWake((s) => s.clearTrails);
  const resetAll = useWake((s) => s.resetAll);
  const requestDownload = useWake((s) => s.requestDownload);

  return (
    <aside
      className={cn(
        "pointer-events-auto w-full max-w-none rounded-xl border border-border bg-surface/92 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:w-80",
        "transition-[transform,opacity] duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted">
          <SlidersHorizontal className="size-4" />
          <span className="text-sm font-medium text-fg">Controls</span>
        </div>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-secondary hover:text-fg"
          aria-expanded={open}
          aria-label={open ? "Collapse controls" : "Expand controls"}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)]",
              open ? "rotate-0" : "-rotate-90",
            )}
          />
        </button>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="mt-2 text-sm leading-snug text-muted">
            Move to swirl. Click to burst. Hold for a tighter pull.
          </p>

          <div className="mt-4 flex flex-col gap-4">
            <FieldSlider
              label="Particles"
              valueLabel={count.toLocaleString()}
              min={COUNT_MIN}
              max={COUNT_MAX}
              step={COUNT_STEP}
              value={count}
              onChange={setCount}
            />
            <FieldSlider
              label="Force"
              valueLabel={force.toFixed(2)}
              min={FORCE_MIN}
              max={FORCE_MAX}
              step={FORCE_STEP}
              value={force}
              onChange={setForce}
            />
            <FieldSlider
              label="Trails"
              valueLabel={`${Math.round(trail * 100)}%`}
              min={TRAIL_MIN}
              max={TRAIL_MAX}
              step={TRAIL_STEP}
              value={trail}
              onChange={setTrail}
            />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
              Background
            </p>
            <div className="flex flex-wrap gap-2">
              {BG_PRESETS.map((preset) => {
                const active = preset.id === bgId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-label={preset.label}
                    aria-pressed={active}
                    title={preset.label}
                    onClick={() => setBgId(preset.id)}
                    className={cn(
                      "size-11 rounded-md border transition-[transform,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                      active
                        ? "border-primary ring-2 ring-ring/50"
                        : "border-border hover:border-muted",
                    )}
                    style={{ backgroundColor: preset.hex }}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
              Color
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_MODES.map((mode) => {
                const active = mode.id === colorMode;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setColorMode(mode.id)}
                    className={cn(
                      "h-11 rounded-md border text-sm font-medium transition-[background-color,color,border-color] duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-muted hover:text-fg hover:bg-secondary",
                    )}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={cn("mt-4 grid grid-cols-3 gap-2", !open && "mt-3")}>
        <Button variant="outline" size="sm" onClick={clearTrails} className="px-2">
          <Eraser />
          Clear
        </Button>
        <Button variant="outline" size="sm" onClick={resetAll} className="px-2">
          <RotateCcw />
          Reset
        </Button>
        <Button size="sm" onClick={requestDownload} className="px-2">
          <Download />
          Save
        </Button>
      </div>

      {open && fps > 0 ? (
        <p className="mt-3 font-mono text-xs tabular-nums text-subtle">
          {fps} fps · {count.toLocaleString()} motes
        </p>
      ) : null}
    </aside>
  );
}

function FieldSlider({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = `wake-${label.toLowerCase()}`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        <span className="font-mono text-xs tabular-nums text-muted">{valueLabel}</span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => {
          const next = v[0];
          if (typeof next === "number") onChange(next);
        }}
        aria-label={label}
      />
    </div>
  );
}
