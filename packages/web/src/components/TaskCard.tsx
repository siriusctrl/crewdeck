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
  const [isDragSettling, setIsDragSettling] = useState(false);

  useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
      setIsDragSettling(false);
      return;
    }

    if (!wasDraggingRef.current) {
      return;
    }

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
      if (secondFrame) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [isDragging]);

  return (
    <button
      className={cn(
        `task-card grid w-full transform-gpu gap-[0.56rem] rounded-[1.4rem] border border-transparent bg-[var(--paper-strong)] p-4 text-left text-[var(--ink)] shadow-[var(--shadow-soft)] transition-[transform,border-color,background-color,box-shadow,opacity] will-change-transform active:scale-[0.992] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)] ${motionSafeClass}`,
        isActive
          ? "border-[var(--line-strong)] shadow-[0_20px_36px_rgba(0,0,0,0.2)]"
          : "hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[0_16px_28px_rgba(0,0,0,0.16)]",
        isDragging && "cursor-grabbing opacity-55 shadow-[var(--shadow-soft)] transition-none",
        isDragSettling && "transition-none",
      )}
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
      <span className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]">
        {formatStatus(card.status)}
      </span>
      <strong className="text-[1.05rem] leading-[1.12]">{card.title}</strong>
      <p className="min-h-[4.15em] text-[0.95rem] text-[var(--muted)]">
        {card.description || "No description."}
      </p>
      <footer className="flex justify-between gap-3 text-[0.82rem] text-[var(--muted)]">
        <span>{actorLabel(card.assigneeId, actors)}</span>
        <span className="max-w-32 truncate">{card.labels[0] || "general"}</span>
      </footer>
    </button>
  );
}
