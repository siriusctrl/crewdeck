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
  primaryButtonClass,
} from "../lib/ui";
import { QuickAddComposer } from "./QuickAddComposer";

type CardInspectorProps = {
  actors: Actor[];
  draft: CardDraft;
  mode: "detail" | "compose";
  isLoadingCard: boolean;
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
  mode,
  isLoadingCard,
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
  if (mode === "detail" && isLoadingCard) {
    return (
      <div className="grid gap-4">
        <div>
          <span className={eyebrowClass}>Card</span>
          <h2 className={cn(displayTitleClass, "mt-1 text-lg")}>Loading…</h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Fetching the latest card details.
          </p>
        </div>
      </div>
    );
  }

  if (selectedCard) {
    return (
      <div className="grid gap-4">
        <div>
          <span className={eyebrowClass}>{formatStatus(selectedCard.status)}</span>
          <h2 className={cn(displayTitleClass, "mt-1 text-lg")}>{selectedCard.title}</h2>
          {selectedCard.description ? (
            <p className="mt-1.5 text-sm text-[var(--muted)]">{selectedCard.description}</p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={fieldLabelClass}>
            <span className={fieldLabelTextClass}>Assignee</span>
            <select
              className={fieldClass}
              value={selectedCard.assigneeId || ""}
              onChange={(e) => void onAssignmentChange("assigneeId", e.target.value)}
            >
              <option value="">Unassigned</option>
              {actors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <label className={fieldLabelClass}>
            <span className={fieldLabelTextClass}>Reviewer</span>
            <select
              className={fieldClass}
              value={selectedCard.reviewerId || ""}
              onChange={(e) => void onAssignmentChange("reviewerId", e.target.value)}
            >
              <option value="">Unassigned</option>
              {actors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {nextStatusOptions(selectedCard.status).map((status) => (
            <button
              key={status}
              className={ghostButtonClass}
              onClick={() => void onMoveCard(selectedCard.id, status)}
              type="button"
            >
              → {formatStatus(status)}
            </button>
          ))}
          {selectedCard.assignee?.type === "agent" ? (
            <button
              className={accentButtonClass}
              onClick={() => void onPingAgent()}
              type="button"
            >
              Ping {selectedCard.assignee.name}
            </button>
          ) : null}
        </div>
        <div className="border-t border-[var(--line)] pt-3">
          <div className="mb-3 flex gap-1">
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                detailTab === "runs"
                  ? "bg-[var(--ink)] text-[var(--page-fill)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]",
              )}
              onClick={() => onDetailTabChange("runs")}
              type="button"
            >
              Runs
            </button>
            <button
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                detailTab === "discussion"
                  ? "bg-[var(--ink)] text-[var(--page-fill)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]",
              )}
              onClick={() => onDetailTabChange("discussion")}
              type="button"
            >
              Discussion
            </button>
          </div>

          {detailTab === "runs" ? (
            <div className="grid gap-2">
              {selectedCard.runs.length > 0 ? (
                selectedCard.runs.map((run) => (
                  <article key={run.id} className="rounded-md border border-[var(--entry-border)] bg-[var(--entry-bg)] p-3">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium">{run.actor.name}</span>
                      <span className="text-[var(--muted)]">{new Date(run.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">{run.summary}</p>
                    <span className="mt-1 inline-block text-[11px] font-medium uppercase tracking-wide text-[var(--accent)]">{run.status}</span>
                  </article>
                ))
              ) : (
                <p className="py-4 text-center text-[13px] text-[var(--muted)]">No agent runs yet</p>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-2">
                {selectedCard.comments.map((comment) => (
                  <article key={comment.id} className="rounded-md border border-[var(--entry-border)] bg-[var(--entry-bg)] p-3">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium">{comment.author.name}</span>
                      <span className="text-[var(--muted)]">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">{comment.body}</p>
                  </article>
                ))}
              </div>
              <form className="grid gap-2" onSubmit={onAddComment}>
                <textarea
                  className={cn(fieldClass, "min-h-20")}
                  value={commentBody}
                  onChange={(e) => onCommentBodyChange(e.target.value)}
                  placeholder="Add a note…"
                  rows={3}
                />
                <button className={cn(primaryButtonClass, "justify-self-start")} disabled={isSaving} type="submit">
                  Add note
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div>
        <span className={eyebrowClass}>New card</span>
        <h2 className={cn(displayTitleClass, "mt-1 text-lg")}>Create a card</h2>
      </div>
      <QuickAddComposer
        actors={actors}
        draft={draft}
        isSaving={isSaving}
        onDraftChange={onDraftChange}
        onSubmit={onCreateCard}
      />
    </div>
  );
}
