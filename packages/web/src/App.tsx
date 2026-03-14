import { CardInspector } from "./components/CardInspector";
import { KanbanBoard } from "./components/KanbanBoard";
import { Masthead } from "./components/Masthead";
import { useCrewdeckApp } from "./hooks/useCrewdeckApp";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const app = useCrewdeckApp();
  const theme = useTheme();

  if (app.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center px-4 text-[1.05rem] text-[var(--muted)]">
        Loading crewdeck…
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1680px] p-[clamp(1rem,1.8vw,1.8rem)]">
      <Masthead
        title={app.selectedBoard?.name || "Crewdeck"}
        boards={app.boards}
        cardsCount={app.cards.length}
        agentsCount={app.actors.filter((actor) => actor.type === "agent").length}
        onToggleTheme={theme.toggleTheme}
        onBoardSelect={app.selectBoard}
        onComposeNewCard={app.clearSelectedCard}
        selectedBoardId={app.selectedBoardId}
        theme={theme.theme}
      />

      {app.error ? (
        <p className="mb-4 rounded-full bg-[var(--danger-bg)] px-4 py-[0.85rem] text-[var(--danger-text)]">
          {app.error}
        </p>
      ) : null}

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(21rem,25rem)]">
        <section className="grid min-w-0 gap-4">
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
        </section>

        <CardInspector
          actors={app.actors}
          draft={app.draft}
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
      </section>
    </main>
  );
}
