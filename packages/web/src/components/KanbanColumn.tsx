import type { Actor, Card, CardStatus } from "@crewdeck/core";

import type { StatusColumn } from "../lib/board";
import { TaskCard } from "./TaskCard";

type KanbanColumnProps = {
  actors: Actor[];
  column: StatusColumn;
  cards: Card[];
  selectedCardId?: string;
  draggedCard?: Card;
  draggedCardId?: string;
  dragOverStatus?: CardStatus;
  canDropCard: (cardId: string | undefined, status: CardStatus) => boolean;
  getDragSourceCardId: () => string | undefined;
  isDropReady: boolean;
  onSelectCard: (cardId: string) => void;
  onPrimeDrag: (cardId: string) => void;
  onStartDrag: (cardId: string) => void;
  onEndDrag: () => void;
  onDragOverStatusChange: (status?: CardStatus) => void;
  onDropCard: (cardId: string, status: CardStatus) => Promise<void>;
};

export function KanbanColumn({
  actors,
  column,
  cards,
  selectedCardId,
  draggedCard,
  draggedCardId,
  dragOverStatus,
  canDropCard,
  getDragSourceCardId,
  isDropReady,
  onSelectCard,
  onPrimeDrag,
  onStartDrag,
  onEndDrag,
  onDragOverStatusChange,
  onDropCard,
}: KanbanColumnProps) {
  const isDropActive = dragOverStatus === column.status && isDropReady;

  return (
    <section
      className={[
        "column",
        `status-${column.status}`,
        isDropReady ? "drop-ready" : "",
        isDropActive ? "drop-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={(event) => {
        if (!isDropReady) {
          return;
        }

        event.preventDefault();
        onDragOverStatusChange(column.status);
      }}
      onDragLeave={() => {
        if (dragOverStatus === column.status) {
          onDragOverStatusChange(undefined);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const droppedCardId =
          event.dataTransfer.getData("text/plain") ||
          getDragSourceCardId() ||
          draggedCard?.id;

        if (!droppedCardId || !canDropCard(droppedCardId, column.status)) {
          onEndDrag();
          return;
        }

        void onDropCard(droppedCardId, column.status);
      }}
    >
      <header>
        <div>
          <p>{column.eyebrow}</p>
          <h3>{column.label}</h3>
        </div>
        <span className="column-count">{cards.length}</span>
      </header>

      <div className="column-stack">
        {cards.map((card) => (
          <TaskCard
            key={card.id}
            actors={actors}
            card={card}
            isActive={card.id === selectedCardId}
            isDragging={draggedCardId === card.id}
            onPrimeDrag={onPrimeDrag}
            onSelectCard={onSelectCard}
            onStartDrag={onStartDrag}
            onEndDrag={onEndDrag}
          />
        ))}

        {cards.length === 0 ? (
          <div className="empty-slot">
            <span>
              {isDropReady ? "Drop the selected card here." : "Nothing parked here yet."}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
