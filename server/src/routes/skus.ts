import { Router } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/adminAuth.js";

export const skusRouter = Router();

function rowToSku(row: any) {
  return {
    sku_id: row.sku_id,
    product_name: row.product_name,
    category: row.category,
    selling_price: Number(row.selling_price),
    product_cost: Number(row.product_cost),
    package_length_cm: Number(row.package_length_cm),
    package_width_cm: Number(row.package_width_cm),
    package_height_cm: Number(row.package_height_cm),
    package_weight_kg: Number(row.package_weight_kg),
    return_rate: Number(row.return_rate),
    sales_velocity: Number(row.sales_velocity),
    fulfillment_model: row.fulfillment_model,
    demand_geography: row.demand_geography,
  };
}

skusRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM skus ORDER BY sku_id");
  res.json(rows.map(rowToSku));
});

skusRouter.post("/", requireAdmin, async (req, res) => {
  const s = req.body;
  if (!s?.sku_id || !s?.product_name) {
    res.status(400).json({ error: "sku_id and product_name are required" });
    return;
  }
  await pool.query(
    `INSERT INTO skus (sku_id, product_name, category, selling_price, product_cost, package_length_cm, package_width_cm, package_height_cm, package_weight_kg, return_rate, sales_velocity, fulfillment_model, demand_geography)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [s.sku_id, s.product_name, s.category, s.selling_price, s.product_cost, s.package_length_cm, s.package_width_cm, s.package_height_cm, s.package_weight_kg, s.return_rate, s.sales_velocity, s.fulfillment_model, JSON.stringify(s.demand_geography ?? {})]
  );
  res.status(201).json({ ok: true });
});

skusRouter.put("/:id", requireAdmin, async (req, res) => {
  const s = req.body;
  const { rowCount } = await pool.query(
    `UPDATE skus SET product_name=$2, category=$3, selling_price=$4, product_cost=$5, package_length_cm=$6, package_width_cm=$7, package_height_cm=$8, package_weight_kg=$9, return_rate=$10, sales_velocity=$11, fulfillment_model=$12, demand_geography=$13, updated_at=now()
     WHERE sku_id=$1`,
    [req.params.id, s.product_name, s.category, s.selling_price, s.product_cost, s.package_length_cm, s.package_width_cm, s.package_height_cm, s.package_weight_kg, s.return_rate, s.sales_velocity, s.fulfillment_model, JSON.stringify(s.demand_geography ?? {})]
  );
  if (rowCount === 0) {
    res.status(404).json({ error: "SKU not found" });
    return;
  }
  res.json({ ok: true });
});

skusRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM skus WHERE sku_id=$1", [req.params.id]);
  if (rowCount === 0) {
    res.status(404).json({ error: "SKU not found" });
    return;
  }
  res.json({ ok: true });
});
