import { Router, type IRouter } from "express";
import db from "../lib/sqlite";
import {
  CreatePostBody,
  DeletePostParams,
  LikePostParams,
  UnlikePostParams,
  ListPostsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getPostsWithLikes(
  userId: number | null,
  where: string,
  whereParams: unknown[],
  limit: number,
  offset: number,
): any[] {
  const uid = userId ?? 0;
  const rows = db
    .prepare(
      `
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
      MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) as likedByMe
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN likes l ON l.post_id = p.id
    ${where}
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `,
    )
    .all(uid, ...whereParams, limit, offset) as any[];

  return rows.map((r) => ({
    ...r,
    likesCount: Number(r.likesCount),
    likedByMe: Boolean(r.likedByMe),
    sourceUrl: r.sourceUrl ?? null,
    message: r.message ?? null,
    moodTag: r.moodTag ?? null,
  }));
}

router.get("/posts", (req, res): void => {
  const parsed = ListPostsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 30) : 30;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;
  const session = req.session as any;
  const userId = session.userId ?? null;

  const posts = getPostsWithLikes(userId, "", [], limit, offset);
  res.json(posts);
});

router.post("/posts", (req, res): void => {
  const session = req.session as any;
  if (!session.userId) {
    res.status(401).json({ error: "ログインが必要です" });
    return;
  }

  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { songTitle, artistName, sourceType, sourceUrl, message, moodTag } = parsed.data;

  const stmt = db.prepare(`
    INSERT INTO posts (user_id, song_title, artist_name, source_type, source_url, message, mood_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `);
  const result = stmt.get(
    session.userId,
    songTitle,
    artistName,
    sourceType,
    sourceUrl ?? null,
    message ?? null,
    moodTag ?? null,
  ) as any;

  const posts = getPostsWithLikes(session.userId, "WHERE p.id = ?", [result.id], 1, 0);
  if (!posts[0]) {
    res.status(500).json({ error: "投稿の作成に失敗しました" });
    return;
  }
  res.status(201).json(posts[0]);
});

router.delete("/posts/:id", (req, res): void => {
  const session = req.session as any;
  if (!session.userId) {
    res.status(401).json({ error: "ログインが必要です" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeletePostParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "無効なIDです" });
    return;
  }

  const post = db.prepare("SELECT user_id FROM posts WHERE id = ?").get(parsed.data.id) as any;
  if (!post) {
    res.status(404).json({ error: "投稿が見つかりません" });
    return;
  }

  if (post.user_id !== session.userId) {
    res.status(403).json({ error: "この操作は許可されていません" });
    return;
  }

  db.prepare("DELETE FROM posts WHERE id = ?").run(parsed.data.id);
  res.sendStatus(204);
});

router.post("/posts/:id/like", (req, res): void => {
  const session = req.session as any;
  if (!session.userId) {
    res.status(401).json({ error: "ログインが必要です" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = LikePostParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "無効なIDです" });
    return;
  }

  db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(
    session.userId,
    parsed.data.id,
  );

  const result = db
    .prepare("SELECT COUNT(*) as count FROM likes WHERE post_id = ?")
    .get(parsed.data.id) as any;
  res.json({ likesCount: Number(result.count), likedByMe: true });
});

router.delete("/posts/:id/like", (req, res): void => {
  const session = req.session as any;
  if (!session.userId) {
    res.status(401).json({ error: "ログインが必要です" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UnlikePostParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "無効なIDです" });
    return;
  }

  db.prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?").run(
    session.userId,
    parsed.data.id,
  );

  const result = db
    .prepare("SELECT COUNT(*) as count FROM likes WHERE post_id = ?")
    .get(parsed.data.id) as any;
  res.json({ likesCount: Number(result.count), likedByMe: false });
});

export default router;
