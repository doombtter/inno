-- Seed: sample products for each MVP category
-- Numbers are illustrative for dev/UI work — NOT verified label data.

BEGIN;

-- ===== 햄/소시지 =====

INSERT INTO products (
  name, manufacturer_id, category_id, volume_value, volume_unit,
  msrp, avg_online_price,
  ingredients_raw_text, additives, allergens,
  nutrition_base_unit, nutrition_base_amount, nutrition,
  key_metrics, status
)
SELECT
  '스팸 클래식 200g', m.id, c.id, 200, 'g',
  5000, 4900,
  '돼지고기(국산) 91%, 정제수, 정제소금, 설탕, 향신료',
  ARRAY['아질산나트륨']::TEXT[], ARRAY['돼지고기']::TEXT[],
  '100g', 100,
  '{"kcal": 280, "protein": 13, "carb": 2, "sugar": 1, "fat": 24, "saturatedFat": 9, "sodium": 720}'::jsonb,
  '{"pork_content_pct": 91}'::jsonb,
  'approved'
FROM manufacturers m, categories c
WHERE m.name = 'CJ제일제당' AND c.slug = 'ham';

INSERT INTO products (
  name, manufacturer_id, category_id, volume_value, volume_unit,
  msrp, avg_online_price,
  ingredients_raw_text, additives, allergens,
  nutrition_base_unit, nutrition_base_amount, nutrition,
  key_metrics, status
)
SELECT
  '리챔 오리지널 200g', m.id, c.id, 200, 'g',
  4800, 4500,
  '돼지고기 87%, 정제수, 정제소금, 설탕, 향신료',
  ARRAY['아질산나트륨']::TEXT[], ARRAY['돼지고기']::TEXT[],
  '100g', 100,
  '{"kcal": 270, "protein": 13, "carb": 2, "sugar": 1, "fat": 23, "saturatedFat": 8, "sodium": 680}'::jsonb,
  '{"pork_content_pct": 87}'::jsonb,
  'approved'
FROM manufacturers m, categories c
WHERE m.name = '동원F&B' AND c.slug = 'ham';

INSERT INTO products (
  name, manufacturer_id, category_id, volume_value, volume_unit,
  msrp, avg_online_price,
  ingredients_raw_text, additives, allergens,
  nutrition_base_unit, nutrition_base_amount, nutrition,
  key_metrics, status
)
SELECT
  '로스팜 200g', m.id, c.id, 200, 'g',
  4500, 4200,
  '돼지고기 89%, 정제수, 정제소금, 설탕',
  ARRAY['아질산나트륨']::TEXT[], ARRAY['돼지고기']::TEXT[],
  '100g', 100,
  '{"kcal": 275, "protein": 12, "carb": 2, "sugar": 1, "fat": 24, "saturatedFat": 9, "sodium": 700}'::jsonb,
  '{"pork_content_pct": 89}'::jsonb,
  'approved'
FROM manufacturers m, categories c
WHERE m.name = '롯데햄' AND c.slug = 'ham';

-- ===== 주스/음료 =====

INSERT INTO products (
  name, manufacturer_id, category_id, volume_value, volume_unit,
  msrp, avg_online_price,
  ingredients_raw_text, additives, allergens,
  nutrition_base_unit, nutrition_base_amount, nutrition,
  key_metrics, status
)
SELECT
  '미닛메이드 오렌지 100% 200ml', m.id, c.id, 200, 'ml',
  1800, 1500,
  '오렌지농축액환원과즙 100% (오렌지)',
  ARRAY[]::TEXT[], ARRAY[]::TEXT[],
  '100ml', 100,
  '{"kcal": 45, "protein": 0.7, "carb": 11, "sugar": 10, "fat": 0, "sodium": 5}'::jsonb,
  '{"juice_content_pct": 100, "concentrate_restored": true, "artificial_flavor": false, "hfcs": false}'::jsonb,
  'approved'
FROM manufacturers m, categories c
WHERE m.name = '한국코카콜라' AND c.slug = 'juice';

INSERT INTO products (
  name, manufacturer_id, category_id, volume_value, volume_unit,
  msrp, avg_online_price,
  ingredients_raw_text, additives, allergens,
  nutrition_base_unit, nutrition_base_amount, nutrition,
  key_metrics, status
)
SELECT
  '델몬트 콜드 오렌지 100% 1.5L', m.id, c.id, 1500, 'ml',
  5500, 4900,
  '오렌지과즙 100% (오렌지)',
  ARRAY[]::TEXT[], ARRAY[]::TEXT[],
  '100ml', 100,
  '{"kcal": 47, "protein": 0.8, "carb": 11.5, "sugar": 10.5, "fat": 0, "sodium": 4}'::jsonb,
  '{"juice_content_pct": 100, "concentrate_restored": false, "artificial_flavor": false, "hfcs": false}'::jsonb,
  'approved'
FROM manufacturers m, categories c
WHERE m.name = '롯데칠성음료' AND c.slug = 'juice';

INSERT INTO products (
  name, manufacturer_id, category_id, volume_value, volume_unit,
  msrp, avg_online_price,
  ingredients_raw_text, additives, allergens,
  nutrition_base_unit, nutrition_base_amount, nutrition,
  key_metrics, status
)
SELECT
  '썬키스트 오렌지 100% 1L', m.id, c.id, 1000, 'ml',
  4500, 3900,
  '오렌지농축액환원과즙 100%',
  ARRAY[]::TEXT[], ARRAY[]::TEXT[],
  '100ml', 100,
  '{"kcal": 45, "protein": 0.7, "carb": 11, "sugar": 10, "fat": 0, "sodium": 5}'::jsonb,
  '{"juice_content_pct": 100, "concentrate_restored": true, "artificial_flavor": false, "hfcs": false}'::jsonb,
  'approved'
FROM manufacturers m, categories c
WHERE m.name = '해태HTB' AND c.slug = 'juice';

-- ===== 만두 =====

INSERT INTO products (
  name, manufacturer_id, category_id, volume_value, volume_unit,
  msrp, avg_online_price,
  ingredients_raw_text, additives, allergens,
  nutrition_base_unit, nutrition_base_amount, nutrition,
  key_metrics, status
)
SELECT
  '비비고 왕교자 350g', m.id, c.id, 350, 'g',
  7000, 5900,
  '돼지고기(국산) 18%, 양배추, 부추, 양파, 두부, 만두피(밀가루, 정제수, 정제소금)',
  ARRAY[]::TEXT[], ARRAY['돼지고기','밀','대두']::TEXT[],
  '100g', 100,
  '{"kcal": 230, "protein": 8, "carb": 25, "sugar": 2, "fat": 11, "saturatedFat": 4, "sodium": 480}'::jsonb,
  '{"meat_content_pct": 18, "vegetable_content_pct": 24}'::jsonb,
  'approved'
FROM manufacturers m, categories c
WHERE m.name = 'CJ제일제당' AND c.slug = 'dumpling';

INSERT INTO products (
  name, manufacturer_id, category_id, volume_value, volume_unit,
  msrp, avg_online_price,
  ingredients_raw_text, additives, allergens,
  nutrition_base_unit, nutrition_base_amount, nutrition,
  key_metrics, status
)
SELECT
  '고향만두 350g', m.id, c.id, 350, 'g',
  6500, 5500,
  '돼지고기 20%, 양배추, 양파, 두부, 만두피',
  ARRAY[]::TEXT[], ARRAY['돼지고기','밀','대두']::TEXT[],
  '100g', 100,
  '{"kcal": 240, "protein": 9, "carb": 24, "sugar": 2, "fat": 12, "saturatedFat": 4, "sodium": 510}'::jsonb,
  '{"meat_content_pct": 20, "vegetable_content_pct": 22}'::jsonb,
  'approved'
FROM manufacturers m, categories c
WHERE m.name = '해태제과' AND c.slug = 'dumpling';

INSERT INTO products (
  name, manufacturer_id, category_id, volume_value, volume_unit,
  msrp, avg_online_price,
  ingredients_raw_text, additives, allergens,
  nutrition_base_unit, nutrition_base_amount, nutrition,
  key_metrics, status
)
SELECT
  '진한교자만두 400g', m.id, c.id, 400, 'g',
  7500, 6800,
  '돼지고기 22%, 부추, 양배추, 두부, 만두피',
  ARRAY[]::TEXT[], ARRAY['돼지고기','밀','대두']::TEXT[],
  '100g', 100,
  '{"kcal": 245, "protein": 10, "carb": 23, "sugar": 2, "fat": 13, "saturatedFat": 5, "sodium": 470}'::jsonb,
  '{"meat_content_pct": 22, "vegetable_content_pct": 25}'::jsonb,
  'approved'
FROM manufacturers m, categories c
WHERE m.name = '풀무원' AND c.slug = 'dumpling';

COMMIT;
