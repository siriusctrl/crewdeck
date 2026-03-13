import { describe, expect, it } from "vitest";

import { actorLabel, formatStatus, nextStatusOptions } from "./board";

describe("@crewdeck/web board helpers", () => {
  it("formats underscored statuses for display", () => {
    expect(formatStatus("in_progress")).toBe("in progress");
    expect(formatStatus("review")).toBe("review");
  });

  it("resolves assignee labels safely", () => {
    const actors = [
      { id: "human-you", type: "human" as const, name: "You" },
      {
        id: "agent-codex",
        type: "agent" as const,
        name: "Codex",
        backend: "codex",
      },
    ];

    expect(actorLabel(undefined, actors)).toBe("Unassigned");
    expect(actorLabel("agent-codex", actors)).toBe("Codex");
    expect(actorLabel("missing", actors)).toBe("Unknown");
  });

  it("returns the expected next status options", () => {
    expect(nextStatusOptions("backlog")).toEqual(["in_progress"]);
    expect(nextStatusOptions("in_progress")).toEqual(["backlog", "review"]);
    expect(nextStatusOptions("review")).toEqual(["in_progress", "done"]);
    expect(nextStatusOptions("done")).toEqual(["review"]);
  });
});
