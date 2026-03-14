import { useEffect } from "react";

import { CardInspector } from "./components/CardInspector";
import { KanbanBoard } from "./components/KanbanBoard";
import { Masthead } from "./components/Masthead";
import { useCrewdeckApp } from "./hooks/useCrewdeckApp";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const app = useCrewdeckApp();
  const theme = useTheme();

  const isInspecting = app.selectedCardId != null && !app.isComposing;
  const drawerOpen = isInspecting || app.isComposing;

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        app.closeDrawer();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, app]);

  if (app.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-[var(--muted)]">
        Loading crewdeck…
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
      <Masthead
        title={app.selectedBoard?.name || "Crewdeck"}
        boards={app.boards}
        cardsCount={app.cards.length}
        agentsCount={app.actors.filter((a) => a.type === "agent").length}
        onToggleTheme={theme.toggleTheme}
        onBoardSelect={app.selectBoard}
        onComposeNewCard={app.openComposer}
        selectedBoardId={app.selectedBoardId}
        theme={theme.theme}
      />

      {app.error ? (
        <p className="mb-3 rounded-md bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-text)]">
          {app.error}
        </p>
      ) : null}

      <KanbanBoard
        actors={app.actors}
        cards={app.cards}
        groupedCards={app.groupedCards}
        selectedBoard={app.selectedBoard}
        selectedCardId={app.selectedCardId}
        draggedCardId={app.draggedCardId}
        dragOverStatus={app.dragOverStatus}
        canDropCard={app.canDropCard}
        getDragSourceCardId={app.getDragSourceCardId}
        onSelectCard={app.selectCard}
        onPrimeDrag={app.primeDrag}
        onStartDrag={app.startDrag}
        onEndDrag={app.resetDragState}
        onDragOverStatusChange={app.setDragOverStatus}
        onDropCard={app.moveCard}
      />

      {/* Drawer backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => app.closeDrawer()}
        aria-hidden="true"
      />

      {/* Slide-over drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] transform flex-col border-l border-[var(--line)] bg-[var(--paper)] shadow-[-4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-200 ease-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-label="Card detail"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
          <span className="text-[13px] font-medium text-[var(--muted)]">
            {isInspecting ? "Card detail" : "New card"}
          </span>
          <button
            className="rounded-md p-1 text-[var(--muted)] transition-colors hover:bg-[var(--tab-bg)] hover:text-[var(--ink)]"
            onClick={() => app.closeDrawer()}
            type="button"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto px-5 py-4">
          <CardInspector
            actors={app.actors}
            draft={app.draft}
            mode={isInspecting ? "detail" : "compose"}
            isLoadingCard={isInspecting && app.selectedCard == null}
            selectedCard={app.selectedCard}
            detailTab={app.detailTab}
            commentBody={app.commentBody}
            isSaving={app.isSaving}
            onDetailTabChange={app.setDetailTab}
            onDraftChange={app.updateDraft}
            onAssignmentChange={app.updateAssignment}
            onMoveCard={app.moveCard}
            onPingAgent={app.pingSelectedAgent}
            onCommentBodyChange={app.setCommentBody}
            onCreateCard={app.handleCreateCard}
            onAddComment={app.addComment}
          />
        </div>
      </aside>
    </main>
  );
}
