import type React from "react";

import type { Actor } from "@crewdeck/core";

import type { CardDraft } from "../lib/draft";
import { cn, fieldClass, fieldLabelClass, fieldLabelTextClass, primaryButtonClass } from "../lib/ui";

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
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className={fieldLabelClass}>
        <span className={fieldLabelTextClass}>Title</span>
        <input
          className={fieldClass}
          value={draft.title}
          onChange={(event) => onDraftChange("title", event.target.value)}
          placeholder="What needs to be done?"
          required
        />
      </label>
      <label className={fieldLabelClass}>
        <span className={fieldLabelTextClass}>Description</span>
        <input
          className={fieldClass}
          value={draft.description}
          onChange={(event) => onDraftChange("description", event.target.value)}
          placeholder="Optional details"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={fieldLabelClass}>
          <span className={fieldLabelTextClass}>Assignee</span>
          <select
            className={fieldClass}
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
        <label className={fieldLabelClass}>
          <span className={fieldLabelTextClass}>Reviewer</span>
          <select
            className={fieldClass}
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
      </div>
      <button
        className={cn(primaryButtonClass, "mt-1 justify-self-start")}
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? "Creating…" : "Create card"}
      </button>
    </form>
  );
}
