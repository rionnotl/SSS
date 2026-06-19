import { Router, type IRouter } from "express";
import db from "../lib/sqlite";
import { UpdateBioBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:username", (req, res): void => {
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const user = db.prepare("SELECT id, username, bio, created_at as createdAt FROM users WHERE username = ?").get(username) as any;
  if (!user) {
    res.status(404).json({ error: "ユーザーが見つかりません" });
    return;
  }

  const countRow = db.prepare("SELECT COUNT(*) as count FROM posts WHERE user_id = ?").get(user.id) as any;

  res.json({
    id: user.id,
    username: user.username,
    bio: user.bio ?? null,
    postCount: Number(countRow.count),
    createdAt: user.createdAt,
  });
});

router.patch("/users/:username/bio", (req, res): void => {
  const session = req.session as any;
  if (!session.userId) {
    res.status(401).json({ error: "ログインが必要です" });
    return;
  }

  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  const targetUser = db.prepare("SELECT id FROM users WHERE username = ?").get(username) as any;

  if (!targetUser || targetUser.id !== session.userId) {
    res.status(403).json({ error: "この操作は許可されていません" });
    return;
  }

  const parsed = UpdateBioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updated = db.prepare("UPDATE users SET bio = ? WHERE id = ? RETURNING id, username, bio, created_at as createdAt").get(parsed.data.bio, session.userId) as any;
  res.json({ ...updated, bio: updated.bio ?? null });
});

router.get("/users/:username/posts", (req, res): void => {
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  const session = req.session as any;
  const currentUserId = session.userId ?? null;

  const user = db.prepare("SELECT id FROM users WHERE username = ?").get(username) as any;
  if (!user) {
    res.json([]);
    return;
  }

  const rows = db.prepare(`
    SELECT
      p.id,
      p.user_id as userId,
      u.username,
      p.song_title as songTitle,
      p.artist_name as artistName,
      p.source_type as sourceType,
      p.source_url as sourceUrl,
      p.message,
      p.mood_tag as moodTag,
      p.created_at as createdAt,
      COUNT(l.id) as likesCount,
      ${currentUserId ? `MAX(CASE WHEN l.user_id = ${currentUserId} THEN 1 ELSE 0 END)` : "0"} as likedByMe
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN likes l ON l.post_id = p.id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(user.id) as any[];

  res.json(rows.map((r) => ({
    ...r,
    likesCount: Number(r.likesCount),
    likedByMe: Boolean(r.likedByMe),
    sourceUrl: r.sourceUrl ?? null,
    message: r.message ?? null,
    moodTag: r.moodTag ?? null,
  })));
});

export default router;
