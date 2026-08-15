import { Router } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/adminAuth.js";

export const tariffsRouter = Router();

tariffsRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query("SELECT key, data, updated_at FROM tariff_configs");
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.key] = row.data;
  }
  res.json(result);
});

tariffsRouter.put("/:key", requireAdmin, async (req, res) => {
  const { key } = req.params;
  if (key !== "wb" && key !== "cargo") {
    res.status(400).json({ error: "key must be 'wb' or 'cargo'" });
    return;
  }
  await pool.query(
    `INSERT INTO tariff_configs (key, data) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [key, JSON.stringify(req.body)]
  );
  res.json({ ok: true });
});
