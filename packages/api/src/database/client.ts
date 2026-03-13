import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import { runMigrations } from "../migrations";
import { seedDatabase } from "./seed";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const configuredDbPath = process.env.CREWDECK_DB_PATH;
const dbPath = configuredDbPath
  ? path.resolve(configuredDbPath)
  : path.join(rootDir, "data", "crewdeck.sqlite");

mkdirSync(path.dirname(dbPath), { recursive: true });

type DatabaseClient = InstanceType<typeof Database>;

const db: DatabaseClient = new Database(dbPath);
db.pragma("journal_mode = WAL");

runMigrations(db);
seedDatabase(db);

export { db };
