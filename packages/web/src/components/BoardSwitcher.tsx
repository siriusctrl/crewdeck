import type { Board } from "@crewdeck/core";

type BoardSwitcherProps = {
  boards: Board[];
  selectedBoardId?: string;
  onBoardSelect: (boardId: string) => void;
};

export function BoardSwitcher({
  boards,
  selectedBoardId,
  onBoardSelect,
}: BoardSwitcherProps) {
  return (
    <div className="board-switcher">
      <div className="panel-heading compact">
        <p className="eyebrow">Boards</p>
        <h3>Stay inside one operating context at a time.</h3>
      </div>
      <div className="board-list horizontal">
        {boards.map((board) => (
          <button
            key={board.id}
            className={
              board.id === selectedBoardId ? "board-chip active" : "board-chip"
            }
            onClick={() => onBoardSelect(board.id)}
            type="button"
          >
            <strong>{board.name}</strong>
            <span>{board.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
