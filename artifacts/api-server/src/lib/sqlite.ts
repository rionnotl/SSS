import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const dataDir = path.resolve(workspaceRoot, "artifacts/api-server/data");
const dbPath = path.resolve(dataDir, "music.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    bio TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_title TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK(source_type IN ('spotify', 'youtube', 'manual')),
    source_url TEXT,
    message TEXT,
    mood_tag TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, post_id)
  );

  CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
  CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
  CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
`);

function seedIfEmpty() {
  const userCount = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
  if (userCount > 0) return;

  const hash1 = bcrypt.hashSync("password123", 10);
  const hash2 = bcrypt.hashSync("password123", 10);
  const hash3 = bcrypt.hashSync("password123", 10);

  const u1 = (db.prepare("INSERT INTO users (username, password_hash, bio) VALUES (?, ?, ?) RETURNING id").get(
    "haru_music", hash1, "邦楽・洋楽問わず何でも聴きます。最近はシティポップにはまってます。"
  ) as any).id;

  const u2 = (db.prepare("INSERT INTO users (username, password_hash, bio) VALUES (?, ?, ?) RETURNING id").get(
    "neon_beats", hash2, "電子音楽大好き。DJもやってます。"
  ) as any).id;

  const u3 = (db.prepare("INSERT INTO users (username, password_hash, bio) VALUES (?, ?, ?) RETURNING id").get(
    "sakura_tunes", hash3, "アニソンとVOCALOIDが専門。毎日聴いてます！"
  ) as any).id;

  const insertPost = db.prepare(
    "INSERT INTO posts (user_id, song_title, artist_name, source_type, source_url, message, mood_tag) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const p1 = (insertPost.run(u1, "Plastic Love", "竹内まりや", "youtube",
    "https://www.youtube.com/watch?v=9Gj47G2e1Jc",
    "シティポップの名曲。何回聴いても飽きない。", "#懐かし") as any).lastInsertRowid;

  const p2 = (insertPost.run(u2, "Night Tempo - Shining Star", "Night Tempo", "youtube",
    "https://www.youtube.com/watch?v=DGfk8TQM11w",
    "深夜の作業にぴったりな一曲。", "#作業用") as any).lastInsertRowid;

  const p3 = (insertPost.run(u3, "残酷な天使のテーゼ", "高橋洋子", "manual",
    null,
    "エヴァのOPは永遠の名曲！テンション爆上がり！", "#テンション上がる") as any).lastInsertRowid;

  const p4 = (insertPost.run(u1, "夜に駆ける", "YOASOBI", "youtube",
    "https://www.youtube.com/watch?v=x8VYWazR5mE",
    "このメロディーは天才的。何度聴いても感動する。", "#感動") as any).lastInsertRowid;

  const p5 = (insertPost.run(u2, "Cat's Eye", "杏里", "manual",
    null,
    "シティポップリバイバルブームの一枚。最高すぎる。", "#懐かし") as any).lastInsertRowid;

  db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(u2, p1);
  db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(u3, p1);
  db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(u1, p3);
  db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(u3, p4);
  db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(u1, p5);
  db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(u2, p5);

  logger.info("Seed data inserted");
}

seedIfEmpty();

logger.info({ dbPath }, "SQLite database initialized");

export default db;
