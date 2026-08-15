import { Router } from "express";
import { pool } from "../db.js";

export const dailyMetricsRouter = Router();

dailyMetricsRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM daily_metrics ORDER BY date ASC");
  res.json(
    rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      orders: Number(row.orders),
      revenue: Number(row.revenue),
      logisticsCost: Number(row.logistics_cost),
      returns: Number(row.returns),
      returnCost: Number(row.return_cost),
      stockKg: Number(row.stock_kg),
      stockRu: Number(row.stock_ru),
    }))
  );
});
