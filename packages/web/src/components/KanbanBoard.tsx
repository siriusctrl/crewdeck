import type { Actor, Board, Card, CardStatus } from "@crewdeck/core";

import { columns } from "../lib/board";
import { KanbanColumn } from "./KanbanColumn";

type KanbanBoardProps = {
  actors: Actor[];
  cards: Card[];
  groupedCards: Record<CardStatus, Card[]>;
  selectedBoard?: Board;
  selectedCardId?: string;
  draggedCardId?: string;
  dragOverStatus?: CardStatus;
  canDropCard: (cardId: string | undefined, status: CardStatus) => boolean;
  getDragSourceCardId: () => string | undefined;
  onSelectCard: (cardId: string) => void;
  onPrimeDrag: (cardId: string) => void;
  onStartDrag: (cardId: string) => void;
  onEndDrag: () => void;
  onDragOverStatusChange: (status?: CardStatus) => void;
  onDropCard: (cardId: string, status: CardStatus) => Promise<void>;
};

export function KanbanBoard({
  actors,
  cards,
  groupedCards,
  selectedBoard,
  selectedCardId,
  draggedCardId,
  dragOverStatus,
  canDropCard,
  getDragSourceCardId,
  onSelectCard,
  onPrimeDrag,
  onStartDrag,
  onEndDrag,
  onDragOverStatusChange,
  onDropCard,
}: KanbanBoardProps) {
  const draggedCard = cards.find((card) => card.id === draggedCardId);

  return (
    <div
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      aria-label={selectedBoard?.name || "Board"}
    >
      {columns.map((column) => (
        <KanbanColumn
          key={column.status}
          actors={actors}
          cards={groupedCards[column.status]}
          column={column}
          draggedCard={draggedCard}
          draggedCardId={draggedCardId}
          dragOverStatus={dragOverStatus}
          canDropCard={canDropCard}
          getDragSourceCardId={getDragSourceCardId}
          isDropReady={canDropCard(draggedCardId, column.status)}
          onDragOverStatusChange={onDragOverStatusChange}
          onDropCard={onDropCard}
          onEndDrag={onEndDrag}
          onPrimeDrag={onPrimeDrag}
          onSelectCard={onSelectCard}
          onStartDrag={onStartDrag}
          selectedCardId={selectedCardId}
        />
      ))}
    </div>
  );
}
