import type { Actor, Card, CardStatus } from "@crewdeck/core";

import type { StatusColumn } from "../lib/board";
import { cn, motionSafeClass } from "../lib/ui";
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

const statusDotClass: Record<CardStatus, string> = {
  inbox: "bg-[var(--status-dot-inbox)]",
  in_progress: "bg-[var(--status-dot-in-progress)]",
  review: "bg-[var(--status-dot-review)]",
  done: "bg-[var(--status-dot-done)]",
};

const columnBgClass: Record<CardStatus, string> = {
  inbox: "bg-[var(--status-inbox)]",
  in_progress: "bg-[var(--status-in-progress)]",
  review: "bg-[var(--status-review)]",
  done: "bg-[var(--status-done)]",
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
      className={cn(
        `column min-h-[calc(100vh-8rem)] rounded-xl border border-[var(--line)] p-3 transition-colors ${motionSafeClass}`,
        columnBgClass[column.status],
        isDropReady && "border-[var(--drop-ready)]",
        isDropActive && "border-[var(--drop-active)]",
      )}
      data-column-label={column.label}
      data-column-status={column.status}
      onDragOver={(event) => {
        if (!isDropReady) return;
        event.preventDefault();
        onDragOverStatusChange(column.status);
      }}
      onDragLeave={() => {
        if (dragOverStatus === column.status) onDragOverStatusChange(undefined);
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
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", statusDotClass[column.status])} />
          <h3 className="text-[13px] font-semibold text-[var(--ink)]">{column.label}</h3>
        </div>
        <span className="text-[12px] tabular-nums text-[var(--muted)]">
          {cards.length}
        </span>
      </header>

      <div className="grid gap-2">
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
          <div className="rounded-md border border-dashed border-[var(--empty-border)] px-3 py-6 text-center text-[13px] text-[var(--muted)]">
            {isDropReady ? "Drop here" : "No cards"}
          </div>
        ) : null}
      </div>
    </section>
  );
}
