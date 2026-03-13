import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

const testDataDir = mkdtempSync(path.join(os.tmpdir(), "crewdeck-api-test-"));
const testDbPath = path.join(testDataDir, "crewdeck.sqlite");

process.env.CREWDECK_DB_PATH = testDbPath;

const [{ default: app }, { db }] = await Promise.all([
  import("./app"),
  import("./database/client"),
]);

afterAll(() => {
  db.close();
  rmSync(testDataDir, { recursive: true, force: true });
  delete process.env.CREWDECK_DB_PATH;
});

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
    const title = `Adapter smoke test ${Date.now()}`;

    const createResponse = await app.request("/api/boards/board-studio/cards", {
      method: "POST",
      body: JSON.stringify({
        title,
        assigneeId: "agent-claude",
        reviewerId: "human-you",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const createPayload = (await createResponse.json()) as {
      data: { id: string };
    };

    await app.request(`/api/cards/${createPayload.data.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "in_progress" }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const runResponse = await app.request(
      `/api/cards/${createPayload.data.id}/agent-updates`,
      {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const runPayload = (await runResponse.json()) as {
      data: { actorId: string; status: string };
    };

    expect(runResponse.status).toBe(201);
    expect(runPayload.data.actorId).toBe("agent-claude");
    expect(runPayload.data.status).toBe("completed");

    const boardCardsResponse = await app.request("/api/boards/board-studio/cards");
    const boardCardsPayload = (await boardCardsResponse.json()) as {
      data: { cards: Array<{ id: string; title: string }> };
    };
    const matchingCards = boardCardsPayload.data.cards.filter(
      (card) => card.title === title,
    );

    expect(matchingCards).toHaveLength(1);
    expect(matchingCards[0]?.id).toBe(createPayload.data.id);

    const cardResponse = await app.request(`/api/cards/${createPayload.data.id}`);
    const cardPayload = (await cardResponse.json()) as {
      data: { status: string; runs: Array<{ actorId: string }> };
    };

    expect(cardPayload.data.status).toBe("review");
    expect(cardPayload.data.runs[0]?.actorId).toBe("agent-claude");
  });
});
