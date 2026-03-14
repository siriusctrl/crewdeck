import type { Actor, CardDetail } from "@crewdeck/core";

import type { CardDraft } from "../lib/draft";
import { formatStatus, nextStatusOptions } from "../lib/board";
import {
  accentButtonClass,
  cn,
  displayTitleClass,
  eyebrowClass,
  fieldClass,
  fieldLabelClass,
  fieldLabelTextClass,
  ghostButtonClass,
  panelClass,
  primaryButtonClass,
} from "../lib/ui";
import { QuickAddComposer } from "./QuickAddComposer";

type CardInspectorProps = {
  actors: Actor[];
  draft: CardDraft;
  selectedCard?: CardDetail;
  detailTab: "runs" | "discussion";
  commentBody: string;
  isSaving: boolean;
  onDetailTabChange: (tab: "runs" | "discussion") => void;
  onDraftChange: (field: keyof CardDraft, value: string) => void;
  onAssignmentChange: (
    kind: "assigneeId" | "reviewerId",
    value: string,
  ) => Promise<void>;
  onMoveCard: (cardId: string, status: CardDetail["status"]) => Promise<void>;
  onPingAgent: () => Promise<void>;
  onCommentBodyChange: (value: string) => void;
  onCreateCard: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onAddComment: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
};

export function CardInspector({
  actors,
  draft,
  selectedCard,
  detailTab,
  commentBody,
  isSaving,
  onDetailTabChange,
  onDraftChange,
  onAssignmentChange,
  onMoveCard,
  onPingAgent,
  onCommentBodyChange,
  onCreateCard,
  onAddComment,
}: CardInspectorProps) {
  return (
    <aside
      className={cn(
        panelClass,
        "grid gap-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-auto",
      )}
    >
      {selectedCard ? (
        <>
          <div className="grid gap-[0.36rem]">
            <p className={eyebrowClass}>Card</p>
            <h2 className={cn(displayTitleClass, "text-[clamp(1.6rem,2.4vw,2.2rem)]")}>
              {selectedCard.title}
            </h2>
            <p className="text-[var(--muted)]">
              {selectedCard.description || "No description."}
            </p>
          </div>

          <div className="grid gap-[0.8rem] sm:grid-cols-2">
            <label className={fieldLabelClass}>
              <span className={fieldLabelTextClass}>Assignee</span>
              <select
                className={fieldClass}
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
            <label className={fieldLabelClass}>
              <span className={fieldLabelTextClass}>Reviewer</span>
              <select
                className={fieldClass}
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

          <div className="flex flex-wrap gap-[0.6rem]">
            {nextStatusOptions(selectedCard.status).map((status) => (
              <button
                key={status}
                className={ghostButtonClass}
                onClick={() => void onMoveCard(selectedCard.id, status)}
                type="button"
              >
                To {formatStatus(status)}
              </button>
            ))}
          </div>

          {selectedCard.assignee?.type === "agent" ? (
            <button
              className={cn(accentButtonClass, "justify-self-start")}
              onClick={() => void onPingAgent()}
              type="button"
            >
              Ping {selectedCard.assignee.name}
            </button>
          ) : null}

          <div className="grid gap-[0.9rem]">
            <p className={eyebrowClass}>Activity</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className={cn(
                  "w-full rounded-full border border-[var(--line)] bg-[var(--tab-bg)] px-[0.92rem] py-[0.72rem] text-left text-[var(--muted)] transition-[transform,border-color,background-color,box-shadow,color] duration-[220ms] ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-[var(--line-strong)] hover:bg-[color-mix(in_srgb,var(--tab-bg)_78%,var(--paper-strong))] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)] motion-reduce:transform-none motion-reduce:transition-none",
                  detailTab === "runs" &&
                    "border-transparent bg-[var(--ink)] text-[var(--page-fill)]",
                )}
                onClick={() => onDetailTabChange("runs")}
                type="button"
              >
                Agent runs
              </button>
              <button
                className={cn(
                  "w-full rounded-full border border-[var(--line)] bg-[var(--tab-bg)] px-[0.92rem] py-[0.72rem] text-left text-[var(--muted)] transition-[transform,border-color,background-color,box-shadow,color] duration-[220ms] ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-[var(--line-strong)] hover:bg-[color-mix(in_srgb,var(--tab-bg)_78%,var(--paper-strong))] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)] motion-reduce:transform-none motion-reduce:transition-none",
                  detailTab === "discussion" &&
                    "border-transparent bg-[var(--ink)] text-[var(--page-fill)]",
                )}
                onClick={() => onDetailTabChange("discussion")}
                type="button"
              >
                Discussion
              </button>
            </div>
            {detailTab === "runs" ? (
              <div className="grid max-h-64 gap-[0.8rem] overflow-auto pr-1">
                {selectedCard.runs.length > 0 ? (
                  selectedCard.runs.map((run) => (
                    <article
                      key={run.id}
                      className="rounded-[1.1rem] border border-[var(--entry-border)] bg-[var(--entry-bg)] px-[0.96rem] py-[0.92rem]"
                    >
                      <header className="mb-[0.46rem] flex justify-between gap-3">
                        <strong>{run.actor.name}</strong>
                        <span className="text-[0.8rem] text-[var(--muted)]">
                          {new Date(run.createdAt).toLocaleString()}
                        </span>
                      </header>
                      <p className="text-[var(--muted)]">{run.summary}</p>
                      <small className="mt-[0.56rem] inline-block text-[0.7rem] uppercase tracking-[0.16em] text-[var(--accent)]">
                        {run.status}
                      </small>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1.35rem] border border-dashed border-[var(--empty-border)] bg-[var(--empty-bg)] px-[0.95rem] py-[0.85rem] text-[var(--muted)]">
                    <span>No agent runs recorded yet.</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid max-h-[23rem] gap-[0.8rem] overflow-auto pr-1">
                  {selectedCard.comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-[1.1rem] border border-[var(--entry-border)] bg-[var(--entry-bg)] px-[0.96rem] py-[0.92rem]"
                    >
                      <header className="mb-[0.46rem] flex justify-between gap-3">
                        <strong>{comment.author.name}</strong>
                        <span className="text-[0.8rem] text-[var(--muted)]">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </header>
                      <p className="text-[var(--muted)]">{comment.body}</p>
                    </article>
                  ))}
                </div>
                <form className="grid gap-[0.72rem]" onSubmit={onAddComment}>
                  <textarea
                    className={cn(fieldClass, "min-h-28")}
                    value={commentBody}
                    onChange={(event) => onCommentBodyChange(event.target.value)}
                    placeholder="Add a note"
                    rows={4}
                  />
                  <button
                    className={cn(primaryButtonClass, "justify-self-start")}
                    disabled={isSaving}
                    type="submit"
                  >
                    Add note
                  </button>
                </form>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="grid gap-4">
          <div className="rounded-[1.35rem] border border-dashed border-[var(--empty-border)] bg-[var(--empty-bg)] p-4">
            <p className={eyebrowClass}>Compose</p>
            <h2
              className={cn(
                displayTitleClass,
                "mt-2 text-[clamp(1.5rem,2.2vw,2rem)] text-[var(--ink)]",
              )}
            >
              Create a card
            </h2>
          </div>
          <QuickAddComposer
            actors={actors}
            draft={draft}
            isSaving={isSaving}
            onDraftChange={onDraftChange}
            onSubmit={onCreateCard}
          />
        </div>
      )}
    </aside>
  );
}
