import { useEffect, useRef, useState } from "react";

import type { Actor, Card } from "@crewdeck/core";

import { actorLabel, formatStatus } from "../lib/board";
import { cn, motionSafeClass } from "../lib/ui";

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
  const wasDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const [isDragSettling, setIsDragSettling] = useState(false);

  useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
      setIsDragSettling(false);
      return;
    }
    if (!wasDraggingRef.current) return;
    wasDraggingRef.current = false;
    setIsDragSettling(true);
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setIsDragSettling(false);
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [isDragging]);

  return (
    <button
      className={cn(
        `task-card w-full rounded-lg border-l-[3px] border-transparent bg-[var(--paper-strong)] p-3 text-left shadow-[var(--card-shadow)] transition-[transform,box-shadow,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${motionSafeClass}`,
        isActive
          ? "border-l-[var(--accent)] shadow-[var(--card-shadow-hover)]"
          : "hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)]",
        isDragging && "cursor-grabbing opacity-50 transition-none",
        isDragSettling && "transition-none",
      )}
      data-card-id={card.id}
      data-card-title={card.title}
      draggable
      onPointerDown={() => onPrimeDrag(card.id)}
      onClick={() => {
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        onSelectCard(card.id);
      }}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.id);
        didDragRef.current = true;
        onStartDrag(card.id);
      }}
      onDragEnd={() => {
        window.requestAnimationFrame(() => {
          didDragRef.current = false;
        });
        onEndDrag();
      }}
      type="button"
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
        {formatStatus(card.status)}
      </span>
      <p className="mt-1 text-sm font-medium leading-snug text-[var(--ink)]">
        {card.title}
      </p>
      {card.description ? (
        <p className="mt-1 line-clamp-2 text-[13px] text-[var(--muted)]">
          {card.description}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-between text-[12px] text-[var(--muted)]">
        <span>{actorLabel(card.assigneeId, actors)}</span>
        <span className="max-w-[100px] truncate">{card.labels[0] || "general"}</span>
      </div>
    </button>
  );
}
