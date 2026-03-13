import { randomUUID } from "node:crypto";

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

import { getAgentAdapter } from "../adapters";
import { db } from "./client";
import { insertBoard, insertCard, insertCommentRecord, now, touchCard } from "./helpers";
import { type DbRow, rowToActor, rowToAgentRun, rowToBoard, rowToCard, rowToComment } from "./mappers";

const demoUpdates = [
  "I split the problem into a local data model, an API slice, and a review workflow. The next step is wiring the UI.",
  "The current blocker is not complexity, it is discipline. Keep the MVP focused on a single-user operator with agent collaborators.",
  "Latest pass tightened the scope: no auth, no org model, no multi-user state. That keeps delivery fast.",
];

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
  insertBoard(db, board);
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
      .prepare("SELECT * FROM comments WHERE card_id = ? ORDER BY created_at ASC")
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
  insertCard(db, card);
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
  insertCommentRecord(db, comment);
  touchCard(db, cardId, comment.createdAt);

  return {
    ...comment,
    author: actor,
  };
}

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
    db,
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
  touchCard(db, cardId, createdAt);

  if (execution.nextStatus && execution.nextStatus !== card.status) {
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
