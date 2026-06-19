import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import db from "../lib/sqlite";
import {
  RegisterBody,
  LoginBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/auth/me", (req, res): void => {
  const session = req.session as any;
  if (!session.userId) {
    res.status(401).json({ error: "未ログインです" });
    return;
  }
  const user = db.prepare("SELECT id, username, bio, created_at as createdAt FROM users WHERE id = ?").get(session.userId) as any;
  if (!user) {
    session.destroy(() => {});
    res.status(401).json({ error: "ユーザーが見つかりません" });
    return;
  }
  res.json(user);
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    res.status(409).json({ error: "このユーザー名は既に使用されています" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const stmt = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id, username, bio, created_at as createdAt");
  const user = stmt.get(username, passwordHash) as any;

  const session = req.session as any;
  session.userId = user.id;

  res.status(201).json(user);
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const row = db.prepare("SELECT id, username, bio, password_hash, created_at as createdAt FROM users WHERE username = ?").get(username) as any;
  if (!row) {
    res.status(401).json({ error: "ユーザー名またはパスワードが間違っています" });
    return;
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    res.status(401).json({ error: "ユーザー名またはパスワードが間違っています" });
    return;
  }

  const session = req.session as any;
  session.userId = row.id;

  res.json({ id: row.id, username: row.username, bio: row.bio ?? null, createdAt: row.createdAt });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {});
  res.sendStatus(204);
});

export default router;
