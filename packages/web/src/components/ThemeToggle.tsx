import type { ThemeName } from "../hooks/useTheme";
import { ghostButtonClass } from "../lib/ui";

type ThemeToggleProps = {
  theme: ThemeName;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      className={ghostButtonClass}
      onClick={onToggle}
      type="button"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
