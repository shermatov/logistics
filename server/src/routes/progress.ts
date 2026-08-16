import { Router } from "express";
import { pool } from "../db.js";
import { requireUser, type AuthedRequest } from "../middleware/userAuth.js";

export const progressRouter = Router();

const EMPTY_PROGRESS = { completedModules: {}, quizResults: {}, decisionScores: [] };

progressRouter.get("/", requireUser, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query("SELECT data FROM user_progress WHERE user_id = $1", [req.userId]);
  res.json(rows.length > 0 ? rows[0].data : EMPTY_PROGRESS);
});

progressRouter.put("/", requireUser, async (req: AuthedRequest, res) => {
  const data = req.body ?? {};
  await pool.query(
    `INSERT INTO user_progress (user_id, data) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [req.userId, JSON.stringify(data)]
  );
  res.json({ ok: true });
});
