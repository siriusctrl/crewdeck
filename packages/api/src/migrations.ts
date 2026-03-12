import type Database from "better-sqlite3";

type Migration = {
  id: string;
  sql: string;
};

const migrations: Migration[] = [
  {
    id: "001_initial_schema",
    sql: `
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        repo_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS actors (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        backend TEXT,
        is_system INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        assignee_id TEXT,
        reviewer_id TEXT,
        labels_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(board_id) REFERENCES boards(id),
        FOREIGN KEY(assignee_id) REFERENCES actors(id),
        FOREIGN KEY(reviewer_id) REFERENCES actors(id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(card_id) REFERENCES cards(id),
        FOREIGN KEY(author_id) REFERENCES actors(id)
      );

      CREATE TABLE IF NOT EXISTS automation_rules (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        on_status TEXT NOT NULL,
        action TEXT NOT NULL,
        target_actor_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY,
        card_id TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(card_id) REFERENCES cards(id),
        FOREIGN KEY(actor_id) REFERENCES actors(id)
      );
    `,
  },
  {
    id: "002_add_indexes",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_cards_board_id ON cards(board_id);
      CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
      CREATE INDEX IF NOT EXISTS idx_comments_card_id ON comments(card_id);
      CREATE INDEX IF NOT EXISTS idx_agent_runs_card_id ON agent_runs(card_id);
    `,
  },
];

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = new Set(
    (
      db.prepare("SELECT id FROM schema_migrations ORDER BY id ASC").all() as Array<{
        id: string;
      }>
    ).map((row) => row.id),
  );

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }

    db.transaction(() => {
      db.exec(migration.sql);
      db.prepare(
        "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
      ).run(migration.id, new Date().toISOString());
    })();
  }
}
