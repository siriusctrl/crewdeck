import type React from "react";

import type { Actor } from "@crewdeck/core";

import type { CardDraft } from "../lib/draft";
import {
  cn,
  eyebrowClass,
  fieldClass,
  fieldLabelClass,
  fieldLabelTextClass,
  primaryButtonClass,
} from "../lib/ui";

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
    <form className="grid gap-[0.9rem]" onSubmit={onSubmit}>
      <p className={eyebrowClass}>New card</p>
      <div className="grid gap-[0.85rem]">
        <label className={fieldLabelClass}>
          <span className={fieldLabelTextClass}>Title</span>
          <input
            className={fieldClass}
            value={draft.title}
            onChange={(event) => onDraftChange("title", event.target.value)}
            placeholder="Refine drag states"
            required
          />
        </label>
        <label className={fieldLabelClass}>
          <span className={fieldLabelTextClass}>Description</span>
          <input
            className={fieldClass}
            value={draft.description}
            onChange={(event) => onDraftChange("description", event.target.value)}
            placeholder="What needs to happen?"
          />
        </label>
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
        <button
          className={cn(primaryButtonClass, "mt-1 min-h-[3.1rem] justify-self-start")}
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Working..." : "Create card"}
        </button>
      </div>
    </form>
  );
}
