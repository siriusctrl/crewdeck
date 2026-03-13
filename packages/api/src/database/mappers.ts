import type {
  Actor,
  AgentRun,
  AgentRunDetail,
  Board,
  Card,
  CardStatus,
  CommentDetail,
} from "@crewdeck/core";

export type DbRow = Record<string, unknown>;

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function rowToActor(row: DbRow): Actor {
  return {
    id: String(row.id),
    type: row.type === "agent" ? "agent" : "human",
    name: String(row.name),
    backend: asString(row.backend),
    isSystem: Number(row.is_system) === 1,
  };
}

export function rowToBoard(row: DbRow): Board {
  return {
    id: String(row.id),
    name: String(row.name),
    description: asString(row.description),
    repoUrl: asString(row.repo_url),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function rowToCard(row: DbRow): Card {
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

export function rowToComment(row: DbRow, author: Actor): CommentDetail {
  return {
    id: String(row.id),
    cardId: String(row.card_id),
    authorId: String(row.author_id),
    body: String(row.body),
    createdAt: String(row.created_at),
    author,
  };
}

export function rowToAgentRun(row: DbRow, actor: Actor): AgentRunDetail {
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
