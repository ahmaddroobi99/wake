import { WakeCanvas } from "@/components/wake-canvas";
import { WakePanel } from "@/components/wake-panel";

export function WakeApp() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg select-none">
      <WakeCanvas />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,color-mix(in_oklab,var(--color-bg)_55%,transparent)_100%)]" />

      <header className="pointer-events-none absolute top-4 left-4 z-10 max-w-64 pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] md:top-6 md:left-6">
        <p className="font-display text-2xl leading-none font-semibold tracking-tight text-fg md:text-3xl">
          Wake
        </p>
        <p className="mt-1 text-sm text-muted">Particle field</p>
      </header>

      <div className="absolute inset-x-3 bottom-3 z-10 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] md:inset-auto md:top-6 md:right-6 md:bottom-auto">
        <WakePanel />
      </div>
    </main>
  );
}
