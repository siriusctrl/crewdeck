import type { Actor, Card } from "@crewdeck/core";

import { actorLabel, formatStatus } from "../lib/board";

type TaskCardProps = {
  actors: Actor[];
  card: Card;
  isActive: boolean;
  isDragging: boolean;
  onPrimeDrag: (cardId: string) => void;
  onSelectCard: (cardId: string) => void;
  onStartDrag: (cardId: string) => void;
  onEndDrag: () => void;
};

export function TaskCard({
  actors,
  card,
  isActive,
  isDragging,
  onPrimeDrag,
  onSelectCard,
  onStartDrag,
  onEndDrag,
}: TaskCardProps) {
  return (
    <button
      className={[
        "task-card",
        isActive ? "active" : "",
        isDragging ? "dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      draggable
      onPointerDown={() => onPrimeDrag(card.id)}
      onClick={() => onSelectCard(card.id)}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.id);
        onStartDrag(card.id);
      }}
      onDragEnd={onEndDrag}
      type="button"
    >
      <span className="task-status">{formatStatus(card.status)}</span>
      <strong>{card.title}</strong>
      <p>{card.description || "No description yet."}</p>
      <footer>
        <span>{actorLabel(card.assigneeId, actors)}</span>
        <span>{card.labels[0] || "general"}</span>
      </footer>
    </button>
  );
}
