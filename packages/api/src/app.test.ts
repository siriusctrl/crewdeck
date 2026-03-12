import { describe, expect, it } from "vitest";

import app from "./app";

describe("@crewdeck/api", () => {
  it("returns health status", async () => {
    const response = await app.request("/api/health");
    const payload = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
  });

  it("returns seeded boards and cards", async () => {
    const boardsResponse = await app.request("/api/boards");
    const boardsPayload = (await boardsResponse.json()) as {
      data: Array<{ id: string }>;
    };

    expect(boardsPayload.data.length).toBeGreaterThan(0);

    const boardId = boardsPayload.data[0]?.id;
    expect(boardId).toBeTruthy();

    const cardsResponse = await app.request(`/api/boards/${boardId}/cards`);
    const cardsPayload = (await cardsResponse.json()) as {
      data: { cards: Array<{ id: string }> };
    };

    expect(cardsResponse.status).toBe(200);
    expect(cardsPayload.data.cards.length).toBeGreaterThan(0);
  });

  it("routes agent updates through the adapter registry", async () => {
    const runResponse = await app.request("/api/cards/card-adapter/agent-updates", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const runPayload = (await runResponse.json()) as {
      data: { actorId: string; status: string };
    };

    expect(runResponse.status).toBe(201);
    expect(runPayload.data.actorId).toBe("agent-claude");
    expect(runPayload.data.status).toBe("completed");

    const cardResponse = await app.request("/api/cards/card-adapter");
    const cardPayload = (await cardResponse.json()) as {
      data: { status: string; runs: Array<{ actorId: string }> };
    };

    expect(cardPayload.data.status).toBe("review");
    expect(cardPayload.data.runs[0]?.actorId).toBe("agent-claude");
  });
});
