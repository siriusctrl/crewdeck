export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const motionSafeClass =
  "motion-safe:duration-150 motion-safe:ease-out motion-reduce:transform-none motion-reduce:transition-none";

export const eyebrowClass =
  "text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]";

export const displayTitleClass = "font-semibold tracking-[-0.02em]";

export const panelClass =
  "rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4";

export const pillClass =
  "rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2";

export const fieldLabelClass = "grid gap-1.5";

export const fieldLabelTextClass =
  "text-[13px] font-medium text-[var(--muted)]";

export const fieldClass =
  `w-full rounded-md border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${motionSafeClass}`;

export const buttonBaseClass =
  `inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 ${motionSafeClass}`;

export const primaryButtonClass =
  `${buttonBaseClass} bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]`;

export const ghostButtonClass =
  `${buttonBaseClass} border-[var(--line)] bg-transparent text-[var(--ink-secondary)] hover:bg-[var(--tab-bg)] hover:text-[var(--ink)]`;

export const accentButtonClass =
  `${buttonBaseClass} bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]`;
