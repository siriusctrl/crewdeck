import type React from "react";

import type { Actor, Board } from "@crewdeck/core";

import type { CardDraft } from "../lib/draft";
import { BoardSwitcher } from "./BoardSwitcher";
import { QuickAddComposer } from "./QuickAddComposer";

type ControlStripProps = {
  boards: Board[];
  actors: Actor[];
  selectedBoardId?: string;
  draft: CardDraft;
  isSaving: boolean;
  onBoardSelect: (boardId: string) => void;
  onDraftChange: (field: keyof CardDraft, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
};

export function ControlStrip({
  boards,
  actors,
  selectedBoardId,
  draft,
  isSaving,
  onBoardSelect,
  onDraftChange,
  onSubmit,
}: ControlStripProps) {
  return (
    <div className="panel control-strip">
      <BoardSwitcher
        boards={boards}
        onBoardSelect={onBoardSelect}
        selectedBoardId={selectedBoardId}
      />
      <QuickAddComposer
        actors={actors}
        draft={draft}
        isSaving={isSaving}
        onDraftChange={onDraftChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}
