import type Database from "better-sqlite3";

import { createComment, type Actor, type Board, type Card } from "@crewdeck/core";

export function now(): string {
  return new Date().toISOString();
}

export function insertBoard(db: Database.Database, board: Board): void {
  db.prepare(
    `
      INSERT INTO boards (id, name, description, repo_url, created_at, updated_at)
      VALUES (@id, @name, @description, @repoUrl, @createdAt, @updatedAt)
    `,
  ).run(board);
}

export function insertCard(db: Database.Database, card: Card): void {
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

export function insertCommentRecord(
  db: Database.Database,
  comment: ReturnType<typeof createComment>,
): void {
  db.prepare(
    `
      INSERT INTO comments (id, card_id, author_id, body, created_at)
      VALUES (@id, @cardId, @authorId, @body, @createdAt)
    `,
  ).run(comment);
}

export function upsertActor(db: Database.Database, actor: Actor): void {
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

export function touchCard(
  db: Database.Database,
  cardId: string,
  updatedAt: string,
): void {
  db.prepare(
    `
      UPDATE cards
      SET updated_at = ?
      WHERE id = ?
    `,
  ).run(updatedAt, cardId);
}
