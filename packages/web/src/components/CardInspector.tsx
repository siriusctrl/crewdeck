import type { Actor, CardDetail } from "@crewdeck/core";

import { formatStatus, nextStatusOptions } from "../lib/board";

type CardInspectorProps = {
  actors: Actor[];
  selectedCard?: CardDetail;
  detailTab: "runs" | "discussion";
  commentBody: string;
  isSaving: boolean;
  onDetailTabChange: (tab: "runs" | "discussion") => void;
  onAssignmentChange: (
    kind: "assigneeId" | "reviewerId",
    value: string,
  ) => Promise<void>;
  onMoveCard: (cardId: string, status: CardDetail["status"]) => Promise<void>;
  onPingAgent: () => Promise<void>;
  onCommentBodyChange: (value: string) => void;
  onAddComment: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
};

export function CardInspector({
  actors,
  selectedCard,
  detailTab,
  commentBody,
  isSaving,
  onDetailTabChange,
  onAssignmentChange,
  onMoveCard,
  onPingAgent,
  onCommentBodyChange,
  onAddComment,
}: CardInspectorProps) {
  return (
    <aside className="panel detail-panel">
      {selectedCard ? (
        <>
          <div className="detail-header">
            <p className="eyebrow">Selected card</p>
            <h2>{selectedCard.title}</h2>
            <p>{selectedCard.description || "Add a clearer brief for the assignee."}</p>
          </div>

          <div className="detail-grid">
            <label>
              <span>Assignee</span>
              <select
                value={selectedCard.assigneeId || ""}
                onChange={(event) =>
                  void onAssignmentChange("assigneeId", event.target.value)
                }
              >
                <option value="">Unassigned</option>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Reviewer</span>
              <select
                value={selectedCard.reviewerId || ""}
                onChange={(event) =>
                  void onAssignmentChange("reviewerId", event.target.value)
                }
              >
                <option value="">Unassigned</option>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="status-strip">
            {nextStatusOptions(selectedCard.status).map((status) => (
              <button
                key={status}
                className="ghost-button"
                onClick={() => void onMoveCard(selectedCard.id, status)}
                type="button"
              >
                Move to {formatStatus(status)}
              </button>
            ))}
          </div>

          {selectedCard.assignee?.type === "agent" ? (
            <button className="accent-button" onClick={() => void onPingAgent()} type="button">
              Ping {selectedCard.assignee.name}
            </button>
          ) : null}

          <div className="thread">
            <div className="panel-heading">
              <p className="eyebrow">Inspector</p>
              <h3>Reviewable execution, without the noise.</h3>
            </div>
            <div className="tab-strip">
              <button
                className={detailTab === "runs" ? "tab-button active" : "tab-button"}
                onClick={() => onDetailTabChange("runs")}
                type="button"
              >
                Agent runs
              </button>
              <button
                className={
                  detailTab === "discussion" ? "tab-button active" : "tab-button"
                }
                onClick={() => onDetailTabChange("discussion")}
                type="button"
              >
                Discussion
              </button>
            </div>
            {detailTab === "runs" ? (
              <div className="run-list">
                {selectedCard.runs.length > 0 ? (
                  selectedCard.runs.map((run) => (
                    <article key={run.id} className="run-entry">
                      <header>
                        <strong>{run.actor.name}</strong>
                        <span>{new Date(run.createdAt).toLocaleString()}</span>
                      </header>
                      <p>{run.summary}</p>
                      <small>{run.status}</small>
                    </article>
                  ))
                ) : (
                  <div className="empty-slot compact">
                    <span>No agent runs recorded yet.</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="thread-list">
                  {selectedCard.comments.map((comment) => (
                    <article key={comment.id} className="thread-entry">
                      <header>
                        <strong>{comment.author.name}</strong>
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      </header>
                      <p>{comment.body}</p>
                    </article>
                  ))}
                </div>
                <form className="thread-form" onSubmit={onAddComment}>
                  <textarea
                    value={commentBody}
                    onChange={(event) => onCommentBodyChange(event.target.value)}
                    placeholder="Leave a review note or tighten the brief..."
                    rows={4}
                  />
                  <button className="primary-button" disabled={isSaving} type="submit">
                    Add note
                  </button>
                </form>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="empty-detail">
          <p className="eyebrow">Inspector</p>
          <h2>Pick a card to inspect the execution trail.</h2>
          <p>
            This panel is where assignment, review, and agent progress stay
            grounded in the task instead of floating in chat history.
          </p>
        </div>
      )}
    </aside>
  );
}
