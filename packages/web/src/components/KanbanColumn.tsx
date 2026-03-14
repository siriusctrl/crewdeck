import type { Actor, Card, CardStatus } from "@crewdeck/core";

import type { StatusColumn } from "../lib/board";
import { cn, displayTitleClass, eyebrowClass, motionSafeClass } from "../lib/ui";
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

const columnStatusClass: Record<CardStatus, string> = {
  backlog: "[background:var(--status-backlog)]",
  in_progress: "[background:var(--status-in-progress)]",
  review: "[background:var(--status-review)]",
  done: "[background:var(--status-done)]",
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
        `column min-h-[31rem] rounded-[1.8rem] border border-[var(--line)] p-[0.96rem] shadow-[inset_0_1px_0_var(--panel-edge)] transition-[border-color,box-shadow,transform] ${motionSafeClass}`,
        columnStatusClass[column.status],
        isDropReady && "border-[var(--drop-ready)]",
        isDropActive &&
          "border-[var(--drop-active)] shadow-[inset_0_0_0_1px_var(--drop-active-ring),0_0_0_1px_var(--drop-active-ring)]",
      )}
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
      <header className="mb-[0.88rem] flex items-baseline justify-between gap-4">
        <div>
          <p className={eyebrowClass}>{column.eyebrow}</p>
          <h3 className={cn(displayTitleClass, "mt-1 text-[1.4rem]")}>{column.label}</h3>
        </div>
        <span className="inline-grid min-h-8 min-w-8 place-items-center rounded-full bg-[var(--badge-bg)] px-[0.55rem] text-[0.82rem] font-semibold text-[var(--ink)]">
          {cards.length}
        </span>
      </header>

      <div className="grid gap-[0.86rem]">
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
          <div className="rounded-[1.35rem] border border-dashed border-[var(--empty-border)] bg-[var(--empty-bg)] p-4 text-[var(--muted)]">
            <span>
              {isDropReady ? "Drop the selected card here." : "Nothing parked here yet."}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
