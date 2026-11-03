// SQLite 데이터베이스 연결 + 테이블 생성
// Node 22.5+ 에 내장된 node:sqlite 를 사용해서 별도 DB 설치가 필요 없어요.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH ?? join(here, "data", "dearly.db");
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        email         TEXT    NOT NULL UNIQUE,
        password_hash TEXT    NOT NULL,
        name          TEXT    NOT NULL,
        created_at    TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entries (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title      TEXT    NOT NULL,
        content    TEXT    NOT NULL,
        category   TEXT    NOT NULL,
        mood       TEXT    NOT NULL DEFAULT '',
        is_public  INTEGER NOT NULL DEFAULT 0,
        created_at TEXT    NOT NULL,
        updated_at TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_entries_public ON entries(is_public, created_at);
    CREATE INDEX IF NOT EXISTS idx_entries_user   ON entries(user_id, created_at);
`);
