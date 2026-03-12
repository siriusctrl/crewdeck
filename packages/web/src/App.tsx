import { startTransition, useEffect, useMemo, useState } from "react";

import type { Actor, Board, Card, CardDetail, CardStatus } from "@crewdeck/core";
import { cardStatuses } from "@crewdeck/core";

import {
  createCard as createCardRequest,
  createComment,
  getBoardSnapshot,
  getCard,
  listActors,
  listBoards,
  pingAgent,
  updateCardAssignment,
  updateCardStatus,
} from "./api";

type StatusColumn = {
  status: CardStatus;
  label: string;
  eyebrow: string;
};

const columns: StatusColumn[] = [
  { status: "backlog", label: "Backlog", eyebrow: "Collect" },
  { status: "in_progress", label: "In Progress", eyebrow: "Build" },
  { status: "review", label: "Review", eyebrow: "Challenge" },
  { status: "done", label: "Done", eyebrow: "Archive" },
];

const humanActorId = "human-you";

function formatStatus(status: CardStatus): string {
  return status.replace("_", " ");
}

function actorLabel(actorId: string | undefined, actors: Actor[]): string {
  if (!actorId) {
    return "Unassigned";
  }

  return actors.find((actor) => actor.id === actorId)?.name || "Unknown";
}

function nextStatusOptions(status: CardStatus): CardStatus[] {
  switch (status) {
    case "backlog":
      return ["in_progress"];
    case "in_progress":
      return ["backlog", "review"];
    case "review":
      return ["in_progress", "done"];
    case "done":
      return ["review"];
  }
}

export default function App() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>();
  const [selectedCardId, setSelectedCardId] = useState<string>();
  const [selectedCard, setSelectedCard] = useState<CardDetail>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftAssigneeId, setDraftAssigneeId] = useState<string>("agent-codex");
  const [draftReviewerId, setDraftReviewerId] = useState<string>("human-you");
  const [commentBody, setCommentBody] = useState("");

  useEffect(() => {
    async function boot() {
      try {
        const [nextBoards, nextActors] = await Promise.all([
          listBoards(),
          listActors(),
        ]);

        setBoards(nextBoards);
        setActors(nextActors);

        if (nextBoards[0]) {
          setSelectedBoardId(nextBoards[0].id);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load app");
      } finally {
        setIsLoading(false);
      }
    }

    void boot();
  }, []);

  useEffect(() => {
    if (!selectedBoardId) {
      return;
    }

    const boardId = selectedBoardId;

    async function loadBoard() {
      try {
        const snapshot = await getBoardSnapshot(boardId);
        setCards(snapshot.cards);

        if (!selectedCardId && snapshot.cards[0]) {
          setSelectedCardId(snapshot.cards[0].id);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load board");
      }
    }

    void loadBoard();
  }, [selectedBoardId, selectedCardId]);

  useEffect(() => {
    if (!selectedCardId) {
      setSelectedCard(undefined);
      return;
    }

    const cardId = selectedCardId;

    async function loadCard() {
      try {
        setSelectedCard(await getCard(cardId));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load card");
      }
    }

    void loadCard();
  }, [selectedCardId]);

  const groupedCards = useMemo(() => {
    return Object.fromEntries(
      cardStatuses.map((status) => [
        status,
        cards.filter((card) => card.status === status),
      ]),
    ) as Record<CardStatus, Card[]>;
  }, [cards]);

  async function refreshBoardAndCard(cardId?: string) {
    if (!selectedBoardId) {
      return;
    }

    const snapshot = await getBoardSnapshot(selectedBoardId);
    setCards(snapshot.cards);

    const nextCardId = cardId ?? selectedCardId ?? snapshot.cards[0]?.id;

    if (nextCardId) {
      setSelectedCardId(nextCardId);
      setSelectedCard(await getCard(nextCardId));
    }
  }

  async function handleCreateCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedBoardId) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const card = await createCardRequest(selectedBoardId, {
        title: draftTitle,
        description: draftDescription,
        assigneeId: draftAssigneeId || undefined,
        reviewerId: draftReviewerId || undefined,
      });

      setDraftTitle("");
      setDraftDescription("");
      startTransition(() => {
        void refreshBoardAndCard(card.id);
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create card");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(status: CardStatus) {
    if (!selectedCard) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await updateCardStatus(selectedCard.id, status);
      await refreshBoardAndCard(selectedCard.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to move card");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssignmentChange(kind: "assigneeId" | "reviewerId", value: string) {
    if (!selectedCard) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await updateCardAssignment(selectedCard.id, {
        assigneeId: kind === "assigneeId" ? value || undefined : selectedCard.assigneeId,
        reviewerId: kind === "reviewerId" ? value || undefined : selectedCard.reviewerId,
      });
      await refreshBoardAndCard(selectedCard.id);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update assignment",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCard) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await createComment(selectedCard.id, {
        authorId: humanActorId,
        body: commentBody,
      });
      setCommentBody("");
      await refreshBoardAndCard(selectedCard.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add comment");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePingAgent() {
    if (!selectedCard?.assignee || selectedCard.assignee.type !== "agent") {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await pingAgent(selectedCard.id);
      await refreshBoardAndCard(selectedCard.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to ping agent");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <main className="shell loading">Loading crewdeck…</main>;
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Single-user operator console</p>
          <h1>Run a whole board like a studio, not a ticket graveyard.</h1>
        </div>
        <div className="hero-card">
          <span>Mode</span>
          <strong>Local-first, human + agent workflow</strong>
          <p>
            One operator, multiple agent backends, clear review gates, no auth
            tax.
          </p>
        </div>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="workspace">
        <aside className="rail">
          <div className="panel panel-board">
            <p className="eyebrow">Boards</p>
            <div className="board-list">
              {boards.map((board) => (
                <button
                  key={board.id}
                  className={board.id === selectedBoardId ? "board-chip active" : "board-chip"}
                  onClick={() => {
                    startTransition(() => {
                      setSelectedBoardId(board.id);
                      setSelectedCardId(undefined);
                    });
                  }}
                  type="button"
                >
                  <strong>{board.name}</strong>
                  <span>{board.description}</span>
                </button>
              ))}
            </div>
          </div>

          <form className="panel composer" onSubmit={handleCreateCard}>
            <div className="panel-heading">
              <p className="eyebrow">New Card</p>
              <h2>Drop fresh work into the board.</h2>
            </div>
            <label>
              <span>Title</span>
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="Shape the review flow"
                required
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder="Define the smallest cut that proves the system."
                rows={4}
              />
            </label>
            <label>
              <span>Assignee</span>
              <select
                value={draftAssigneeId}
                onChange={(event) => setDraftAssigneeId(event.target.value)}
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
                value={draftReviewerId}
                onChange={(event) => setDraftReviewerId(event.target.value)}
              >
                <option value="">Unassigned</option>
                {actors.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Working..." : "Create card"}
            </button>
          </form>
        </aside>

        <section className="board-stage">
          <header className="board-header">
            <div>
              <p className="eyebrow">Board view</p>
              <h2>{boards.find((board) => board.id === selectedBoardId)?.name}</h2>
            </div>
            <p>
              The MVP keeps the loop tight: assign, execute, review, finish.
            </p>
          </header>

          <div className="kanban">
            {columns.map((column) => (
              <section key={column.status} className={`column status-${column.status}`}>
                <header>
                  <p>{column.eyebrow}</p>
                  <h3>{column.label}</h3>
                </header>

                <div className="column-stack">
                  {groupedCards[column.status].map((card) => (
                    <button
                      key={card.id}
                      className={card.id === selectedCardId ? "task-card active" : "task-card"}
                      onClick={() => setSelectedCardId(card.id)}
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
                  ))}

                  {groupedCards[column.status].length === 0 ? (
                    <div className="empty-slot">
                      <span>Nothing parked here yet.</span>
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </section>

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
                      void handleAssignmentChange("assigneeId", event.target.value)
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
                      void handleAssignmentChange("reviewerId", event.target.value)
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
                    onClick={() => void handleStatusChange(status)}
                    type="button"
                  >
                    Move to {formatStatus(status)}
                  </button>
                ))}
              </div>

              {selectedCard.assignee?.type === "agent" ? (
                <button className="accent-button" onClick={() => void handlePingAgent()} type="button">
                  Ping {selectedCard.assignee.name}
                </button>
              ) : null}

              <div className="thread">
                <div className="panel-heading">
                  <p className="eyebrow">Discussion</p>
                  <h3>Progress should stay attached to the task.</h3>
                </div>
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
                <form className="thread-form" onSubmit={handleAddComment}>
                  <textarea
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                    placeholder="Leave a review note or tighten the brief..."
                    rows={4}
                  />
                  <button className="primary-button" disabled={isSaving} type="submit">
                    Add note
                  </button>
                </form>
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
      </section>
    </main>
  );
}
