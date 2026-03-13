import type { ThemeName } from "../hooks/useTheme";

type ThemeToggleProps = {
  theme: ThemeName;
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button className="theme-toggle" onClick={onToggle} type="button">
      <span className="theme-toggle-label">Palette</span>
      <strong>{theme === "dark" ? "Soft dark" : "Paper light"}</strong>
    </button>
  );
}
