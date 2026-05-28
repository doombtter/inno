-- Inno DB initial schema
-- Shared between Inno Admin (Next.js) and Inno main app (Flutter via backend API).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- Helper: keep updated_at fresh on UPDATE
CREATE OR REPLACE FUNCTION inno_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(50)  NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'editor'
                CHECK (role IN ('admin', 'editor')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION inno_set_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- key_metrics_schema shape (see seeds for examples):
-- {
--   "key_metric":     {"field": "...", "label": "...", "unit": "%", "higher_is_better": true},
--   "fields":         [{"name": "...", "label": "...", "type": "number|boolean",
--                       "unit": "%", "min": 0, "max": 100, "required": true}],
--   "sortable_fields":[{"field": "key_metrics.X" | "nutrition.Y" | "avg_online_price",
--                       "label": "...", "higher_is_better": true}],
--   "insight_thresholds": {"good": 85, "warning": 70}
-- }
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               VARCHAR(50) UNIQUE NOT NULL,
  name               VARCHAR(100) NOT NULL,
  key_metrics_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order      INT  NOT NULL DEFAULT 0,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_categories_updated
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION inno_set_updated_at();

CREATE INDEX idx_categories_active_order ON categories(is_active, display_order);

-- ---------------------------------------------------------------------------
-- manufacturers
-- ---------------------------------------------------------------------------
CREATE TABLE manufacturers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) UNIQUE NOT NULL,
  aliases    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_manufacturers_updated
  BEFORE UPDATE ON manufacturers
  FOR EACH ROW EXECUTE FUNCTION inno_set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- nutrition JSONB shape:
--   {"kcal": n, "protein": g, "carb": g, "sugar": g, "fat": g,
--    "saturatedFat": g, "sodium": mg, "cholesterol": mg?}
-- ingredients_parsed JSONB shape:
--   [{"name": "돼지고기", "pct": 87, "origin": "국산"}, ...]
-- key_metrics JSONB shape (per-category):
--   ham:      {"pork_content_pct": 87}
--   juice:    {"juice_content_pct": 100, "hfcs": false, ...}
--   dumpling: {"meat_content_pct": 18, "vegetable_content_pct": 24}
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode               VARCHAR(13) UNIQUE,
  name                  VARCHAR(200) NOT NULL,
  manufacturer_id       UUID NOT NULL REFERENCES manufacturers(id) ON DELETE RESTRICT,
  category_id           UUID NOT NULL REFERENCES categories(id)    ON DELETE RESTRICT,
  volume_value          NUMERIC NOT NULL,
  volume_unit           VARCHAR(10) NOT NULL CHECK (volume_unit IN ('g', 'ml', 'ea')),
  msrp                  NUMERIC,
  avg_online_price      NUMERIC,

  ingredients_raw_text  TEXT  NOT NULL DEFAULT '',
  ingredients_parsed    JSONB NOT NULL DEFAULT '[]'::jsonb,
  additives             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  allergens             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  nutrition_base_unit   VARCHAR(10) NOT NULL DEFAULT '100g'
                        CHECK (nutrition_base_unit IN ('100g', '100ml', 'serving')),
  nutrition_base_amount NUMERIC NOT NULL DEFAULT 100,
  nutrition             JSONB NOT NULL DEFAULT '{}'::jsonb,

  key_metrics           JSONB NOT NULL DEFAULT '{}'::jsonb,

  product_images        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  label_images          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION inno_set_updated_at();

CREATE INDEX idx_products_category_status ON products(category_id, status);
CREATE INDEX idx_products_manufacturer    ON products(manufacturer_id);
CREATE INDEX idx_products_status          ON products(status);
CREATE INDEX idx_products_created_by      ON products(created_by);
CREATE INDEX idx_products_name            ON products(name);
CREATE INDEX idx_products_key_metrics_gin ON products USING gin (key_metrics);
CREATE INDEX idx_products_nutrition_gin   ON products USING gin (nutrition);

-- ---------------------------------------------------------------------------
-- product_prices (time series)
-- ---------------------------------------------------------------------------
CREATE TABLE product_prices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source      VARCHAR(50) NOT NULL,             -- 'coupang' | 'kurly' | 'manual' | ...
  price       NUMERIC NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_prices_product_observed
  ON product_prices(product_id, observed_at DESC);

-- ---------------------------------------------------------------------------
-- product_revisions (audit log)
-- changes shape: {"field": [before, after], ...}
-- ---------------------------------------------------------------------------
CREATE TABLE product_revisions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changes    JSONB NOT NULL,
  reason     VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_revisions_product_created
  ON product_revisions(product_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- insights (content cards shown on the main app home)
-- body_markdown can embed product cards via [[product:<uuid>]] tokens.
-- ---------------------------------------------------------------------------
CREATE TABLE insights (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                VARCHAR(100) UNIQUE NOT NULL,
  title               VARCHAR(200) NOT NULL,
  subtitle            VARCHAR(300),
  thumbnail           TEXT,
  body_markdown       TEXT NOT NULL DEFAULT '',
  related_product_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_insights_updated
  BEFORE UPDATE ON insights
  FOR EACH ROW EXECUTE FUNCTION inno_set_updated_at();

CREATE INDEX idx_insights_published
  ON insights(published_at DESC)
  WHERE published_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- product_requests (user-submitted "please add this product" tickets)
-- ---------------------------------------------------------------------------
CREATE TABLE product_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query VARCHAR(200),
  note         TEXT,
  device_id    VARCHAR(100),
  status       VARCHAR(20) NOT NULL DEFAULT 'open'
               CHECK (status IN ('open', 'closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_requests_status_created
  ON product_requests(status, created_at DESC);

COMMIT;
