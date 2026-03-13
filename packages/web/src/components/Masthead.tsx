import type { ThemeName } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";

type MastheadProps = {
  title: string;
  cardsCount: number;
  agentsCount: number;
  theme: ThemeName;
  onToggleTheme: () => void;
};

export function Masthead({
  title,
  cardsCount,
  agentsCount,
  theme,
  onToggleTheme,
}: MastheadProps) {
  return (
    <section className="masthead">
      <div className="masthead-copy">
        <p className="eyebrow">Operator console</p>
        <h1>{title}</h1>
        <p className="masthead-lede">
          Local-first task orchestration for one operator, a review loop, and a
          compact crew of agents.
        </p>
      </div>
      <div className="masthead-stats">
        <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        <article className="stat-pill">
          <span>Mode</span>
          <strong>Local-first</strong>
        </article>
        <article className="stat-pill">
          <span>Open cards</span>
          <strong>{cardsCount}</strong>
        </article>
        <article className="stat-pill">
          <span>Agents</span>
          <strong>{agentsCount}</strong>
        </article>
      </div>
    </section>
  );
}
