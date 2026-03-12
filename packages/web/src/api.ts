import type {
  Actor,
  Board,
  Card,
  CardDetail,
  CommentDetail,
  CreateCommentInput,
} from "@crewdeck/core";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = (await response.json()) as { data?: T; error?: string };

  if (!response.ok || payload.error) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  if (payload.data === undefined) {
    throw new Error("Response payload is missing data");
  }

  return payload.data;
}

export function listActors(): Promise<Actor[]> {
  return request("/api/actors");
}

export function listBoards(): Promise<Board[]> {
  return request("/api/boards");
}

export function getBoardSnapshot(
  boardId: string,
): Promise<{ board: Board; cards: Card[] }> {
  return request(`/api/boards/${boardId}/cards`);
}

export function getCard(cardId: string): Promise<CardDetail> {
  return request(`/api/cards/${cardId}`);
}

export function createCard(
  boardId: string,
  input: {
    title: string;
    description?: string;
    assigneeId?: string;
    reviewerId?: string;
    labels?: string[];
  },
): Promise<Card> {
  return request(`/api/boards/${boardId}/cards`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCardStatus(cardId: string, status: Card["status"]): Promise<Card> {
  return request(`/api/cards/${cardId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateCardAssignment(
  cardId: string,
  input: {
    assigneeId?: string;
    reviewerId?: string;
  },
): Promise<Card> {
  return request(`/api/cards/${cardId}/assignment`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createComment(
  cardId: string,
  input: CreateCommentInput,
): Promise<CommentDetail> {
  return request(`/api/cards/${cardId}/comments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function pingAgent(cardId: string, note?: string): Promise<void> {
  return request(`/api/cards/${cardId}/agent-updates`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}
