import { Hono } from "hono";
import { cors } from "hono/cors";

import {
  createBoardRecord,
  createCardRecord,
  createCommentRecord,
  createDemoAgentUpdate,
  getBoard,
  getCardDetail,
  listActors,
  listBoards,
  listCardsByBoard,
  updateCardAssignment,
  updateCardStatus,
} from "./db";

const app = new Hono();

app.use("/api/*", cors());

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/actors", (c) => c.json({ data: listActors() }));

app.get("/api/boards", (c) => c.json({ data: listBoards() }));

app.post("/api/boards", async (c) => {
  const body = await c.req.json();
  const board = createBoardRecord({
    name: typeof body.name === "string" ? body.name : "",
    description:
      typeof body.description === "string" ? body.description : undefined,
    repoUrl: typeof body.repoUrl === "string" ? body.repoUrl : undefined,
  });

  return c.json({ data: board }, 201);
});

app.get("/api/boards/:boardId/cards", (c) => {
  const boardId = c.req.param("boardId");
  const board = getBoard(boardId);

  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }

  return c.json({
    data: {
      board,
      cards: listCardsByBoard(boardId),
    },
  });
});

app.post("/api/boards/:boardId/cards", async (c) => {
  const boardId = c.req.param("boardId");

  if (!getBoard(boardId)) {
    return c.json({ error: "Board not found" }, 404);
  }

  const body = await c.req.json();
  const card = createCardRecord({
    boardId,
    title: typeof body.title === "string" ? body.title : "",
    description:
      typeof body.description === "string" ? body.description : undefined,
    assigneeId: typeof body.assigneeId === "string" ? body.assigneeId : undefined,
    reviewerId: typeof body.reviewerId === "string" ? body.reviewerId : undefined,
    labels: Array.isArray(body.labels)
      ? body.labels.filter(
          (label: unknown): label is string => typeof label === "string",
        )
      : [],
  });

  return c.json({ data: card }, 201);
});

app.get("/api/cards/:cardId", (c) => {
  const card = getCardDetail(c.req.param("cardId"));

  if (!card) {
    return c.json({ error: "Card not found" }, 404);
  }

  return c.json({ data: card });
});

app.patch("/api/cards/:cardId/status", async (c) => {
  try {
    const body = await c.req.json();
    const card = updateCardStatus(c.req.param("cardId"), body.status);
    return c.json({ data: card });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update card status";
    const status = message === "Card not found" ? 404 : 400;
    return c.json({ error: message }, status);
  }
});

app.patch("/api/cards/:cardId/assignment", async (c) => {
  try {
    const body = await c.req.json();
    const card = updateCardAssignment(c.req.param("cardId"), {
      assigneeId: typeof body.assigneeId === "string" ? body.assigneeId : undefined,
      reviewerId: typeof body.reviewerId === "string" ? body.reviewerId : undefined,
    });

    return c.json({ data: card });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update assignment";
    const status = message === "Card not found" ? 404 : 400;
    return c.json({ error: message }, status);
  }
});

app.post("/api/cards/:cardId/comments", async (c) => {
  try {
    const body = await c.req.json();
    const comment = createCommentRecord(c.req.param("cardId"), {
      authorId: typeof body.authorId === "string" ? body.authorId : "",
      body: typeof body.body === "string" ? body.body : "",
    });

    return c.json({ data: comment }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to add comment";
    const status =
      message === "Card not found" || message === "Author not found" ? 404 : 400;
    return c.json({ error: message }, status);
  }
});

app.post("/api/cards/:cardId/agent-updates", async (c) => {
  try {
    const body = await c.req.json();
    const run = createDemoAgentUpdate(
      c.req.param("cardId"),
      typeof body.note === "string" ? body.note : undefined,
    );

    return c.json({ data: run }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create agent update";
    const status = message === "Card not found" ? 404 : 400;
    return c.json({ error: message }, status);
  }
});

export default app;
