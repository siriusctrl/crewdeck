import type { Board } from "@crewdeck/core";

import type { ThemeName } from "../hooks/useTheme";
import { cn, displayTitleClass, fieldClass, ghostButtonClass } from "../lib/ui";
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
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <h1 className={cn(displayTitleClass, "text-lg")}>{title}</h1>
        {boards.length > 1 ? (
          <>
            <label className="sr-only" htmlFor="masthead-board-select">
              Board
            </label>
            <select
              id="masthead-board-select"
              className={cn(fieldClass, "w-auto min-w-[140px] py-1.5 text-sm")}
              value={selectedBoardId}
              onChange={(event) => onBoardSelect(event.target.value)}
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[var(--muted)]">
          {cardsCount} cards
        </span>
        <span className="text-[var(--line-strong)]">/</span>
        <span className="text-[13px] text-[var(--muted)]">
          {agentsCount} agents
        </span>
        <div className="ml-2 flex items-center gap-2">
          <button className={ghostButtonClass} onClick={onComposeNewCard} type="button">
            + New card
          </button>
          <ThemeToggle onToggle={onToggleTheme} theme={theme} />
        </div>
      </div>
    </header>
  );
}
