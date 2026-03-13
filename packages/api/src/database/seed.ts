import type Database from "better-sqlite3";

import { createBoard, createCard, createComment, transitionCard, type Actor } from "@crewdeck/core";

import { type DbRow } from "./mappers";
import { insertBoard, insertCard, insertCommentRecord, now, upsertActor } from "./helpers";

export function seedDatabase(db: Database.Database): void {
  const timestamp = now();
  const board = createBoard(
    {
      name: "Studio Board",
      description: "Single-user command center for human and agent work.",
      repoUrl: "https://github.com/siriusctrl/crewdeck",
    },
    timestamp,
    "board-studio",
  );

  const existingBoard = db
    .prepare("SELECT 1 FROM boards WHERE id = ?")
    .get(board.id) as DbRow | undefined;

  if (!existingBoard) {
    insertBoard(db, board);
  }

  const actors: Actor[] = [
    { id: "human-you", type: "human", name: "You", isSystem: true },
    {
      id: "agent-codex",
      type: "agent",
      name: "Codex",
      backend: "codex",
      isSystem: true,
    },
    {
      id: "agent-claude",
      type: "agent",
      name: "Claude Code",
      backend: "claude-code",
      isSystem: true,
    },
    {
      id: "agent-openclaw",
      type: "agent",
      name: "OpenClaw",
      backend: "openclaw",
      isSystem: true,
    },
  ];

  actors.forEach((actor) => upsertActor(db, actor));

  const cardA = createCard(
    {
      boardId: board.id,
      title: "Shape the single-user MVP",
      description: "Define the local-first architecture and tighten the product scope.",
      assigneeId: "agent-codex",
      reviewerId: "human-you",
      labels: ["strategy", "mvp"],
    },
    timestamp,
    "card-mvp",
  );

  const cardB = transitionCard(
    createCard(
      {
        boardId: board.id,
        title: "Draft the adapter contract",
        description: "Describe how agent backends plug into the local workflow engine.",
        assigneeId: "agent-claude",
        reviewerId: "human-you",
        labels: ["agents", "contracts"],
      },
      timestamp,
      "card-adapter",
    ),
    "in_progress",
    timestamp,
  );

  const cardC = transitionCard(
    transitionCard(
      createCard(
        {
          boardId: board.id,
          title: "Review board interaction patterns",
          description: "Pressure test the Kanban interactions before building drag-and-drop.",
          assigneeId: "human-you",
          reviewerId: "agent-openclaw",
          labels: ["ux", "review"],
        },
        timestamp,
        "card-review",
      ),
      "in_progress",
      timestamp,
    ),
    "review",
    timestamp,
  );

  [cardA, cardB, cardC].forEach((card) => {
    const exists = db
      .prepare("SELECT 1 FROM cards WHERE id = ?")
      .get(card.id) as DbRow | undefined;

    if (!exists) {
      insertCard(db, card);
    }
  });

  [
    createComment(
      cardA.id,
      {
        authorId: "agent-codex",
        body: "Single-user changes the data model in a good way: actors are workflow participants, not platform accounts.",
      },
      timestamp,
      "comment-1",
    ),
    createComment(
      cardB.id,
      {
        authorId: "agent-claude",
        body: "Adapter surface is small so far: assign task, post progress, request review.",
      },
      timestamp,
      "comment-2",
    ),
    createComment(
      cardC.id,
      {
        authorId: "human-you",
        body: "Need a review state that can bounce work back to in progress without losing context.",
      },
      timestamp,
      "comment-3",
    ),
  ].forEach((comment) => {
    const exists = db
      .prepare("SELECT 1 FROM comments WHERE id = ?")
      .get(comment.id) as DbRow | undefined;

    if (!exists) {
      insertCommentRecord(db, comment);
    }
  });
}
