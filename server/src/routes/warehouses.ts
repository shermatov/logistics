import { Router } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/adminAuth.js";

export const warehousesRouter = Router();

function rowToWarehouse(row: any) {
  return {
    warehouse_id: row.warehouse_id,
    name: row.name,
    region: row.region,
    country: row.country,
    role: row.role,
    capacity_units: Number(row.capacity_units),
    current_stock_units: Number(row.current_stock_units),
    logistics_coefficient: Number(row.logistics_coefficient),
    storage_cost_per_unit_day: Number(row.storage_cost_per_unit_day),
    demand_share: Number(row.demand_share),
  };
}

warehousesRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM warehouses ORDER BY warehouse_id");
  res.json(rows.map(rowToWarehouse));
});

warehousesRouter.post("/", requireAdmin, async (req, res) => {
  const w = req.body;
  if (!w?.warehouse_id || !w?.name) {
    res.status(400).json({ error: "warehouse_id and name are required" });
    return;
  }
  await pool.query(
    `INSERT INTO warehouses (warehouse_id, name, region, country, role, capacity_units, current_stock_units, logistics_coefficient, storage_cost_per_unit_day, demand_share)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [w.warehouse_id, w.name, w.region, w.country, w.role, w.capacity_units, w.current_stock_units, w.logistics_coefficient, w.storage_cost_per_unit_day, w.demand_share]
  );
  res.status(201).json({ ok: true });
});

warehousesRouter.put("/:id", requireAdmin, async (req, res) => {
  const w = req.body;
  const { rowCount } = await pool.query(
    `UPDATE warehouses SET name=$2, region=$3, country=$4, role=$5, capacity_units=$6, current_stock_units=$7, logistics_coefficient=$8, storage_cost_per_unit_day=$9, demand_share=$10, updated_at=now()
     WHERE warehouse_id=$1`,
    [req.params.id, w.name, w.region, w.country, w.role, w.capacity_units, w.current_stock_units, w.logistics_coefficient, w.storage_cost_per_unit_day, w.demand_share]
  );
  if (rowCount === 0) {
    res.status(404).json({ error: "Warehouse not found" });
    return;
  }
  res.json({ ok: true });
});

warehousesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM warehouses WHERE warehouse_id=$1", [req.params.id]);
  if (rowCount === 0) {
    res.status(404).json({ error: "Warehouse not found" });
    return;
  }
  res.json({ ok: true });
});
