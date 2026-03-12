import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import {
  createBoard,
  createCard,
  createComment,
  isAgentActor,
  reassignCard,
  transitionCard,
  type Actor,
  type AgentRun,
  type AgentRunDetail,
  type Board,
  type Card,
  type CardDetail,
  type CommentDetail,
  type CreateBoardInput,
  type CreateCardInput,
  type CreateCommentInput,
  type UpdateCardAssignmentInput,
  type CardStatus,
} from "@crewdeck/core";
import { getAgentAdapter } from "./adapters";
import { runMigrations } from "./migrations";

type DbRow = Record<string, unknown>;

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const dataDir = path.join(rootDir, "data");
const dbPath = path.join(dataDir, "crewdeck.sqlite");

mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
runMigrations(db);

function now(): string {
  return new Date().toISOString();
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function rowToActor(row: DbRow): Actor {
  return {
    id: String(row.id),
    type: row.type === "agent" ? "agent" : "human",
    name: String(row.name),
    backend: asString(row.backend),
    isSystem: Number(row.is_system) === 1,
  };
}

function rowToBoard(row: DbRow): Board {
  return {
    id: String(row.id),
    name: String(row.name),
    description: asString(row.description),
    repoUrl: asString(row.repo_url),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToCard(row: DbRow): Card {
  return {
    id: String(row.id),
    boardId: String(row.board_id),
    title: String(row.title),
    description: asString(row.description),
    status: row.status as CardStatus,
    assigneeId: asString(row.assignee_id),
    reviewerId: asString(row.reviewer_id),
    labels: JSON.parse(String(row.labels_json)) as string[],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToComment(row: DbRow, author: Actor): CommentDetail {
  return {
    id: String(row.id),
    cardId: String(row.card_id),
    authorId: String(row.author_id),
    body: String(row.body),
    createdAt: String(row.created_at),
    author,
  };
}

function rowToAgentRun(row: DbRow, actor: Actor): AgentRunDetail {
  return {
    id: String(row.id),
    cardId: String(row.card_id),
    actorId: String(row.actor_id),
    status: String(row.status) as AgentRun["status"],
    summary: String(row.summary),
    createdAt: String(row.created_at),
    actor,
  };
}

function insertBoard(board: Board): void {
  db.prepare(
    `
      INSERT INTO boards (id, name, description, repo_url, created_at, updated_at)
      VALUES (@id, @name, @description, @repoUrl, @createdAt, @updatedAt)
    `,
  ).run(board);
}

function insertCard(card: Card): void {
  db.prepare(
    `
      INSERT INTO cards (
        id,
        board_id,
        title,
        description,
        status,
        assignee_id,
        reviewer_id,
        labels_json,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @boardId,
        @title,
        @description,
        @status,
        @assigneeId,
        @reviewerId,
        @labelsJson,
        @createdAt,
        @updatedAt
      )
    `,
  ).run({
    ...card,
    labelsJson: JSON.stringify(card.labels),
  });
}

function insertCommentRecord(comment: ReturnType<typeof createComment>): void {
  db.prepare(
    `
      INSERT INTO comments (id, card_id, author_id, body, created_at)
      VALUES (@id, @cardId, @authorId, @body, @createdAt)
    `,
  ).run(comment);
}

function touchCard(cardId: string, updatedAt: string): void {
  db.prepare(
    `
      UPDATE cards
      SET updated_at = ?
      WHERE id = ?
    `,
  ).run(updatedAt, cardId);
}

function upsertActor(actor: Actor): void {
  db.prepare(
    `
      INSERT INTO actors (id, type, name, backend, is_system)
      VALUES (@id, @type, @name, @backend, @isSystem)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        name = excluded.name,
        backend = excluded.backend,
        is_system = excluded.is_system
    `,
  ).run({
    id: actor.id,
    type: actor.type,
    name: actor.name,
    backend: actor.backend ?? null,
    isSystem: actor.isSystem ? 1 : 0,
  });
}

function seedDatabase(): void {
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
    insertBoard(board);
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

  actors.forEach(upsertActor);

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
      insertCard(card);
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
      insertCommentRecord(comment);
    }
  });
}

seedDatabase();

export function listActors(): Actor[] {
  return (db.prepare("SELECT * FROM actors ORDER BY type, name").all() as DbRow[]).map(
    rowToActor,
  );
}

export function listBoards(): Board[] {
  return (db.prepare("SELECT * FROM boards ORDER BY created_at ASC").all() as DbRow[]).map(
    rowToBoard,
  );
}

export function createBoardRecord(input: CreateBoardInput): Board {
  const board = createBoard(input, now(), randomUUID());
  insertBoard(board);
  return board;
}

export function getBoard(boardId: string): Board | undefined {
  const row = db
    .prepare("SELECT * FROM boards WHERE id = ?")
    .get(boardId) as DbRow | undefined;

  return row ? rowToBoard(row) : undefined;
}

export function listCardsByBoard(boardId: string): Card[] {
  return (
    db
      .prepare(
        "SELECT * FROM cards WHERE board_id = ? ORDER BY updated_at DESC, created_at DESC",
      )
      .all(boardId) as DbRow[]
  ).map(rowToCard);
}

function getActorMap(): Map<string, Actor> {
  return new Map(listActors().map((actor) => [actor.id, actor]));
}

export function listCardRuns(cardId: string): AgentRunDetail[] {
  const actorMap = getActorMap();

  return (
    db
      .prepare(
        "SELECT * FROM agent_runs WHERE card_id = ? ORDER BY created_at DESC",
      )
      .all(cardId) as DbRow[]
  ).flatMap((runRow) => {
    const actor = actorMap.get(String(runRow.actor_id));

    if (!actor) {
      return [];
    }

    return [rowToAgentRun(runRow, actor)];
  });
}

export function getCardDetail(cardId: string): CardDetail | undefined {
  const row = db
    .prepare("SELECT * FROM cards WHERE id = ?")
    .get(cardId) as DbRow | undefined;

  if (!row) {
    return undefined;
  }

  const card = rowToCard(row);
  const actorMap = getActorMap();

  const comments = (
    db
      .prepare(
        "SELECT * FROM comments WHERE card_id = ? ORDER BY created_at ASC",
      )
      .all(cardId) as DbRow[]
  ).map((commentRow) => {
    const author = actorMap.get(String(commentRow.author_id));

    if (!author) {
      throw new Error(`Missing author for comment ${commentRow.id}`);
    }

    return rowToComment(commentRow, author);
  });

  return {
    ...card,
    assignee: card.assigneeId ? actorMap.get(card.assigneeId) : undefined,
    reviewer: card.reviewerId ? actorMap.get(card.reviewerId) : undefined,
    comments,
    runs: listCardRuns(card.id),
  };
}

export function createCardRecord(input: CreateCardInput): Card {
  const card = createCard(input, now(), randomUUID());
  insertCard(card);
  return card;
}

export function updateCardStatus(cardId: string, status: CardStatus): Card {
  const existing = getCardDetail(cardId);

  if (!existing) {
    throw new Error("Card not found");
  }

  const updated = transitionCard(existing, status, now());

  db.prepare(
    `
      UPDATE cards
      SET status = @status, updated_at = @updatedAt
      WHERE id = @id
    `,
  ).run(updated);

  return updated;
}

export function updateCardAssignment(
  cardId: string,
  input: UpdateCardAssignmentInput,
): Card {
  const existing = getCardDetail(cardId);

  if (!existing) {
    throw new Error("Card not found");
  }

  const updated = reassignCard(existing, input, now());

  db.prepare(
    `
      UPDATE cards
      SET assignee_id = @assigneeId, reviewer_id = @reviewerId, updated_at = @updatedAt
      WHERE id = @id
    `,
  ).run(updated);

  return updated;
}

export function createCommentRecord(
  cardId: string,
  input: CreateCommentInput,
): CommentDetail {
  const card = getCardDetail(cardId);

  if (!card) {
    throw new Error("Card not found");
  }

  const actor = listActors().find((candidate) => candidate.id === input.authorId);

  if (!actor) {
    throw new Error("Author not found");
  }

  const comment = createComment(cardId, input, now(), randomUUID());
  insertCommentRecord(comment);
  touchCard(cardId, comment.createdAt);

  return {
    ...comment,
    author: actor,
  };
}

const demoUpdates = [
  "I split the problem into a local data model, an API slice, and a review workflow. The next step is wiring the UI.",
  "The current blocker is not complexity, it is discipline. Keep the MVP focused on a single-user operator with agent collaborators.",
  "Latest pass tightened the scope: no auth, no org model, no multi-user state. That keeps delivery fast.",
];

export function createDemoAgentUpdate(cardId: string, note?: string): AgentRun {
  const card = getCardDetail(cardId);

  if (!card) {
    throw new Error("Card not found");
  }

  if (!isAgentActor(card.assignee)) {
    throw new Error("Card must be assigned to an agent");
  }

  const createdAt = now();
  const board = getBoard(card.boardId);

  if (!board) {
    throw new Error("Board not found");
  }

  const adapter = getAgentAdapter(card.assignee);

  if (!adapter) {
    throw new Error(`No adapter registered for backend ${card.assignee.backend}`);
  }

  const execution = adapter.execute({
    actor: card.assignee,
    board,
    card,
    now: createdAt,
  });
  const summary =
    note?.trim() ||
    execution.summary ||
    demoUpdates[Math.floor(Math.random() * demoUpdates.length)]!;
  const run: AgentRun = {
    id: randomUUID(),
    cardId,
    actorId: card.assignee.id,
    status: execution.status,
    summary,
    createdAt,
  };

  db.prepare(
    `
      INSERT INTO agent_runs (id, card_id, actor_id, status, summary, created_at)
      VALUES (@id, @cardId, @actorId, @status, @summary, @createdAt)
    `,
  ).run(run);

  insertCommentRecord(
    createComment(
      cardId,
      {
        authorId: card.assignee.id,
        body: note?.trim() || execution.commentBody,
      },
      createdAt,
      randomUUID(),
    ),
  );
  touchCard(cardId, createdAt);

  if (
    execution.nextStatus &&
    execution.nextStatus !== card.status
  ) {
    const nextCard = transitionCard(card, execution.nextStatus, createdAt);

    db.prepare(
      `
        UPDATE cards
        SET status = @status, updated_at = @updatedAt
        WHERE id = @id
      `,
    ).run(nextCard);
  }

  return run;
}
