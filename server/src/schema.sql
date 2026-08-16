-- Logistics Management School — data backend schema
-- Mirrors src/data/types.ts on the frontend.

CREATE TABLE IF NOT EXISTS skus (
  sku_id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  selling_price NUMERIC NOT NULL,
  product_cost NUMERIC NOT NULL,
  package_length_cm NUMERIC NOT NULL,
  package_width_cm NUMERIC NOT NULL,
  package_height_cm NUMERIC NOT NULL,
  package_weight_kg NUMERIC NOT NULL,
  return_rate NUMERIC NOT NULL,
  sales_velocity NUMERIC NOT NULL,
  fulfillment_model TEXT NOT NULL CHECK (fulfillment_model IN ('FBS', 'FBW')),
  demand_geography JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouses (
  warehouse_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL CHECK (country IN ('KG', 'RU')),
  role TEXT NOT NULL CHECK (role IN ('supplier', 'consolidation', 'fulfillment', 'wb_sc')),
  capacity_units NUMERIC NOT NULL,
  current_stock_units NUMERIC NOT NULL,
  logistics_coefficient NUMERIC NOT NULL,
  storage_cost_per_unit_day NUMERIC NOT NULL,
  demand_share NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-row-per-key config store for the WB and cargo tariff tables.
CREATE TABLE IF NOT EXISTS tariff_configs (
  key TEXT PRIMARY KEY, -- 'wb' | 'cargo'
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_metrics (
  date DATE PRIMARY KEY,
  orders NUMERIC NOT NULL,
  revenue NUMERIC NOT NULL,
  logistics_cost NUMERIC NOT NULL,
  returns NUMERIC NOT NULL,
  return_cost NUMERIC NOT NULL,
  stock_kg NUMERIC NOT NULL,
  stock_ru NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One JSON blob per user, mirroring the shape localStorage used before
-- (completedModules / quizResults / decisionScores) — see src/state/progress.tsx.
CREATE TABLE IF NOT EXISTS user_progress (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
