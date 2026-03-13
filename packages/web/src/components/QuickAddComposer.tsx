import type React from "react";

import type { Actor } from "@crewdeck/core";

import type { CardDraft } from "../lib/draft";

type QuickAddComposerProps = {
  actors: Actor[];
  draft: CardDraft;
  isSaving: boolean;
  onDraftChange: (field: keyof CardDraft, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
};

export function QuickAddComposer({
  actors,
  draft,
  isSaving,
  onDraftChange,
  onSubmit,
}: QuickAddComposerProps) {
  return (
    <form className="composer compact" onSubmit={onSubmit}>
      <div className="panel-heading compact">
        <p className="eyebrow">Quick Add</p>
        <h3>Cut the next task straight onto the board.</h3>
      </div>
      <div className="composer-grid">
        <label className="field-title">
          <span>Title</span>
          <input
            value={draft.title}
            onChange={(event) => onDraftChange("title", event.target.value)}
            placeholder="Shape the review flow"
            required
          />
        </label>
        <label className="field-description">
          <span>Description</span>
          <input
            value={draft.description}
            onChange={(event) => onDraftChange("description", event.target.value)}
            placeholder="Define the smallest cut that proves the system."
          />
        </label>
        <label className="field-assignee">
          <span>Assignee</span>
          <select
            value={draft.assigneeId}
            onChange={(event) => onDraftChange("assigneeId", event.target.value)}
          >
            <option value="">Unassigned</option>
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-reviewer">
          <span>Reviewer</span>
          <select
            value={draft.reviewerId}
            onChange={(event) => onDraftChange("reviewerId", event.target.value)}
          >
            <option value="">Unassigned</option>
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="primary-button create-card-button"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Working..." : "Create card"}
        </button>
      </div>
    </form>
  );
}
