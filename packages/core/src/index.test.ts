import { describe, expect, it } from "vitest";

import {
  canTransitionCard,
  createCard,
  createComment,
  normalizeLabels,
  normalizeTitle,
  transitionCard,
} from "./index";

describe("@crewdeck/core", () => {
  it("normalizes card labels", () => {
    expect(normalizeLabels([" Bug ", "bug", "Research"])).toEqual([
      "bug",
      "research",
    ]);
  });

  it("rejects very short titles", () => {
    expect(() => normalizeTitle(" a ")).toThrowError(
      "Title must be at least 3 characters long",
    );
  });

  it("creates cards in backlog", () => {
    const card = createCard(
      {
        boardId: "board-1",
        title: "Ship SQLite API",
        labels: ["Backend", "Backend"],
      },
      "2026-03-12T00:00:00.000Z",
      "card-1",
    );

    expect(card.status).toBe("backlog");
    expect(card.labels).toEqual(["backend"]);
  });

  it("allows review to move back to in progress", () => {
    expect(canTransitionCard("review", "in_progress")).toBe(true);
  });

  it("blocks invalid status transitions", () => {
    const card = createCard(
      {
        boardId: "board-1",
        title: "Design the board",
      },
      "2026-03-12T00:00:00.000Z",
      "card-1",
    );

    expect(() =>
      transitionCard(card, "done", "2026-03-12T01:00:00.000Z"),
    ).toThrowError("Invalid card transition: backlog -> done");
  });

  it("requires comment bodies", () => {
    expect(() =>
      createComment(
        "card-1",
        { authorId: "actor-1", body: "   " },
        "2026-03-12T00:00:00.000Z",
        "comment-1",
      ),
    ).toThrowError("Comment body is required");
  });
});
