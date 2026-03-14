import type { Board } from "@crewdeck/core";

import type { ThemeName } from "../hooks/useTheme";
import {
  cn,
  displayTitleClass,
  eyebrowClass,
  fieldClass,
  ghostButtonClass,
  pillClass,
} from "../lib/ui";
import { ThemeToggle } from "./ThemeToggle";

type MastheadProps = {
  title: string;
  boards: Board[];
  selectedBoardId?: string;
  cardsCount: number;
  agentsCount: number;
  theme: ThemeName;
  onBoardSelect: (boardId: string) => void;
  onComposeNewCard: () => void;
  onToggleTheme: () => void;
};

export function Masthead({
  title,
  boards,
  selectedBoardId,
  cardsCount,
  agentsCount,
  theme,
  onBoardSelect,
  onComposeNewCard,
  onToggleTheme,
}: MastheadProps) {
  return (
    <section className="mb-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
      <div className="grid gap-[0.36rem]">
        <p className={eyebrowClass}>Operator console</p>
        <h1
          className={cn(
            displayTitleClass,
            "max-w-[11ch] text-[clamp(1.85rem,3vw,2.75rem)] leading-[0.94]",
          )}
        >
          {title}
        </h1>
      </div>
      <div className="flex flex-wrap gap-2 xl:justify-end">
        {boards.length > 1 ? (
          <label className="sr-only" htmlFor="masthead-board-select">
            Board
          </label>
        ) : null}
        {boards.length > 1 ? (
          <select
            id="masthead-board-select"
            className={cn(fieldClass, "min-w-[11.5rem] py-[0.7rem]")}
            value={selectedBoardId}
            onChange={(event) => onBoardSelect(event.target.value)}
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        ) : null}
        <button className={ghostButtonClass} onClick={onComposeNewCard} type="button">
          New card
        </button>
        <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        <article className={cn(pillClass, "grid min-w-[7.4rem] gap-[0.2rem] px-3 py-2.5")}>
          <span className={eyebrowClass}>Cards</span>
          <strong className="text-base">{cardsCount}</strong>
        </article>
        <article className={cn(pillClass, "grid min-w-[7.4rem] gap-[0.2rem] px-3 py-2.5")}>
          <span className={eyebrowClass}>Agents</span>
          <strong className="text-base">{agentsCount}</strong>
        </article>
      </div>
    </section>
  );
}
