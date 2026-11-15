import type { ReactNode } from "react";

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        active ? "bg-sage text-white" : "bg-cream/70 text-ink/70 hover:bg-white/70"
      }`}
    >
      {children}
    </button>
  );
}

export function Swatch({ color, label, active, onClick }: { color: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${
        active ? "border-wood-deep ring-2 ring-wood-deep/30" : "border-white/80"
      }`}
      style={{ background: color }}
    />
  );
}

export const Label = ({ children }: { children: ReactNode }) => (
  <p className="mb-1.5 mt-3 text-xs text-ink/60 first:mt-0">{children}</p>
);
