import { CardInspector } from "./components/CardInspector";
import { ControlStrip } from "./components/ControlStrip";
import { KanbanBoard } from "./components/KanbanBoard";
import { Masthead } from "./components/Masthead";
import { useCrewdeckApp } from "./hooks/useCrewdeckApp";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const app = useCrewdeckApp();
  const theme = useTheme();

  if (app.isLoading) {
    return <main className="shell loading">Loading crewdeck…</main>;
  }

  return (
    <main className="shell">
      <Masthead
        title={app.selectedBoard?.name || "Crewdeck"}
        cardsCount={app.cards.length}
        agentsCount={app.actors.filter((actor) => actor.type === "agent").length}
        onToggleTheme={theme.toggleTheme}
        theme={theme.theme}
      />

      {app.error ? <p className="error-banner">{app.error}</p> : null}

      <section className="workspace">
        <section className="board-stage">
          <ControlStrip
            boards={app.boards}
            actors={app.actors}
            selectedBoardId={app.selectedBoardId}
            draft={app.draft}
            isSaving={app.isSaving}
            onBoardSelect={app.selectBoard}
            onDraftChange={app.updateDraft}
            onSubmit={app.handleCreateCard}
          />

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
          selectedCard={app.selectedCard}
          detailTab={app.detailTab}
          commentBody={app.commentBody}
          isSaving={app.isSaving}
          onDetailTabChange={app.setDetailTab}
          onAssignmentChange={app.updateAssignment}
          onMoveCard={app.moveCard}
          onPingAgent={app.pingSelectedAgent}
          onCommentBodyChange={app.setCommentBody}
          onAddComment={app.addComment}
        />
      </section>
    </main>
  );
}
