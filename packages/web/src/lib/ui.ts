export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const motionSafeClass =
  "motion-safe:duration-[220ms] motion-safe:ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transform-none motion-reduce:transition-none";

export const eyebrowClass =
  "text-[0.7rem] uppercase tracking-[0.18em] text-[var(--muted)]";

export const displayTitleClass = "[font-family:Fraunces,serif] tracking-[-0.04em]";

export const panelClass =
  "rounded-[1.55rem] border border-[var(--line)] bg-[var(--paper)] p-[1.15rem] shadow-[var(--shadow)] backdrop-blur-[18px]";

export const pillClass =
  "rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-[18px]";

export const fieldLabelClass = "grid gap-[0.42rem]";

export const fieldLabelTextClass =
  "text-[0.83rem] font-semibold tracking-[0.02em] text-[var(--muted)]";

export const fieldClass =
  `w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-[0.92rem] py-[0.84rem] text-[var(--ink)] transition-[border-color,background-color,box-shadow,transform] hover:border-[var(--line-strong)] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)] ${motionSafeClass}`;

export const buttonBaseClass =
  `inline-flex items-center justify-center rounded-full border border-transparent px-[1.16rem] py-[0.88rem] transition-[transform,opacity,background-color,border-color,color,box-shadow] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 ${motionSafeClass}`;

export const primaryButtonClass =
  `${buttonBaseClass} bg-[var(--ink)] text-[var(--page-fill)] hover:shadow-[0_16px_28px_rgba(0,0,0,0.16)]`;

export const ghostButtonClass =
  `${buttonBaseClass} border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[var(--accent-soft)] text-[var(--accent)] hover:border-[color-mix(in_srgb,var(--accent)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent-soft)_78%,var(--paper-strong))]`;

export const accentButtonClass =
  `${buttonBaseClass} bg-[var(--accent)] text-[var(--accent-ink)] shadow-[var(--shadow-soft)] hover:shadow-[0_18px_32px_rgba(0,0,0,0.18)]`;
