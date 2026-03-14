import type { ThemeName } from "../hooks/useTheme";
import { buttonBaseClass, cn, eyebrowClass } from "../lib/ui";

type ThemeToggleProps = {
  theme: ThemeName;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      className={cn(
        buttonBaseClass,
        "min-w-[9.6rem] flex-col items-start gap-[0.24rem] rounded-2xl border-[var(--line)] bg-[var(--paper-strong)] px-3 py-[0.7rem] text-left text-[var(--ink)] shadow-[var(--shadow-soft)] backdrop-blur-[18px] hover:border-[var(--line-strong)] hover:shadow-[0_16px_28px_rgba(0,0,0,0.16)]",
      )}
      onClick={onToggle}
      type="button"
    >
      <span className={eyebrowClass}>Palette</span>
      <strong>{theme === "dark" ? "Soft dark" : "Paper light"}</strong>
    </button>
  );
}
