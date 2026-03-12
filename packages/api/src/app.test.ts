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
});
