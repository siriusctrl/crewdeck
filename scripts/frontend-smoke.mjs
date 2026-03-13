import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = mkdtempSync(path.join(tmpdir(), "crewdeck-frontend-smoke-"));
const dbPath = path.join(tempDir, "crewdeck.sqlite");
const apiPort = 3101;
const webPort = 4173;
const apiUrl = `http://127.0.0.1:${apiPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function spawnService(command, args, env) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";

  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  return {
    child,
    getOutput() {
      return output;
    },
  };
}

async function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Service is still booting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function stopService(service) {
  if (!service || service.child.exitCode !== null) {
    return;
  }

  service.child.kill("SIGTERM");

  await new Promise((resolve) => {
    service.child.once("exit", resolve);
    setTimeout(() => {
      if (service.child.exitCode === null) {
        service.child.kill("SIGKILL");
      }

      resolve();
    }, 5000);
  });
}

async function collectBoardState(page, title) {
  return page.evaluate((targetTitle) => {
    const columns = [...document.querySelectorAll(".column")].map((column) => ({
      heading: column.querySelector("h3")?.textContent?.trim() || "",
      cards: [...column.querySelectorAll(".task-card strong")].map((element) =>
        element.textContent?.trim() || "",
      ),
    }));

    return {
      theme: document.documentElement.dataset.theme,
      columns,
      matches: columns.reduce(
        (count, column) =>
          count +
          column.cards.filter((cardTitle) => cardTitle === targetTitle).length,
        0,
      ),
    };
  }, title);
}

function columnCards(state, heading) {
  return state.columns.find((column) => column.heading === heading)?.cards || [];
}

async function dispatchCardDrag(page, title, targetHeading) {
  await page.evaluate(
    ({ sourceTitle, nextHeading }) => {
      const source = [...document.querySelectorAll(".task-card")].find(
        (card) =>
          card.querySelector("strong")?.textContent?.trim() === sourceTitle,
      );
      const target = [...document.querySelectorAll(".column")].find(
        (column) => column.querySelector("h3")?.textContent?.trim() === nextHeading,
      );

      if (!source) {
        throw new Error(`Unable to find source card: ${sourceTitle}`);
      }

      if (!target) {
        throw new Error(`Unable to find target column: ${nextHeading}`);
      }

      const dataTransfer = new DataTransfer();
      source.dispatchEvent(
        new DragEvent("dragstart", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
      target.dispatchEvent(
        new DragEvent("dragenter", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
      target.dispatchEvent(
        new DragEvent("dragover", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
      target.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
      source.dispatchEvent(
        new DragEvent("dragend", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
    },
    { sourceTitle: title, nextHeading: targetHeading },
  );
}

let apiService;
let webService;
let browser;
let currentStep = "boot";

try {
  apiService = spawnService(
    "corepack",
    ["pnpm", "--filter", "@crewdeck/api", "exec", "tsx", "src/index.ts"],
    {
      PORT: String(apiPort),
      CREWDECK_DB_PATH: dbPath,
    },
  );

  await waitForUrl(`${apiUrl}/api/health`);

  webService = spawnService(
    "corepack",
    [
      "pnpm",
      "--filter",
      "@crewdeck/web",
      "exec",
      "vite",
      "--host",
      "127.0.0.1",
      "--port",
      String(webPort),
    ],
    {
      VITE_API_BASE_URL: apiUrl,
    },
  );

  await waitForUrl(webUrl);

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(webUrl, { waitUntil: "networkidle" });
  await page.waitForSelector(".board-header h2");

  const smokeTitle = `Smoke ${Date.now()}`;
  const smokeComment = `Note ${Date.now()}`;

  currentStep = "create card";
  await page.getByLabel("Title").fill(smokeTitle);
  await page.getByLabel("Description").fill("Exercise the main board workflow.");
  await page.getByLabel("Assignee").first().selectOption({ label: "Claude Code" });
  await page.getByRole("button", { name: "Create card" }).click();

  currentStep = "wait for created card";
  await page.waitForFunction(
    (title) =>
      [...document.querySelectorAll(".task-card strong")].some(
        (element) => element.textContent?.trim() === title,
      ),
    smokeTitle,
  );

  let state = await collectBoardState(page, smokeTitle);
  assert(state.matches === 1, `Expected one new card after creation, found ${state.matches}`);
  assert(
    columnCards(state, "Backlog").includes(smokeTitle),
    "New card should land in Backlog",
  );

  currentStep = "drag into in progress";
  await dispatchCardDrag(page, smokeTitle, "In Progress");

  currentStep = "wait for in progress";
  await page.waitForFunction(
    (title) => {
      const columns = [...document.querySelectorAll(".column")];
      const inProgress = columns.find(
        (column) => column.querySelector("h3")?.textContent?.trim() === "In Progress",
      );

      return !!inProgress &&
        [...inProgress.querySelectorAll(".task-card strong")].some(
          (element) => element.textContent?.trim() === title,
        );
    },
    smokeTitle,
  );

  state = await collectBoardState(page, smokeTitle);
  assert(state.matches === 1, `Expected one card after drag, found ${state.matches}`);
  assert(
    columnCards(state, "In Progress").includes(smokeTitle),
    "Dragged card should move into In Progress",
  );
  assert(
    !columnCards(state, "Backlog").includes(smokeTitle),
    "Dragged card should leave Backlog",
  );

  currentStep = "ping agent";
  await page.getByRole("button", { name: "Ping Claude Code" }).click();

  currentStep = "wait for review";
  await page.waitForFunction(
    (title) => {
      const columns = [...document.querySelectorAll(".column")];
      const review = columns.find(
        (column) => column.querySelector("h3")?.textContent?.trim() === "Review",
      );

      return !!review &&
        [...review.querySelectorAll(".task-card strong")].some(
          (element) => element.textContent?.trim() === title,
        );
    },
    smokeTitle,
  );

  state = await collectBoardState(page, smokeTitle);
  assert(state.matches === 1, `Expected one card after agent ping, found ${state.matches}`);
  assert(
    columnCards(state, "Review").includes(smokeTitle),
    "Agent ping should route Claude Code work into Review",
  );

  currentStep = "add discussion note";
  await page.getByRole("button", { name: "Discussion" }).click();
  await page.getByPlaceholder("Leave a review note or tighten the brief...").fill(smokeComment);
  await page.getByRole("button", { name: "Add note" }).click();
  await page.waitForFunction(
    (comment) => document.body.innerText.includes(comment),
    smokeComment,
  );

  currentStep = "move to done";
  await page.getByRole("button", { name: "Move to done" }).click();
  currentStep = "wait for done";
  await page.waitForFunction(
    (title) => {
      const columns = [...document.querySelectorAll(".column")];
      const done = columns.find(
        (column) => column.querySelector("h3")?.textContent?.trim() === "Done",
      );

      return !!done &&
        [...done.querySelectorAll(".task-card strong")].some(
          (element) => element.textContent?.trim() === title,
        );
    },
    smokeTitle,
  );

  state = await collectBoardState(page, smokeTitle);
  assert(state.matches === 1, `Expected one card after review completion, found ${state.matches}`);
  assert(columnCards(state, "Done").includes(smokeTitle), "Card should land in Done");

  currentStep = "toggle theme";
  await page.getByRole("button", { name: /Palette/i }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === "light");

  state = await collectBoardState(page, smokeTitle);
  assert(state.theme === "light", "Theme toggle should switch into light mode");
  assert(pageErrors.length === 0, `Page errors: ${pageErrors.join("\n")}`);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join("\n")}`);

  console.log("Crewdeck frontend smoke test passed.");
} catch (error) {
  const sections = [
    `Step: ${currentStep}`,
    error instanceof Error ? error.message : String(error),
    apiService?.getOutput?.() ? `\nAPI output:\n${apiService.getOutput()}` : "",
    webService?.getOutput?.() ? `\nWeb output:\n${webService.getOutput()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  console.error(sections);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await stopService(webService);
  await stopService(apiService);
  rmSync(tempDir, { recursive: true, force: true });
}
