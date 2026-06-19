import { Router, type IRouter } from "express";
import db from "../lib/sqlite";

const router: IRouter = Router();

router.get("/stats/trending-tags", (_req, res): void => {
  const rows = db.prepare(`
    SELECT mood_tag as tag, COUNT(*) as count
    FROM posts
    WHERE mood_tag IS NOT NULL
    GROUP BY mood_tag
    ORDER BY count DESC
    LIMIT 10
  `).all() as any[];

  res.json(rows.map((r) => ({ tag: r.tag, count: Number(r.count) })));
});

export default router;
