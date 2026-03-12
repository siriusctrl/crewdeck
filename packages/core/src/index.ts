export const cardStatuses = ["backlog", "in_progress", "review", "done"] as const;

export type CardStatus = (typeof cardStatuses)[number];
export type ActorType = "human" | "agent";
export type AgentBackend = "codex" | "claude-code" | "openclaw" | string;
export type AgentRunStatus = "queued" | "running" | "completed" | "failed";

export interface Actor {
  id: string;
  type: ActorType;
  name: string;
  backend?: AgentBackend;
  isSystem?: boolean;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  repoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  status: CardStatus;
  assigneeId?: string;
  reviewerId?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CardDetail extends Card {
  assignee?: Actor;
  reviewer?: Actor;
  comments: CommentDetail[];
}

export interface Comment {
  id: string;
  cardId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface CommentDetail extends Comment {
  author: Actor;
}

export interface AutomationRule {
  id: string;
  boardId: string;
  onStatus: CardStatus;
  action: "assign_reviewer" | "notify" | "trigger_agent";
  targetActorId: string;
}

export interface AgentRun {
  id: string;
  cardId: string;
  actorId: string;
  status: AgentRunStatus;
  summary: string;
  createdAt: string;
}

export interface CreateBoardInput {
  name: string;
  description?: string;
  repoUrl?: string;
}

export interface CreateCardInput {
  boardId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  reviewerId?: string;
  labels?: string[];
}

export interface UpdateCardStatusInput {
  status: CardStatus;
}

export interface UpdateCardAssignmentInput {
  assigneeId?: string;
  reviewerId?: string;
}

export interface CreateCommentInput {
  body: string;
  authorId: string;
}

export interface DemoAgentUpdateInput {
  note?: string;
}

const allowedTransitions: Record<CardStatus, CardStatus[]> = {
  backlog: ["in_progress"],
  in_progress: ["backlog", "review"],
  review: ["in_progress", "done"],
  done: ["review"],
};

export function canTransitionCard(
  from: CardStatus,
  to: CardStatus,
): boolean {
  return allowedTransitions[from].includes(to);
}

export function assertValidCardStatusTransition(
  from: CardStatus,
  to: CardStatus,
): void {
  if (from === to) {
    return;
  }

  if (!canTransitionCard(from, to)) {
    throw new Error(`Invalid card transition: ${from} -> ${to}`);
  }
}

export function normalizeTitle(title: string): string {
  const normalized = title.trim().replace(/\s+/g, " ");

  if (normalized.length < 3) {
    throw new Error("Title must be at least 3 characters long");
  }

  return normalized;
}

export function normalizeOptionalText(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeLabels(labels?: string[]): string[] {
  if (!labels || labels.length === 0) {
    return [];
  }

  return Array.from(
    new Set(
      labels
        .map((label) => label.trim().toLowerCase())
        .filter((label) => label.length > 0),
    ),
  );
}

export function createBoard(
  input: CreateBoardInput,
  now: string,
  id: string,
): Board {
  return {
    id,
    name: normalizeTitle(input.name),
    description: normalizeOptionalText(input.description),
    repoUrl: normalizeOptionalText(input.repoUrl),
    createdAt: now,
    updatedAt: now,
  };
}

export function createCard(
  input: CreateCardInput,
  now: string,
  id: string,
): Card {
  return {
    id,
    boardId: input.boardId,
    title: normalizeTitle(input.title),
    description: normalizeOptionalText(input.description),
    status: "backlog",
    assigneeId: input.assigneeId,
    reviewerId: input.reviewerId,
    labels: normalizeLabels(input.labels),
    createdAt: now,
    updatedAt: now,
  };
}

export function transitionCard(
  card: Card,
  status: CardStatus,
  now: string,
): Card {
  assertValidCardStatusTransition(card.status, status);

  return {
    ...card,
    status,
    updatedAt: now,
  };
}

export function reassignCard(
  card: Card,
  assignment: UpdateCardAssignmentInput,
  now: string,
): Card {
  return {
    ...card,
    assigneeId: assignment.assigneeId,
    reviewerId: assignment.reviewerId,
    updatedAt: now,
  };
}

export function createComment(
  cardId: string,
  input: CreateCommentInput,
  now: string,
  id: string,
): Comment {
  const body = normalizeOptionalText(input.body);

  if (!body) {
    throw new Error("Comment body is required");
  }

  return {
    id,
    cardId,
    authorId: input.authorId,
    body,
    createdAt: now,
  };
}
