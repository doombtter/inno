-- Seed: MVP categories (ham / juice / dumpling)
-- key_metrics_schema describes the per-category dynamic fields, sortable axes,
-- and the color-signal thresholds used on the main app ranking screen.

BEGIN;

INSERT INTO categories (slug, name, display_order, key_metrics_schema) VALUES
('ham', '햄/소시지', 1, '{
  "key_metric": {
    "field": "pork_content_pct",
    "label": "돈육 함량",
    "unit": "%",
    "higher_is_better": true
  },
  "fields": [
    {"name": "pork_content_pct", "label": "돈육 함량", "type": "number", "unit": "%",
     "min": 0, "max": 100, "required": true}
  ],
  "sortable_fields": [
    {"field": "key_metrics.pork_content_pct", "label": "돈육 함량", "higher_is_better": true},
    {"field": "nutrition.sodium",             "label": "나트륨",   "higher_is_better": false},
    {"field": "avg_online_price",             "label": "가격",     "higher_is_better": false}
  ],
  "insight_thresholds": {"good": 85, "warning": 70}
}'::jsonb),

('juice', '주스/음료', 2, '{
  "key_metric": {
    "field": "juice_content_pct",
    "label": "과즙 함량",
    "unit": "%",
    "higher_is_better": true
  },
  "fields": [
    {"name": "juice_content_pct",     "label": "과즙 함량",       "type": "number", "unit": "%",
     "min": 0, "max": 100, "required": true},
    {"name": "concentrate_restored",  "label": "농축액 환원",     "type": "boolean"},
    {"name": "artificial_flavor",     "label": "합성착향료 사용", "type": "boolean"},
    {"name": "hfcs",                  "label": "액상과당 사용",   "type": "boolean"}
  ],
  "sortable_fields": [
    {"field": "key_metrics.juice_content_pct", "label": "과즙 함량", "higher_is_better": true},
    {"field": "nutrition.sugar",               "label": "당류",     "higher_is_better": false},
    {"field": "avg_online_price",              "label": "가격",     "higher_is_better": false}
  ],
  "insight_thresholds": {"good": 80, "warning": 50}
}'::jsonb),

('dumpling', '만두', 3, '{
  "key_metric": {
    "field": "meat_content_pct",
    "label": "고기 함량",
    "unit": "%",
    "higher_is_better": true
  },
  "fields": [
    {"name": "meat_content_pct",       "label": "고기 함량",     "type": "number", "unit": "%",
     "min": 0, "max": 100, "required": true},
    {"name": "vegetable_content_pct",  "label": "채소 함량",     "type": "number", "unit": "%",
     "min": 0, "max": 100},
    {"name": "skin_pct",               "label": "만두피 비율",   "type": "number", "unit": "%",
     "min": 0, "max": 100}
  ],
  "sortable_fields": [
    {"field": "key_metrics.meat_content_pct",      "label": "고기 함량", "higher_is_better": true},
    {"field": "key_metrics.vegetable_content_pct", "label": "채소 함량", "higher_is_better": true},
    {"field": "nutrition.sodium",                  "label": "나트륨",   "higher_is_better": false},
    {"field": "avg_online_price",                  "label": "가격",     "higher_is_better": false}
  ],
  "insight_thresholds": {"good": 25, "warning": 15}
}'::jsonb);

COMMIT;
