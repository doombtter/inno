import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';

import 'package:inno_app/domain/category.dart';
import 'package:inno_app/domain/product.dart';

/// Snapshots of actual Inno backend responses (see backend/test fixtures in
/// the project notes). These tests guard the JSON shape the API promises.
void main() {
  test('Category.fromJson parses the ham category', () {
    final json = jsonDecode('''
    {
      "slug": "ham",
      "name": "햄/소시지",
      "keyMetric": {
        "field": "pork_content_pct",
        "label": "돈육 함량",
        "unit": "%",
        "higherIsBetter": true
      },
      "sortableFields": [
        {"field": "key_metrics.pork_content_pct", "label": "돈육 함량", "higherIsBetter": true},
        {"field": "nutrition.sodium", "label": "나트륨", "higherIsBetter": false},
        {"field": "avg_online_price", "label": "가격", "higherIsBetter": false}
      ],
      "insightThresholds": {"good": 85, "warning": 70}
    }
    ''') as Map<String, dynamic>;

    final c = Category.fromJson(json);
    expect(c.slug, 'ham');
    expect(c.keyMetric.field, 'pork_content_pct');
    expect(c.keyMetric.higherIsBetter, true);
    expect(c.sortableFields, hasLength(3));
    expect(c.sortableFields[1].higherIsBetter, false);
    expect(c.insightThresholds.good, 85);
    expect(c.insightThresholds.warning, 70);
  });

  test('Product.fromJson parses a spam-classic row with categoryStats', () {
    final json = jsonDecode('''
    {
      "id": "d00ddd65-e354-4528-9e29-9bb4b6a88ee4",
      "barcode": null,
      "name": "스팸 클래식 200g",
      "manufacturer": {"id": "ba5690ca-19cc-47f1-824c-5c7b9c6a0e24", "name": "CJ제일제당"},
      "category": {"slug": "ham", "name": "햄/소시지"},
      "volume": {"value": 200, "unit": "g"},
      "price": {"msrp": 5000, "avgOnline": 4800},
      "images": {"product": [], "label": []},
      "ingredients": {"rawText": "돼지고기 91%, 정제수, 정제소금", "parsed": [{"name": "돼지고기", "pct": 91, "origin": "미국"}]},
      "additives": ["아질산나트륨"],
      "allergens": ["돼지고기"],
      "nutrition": {"baseUnit": "100g", "baseAmount": 100, "kcal": 280, "protein": 13, "fat": 25, "sodium": 720},
      "keyMetrics": {"pork_content_pct": 91},
      "categoryStats": {"rank": 1, "total": 3, "avgKeyMetric": 89.0}
    }
    ''') as Map<String, dynamic>;

    final p = Product.fromJson(json);
    expect(p.name, '스팸 클래식 200g');
    expect(p.manufacturer.name, 'CJ제일제당');
    expect(p.volume.value, 200);
    expect(p.volume.unit, 'g');
    expect(p.price.avgOnline, 4800);
    expect(p.metricValue('pork_content_pct'), 91);
    expect(p.categoryStats?.rank, 1);
    expect(p.categoryStats?.total, 3);
    expect(p.nutrition.sodium, 720);
    expect(p.additives, contains('아질산나트륨'));
    expect(p.ingredients.parsed.first.pct, 91);
  });
}
