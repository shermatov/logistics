import express from "express";
import cors from "cors";
import { skusRouter } from "./routes/skus.js";
import { warehousesRouter } from "./routes/warehouses.js";
import { tariffsRouter } from "./routes/tariffs.js";
import { dailyMetricsRouter } from "./routes/dailyMetrics.js";

export const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? "").split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/skus", skusRouter);
app.use("/api/warehouses", warehousesRouter);
app.use("/api/tariffs", tariffsRouter);
app.use("/api/daily-metrics", dailyMetricsRouter);

// Vercel's zero-config Express detection wires this file directly as a
// function for the root path (separate from api/index.ts's rewrite-based
// routing) and requires a default export — without this, GET / 500s with
// "Invalid export found... default export must be a function".
export default app;
