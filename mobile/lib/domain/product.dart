double? _maybeDouble(dynamic v) => v == null ? null : (v as num).toDouble();
int? _maybeInt(dynamic v) => v == null ? null : (v as num).toInt();

class ManufacturerRef {
  ManufacturerRef({required this.id, required this.name});

  factory ManufacturerRef.fromJson(Map<String, dynamic> json) =>
      ManufacturerRef(id: json['id'] as String, name: json['name'] as String);

  final String id;
  final String name;
}

class CategoryRef {
  CategoryRef({required this.slug, required this.name});

  factory CategoryRef.fromJson(Map<String, dynamic> json) =>
      CategoryRef(slug: json['slug'] as String, name: json['name'] as String);

  final String slug;
  final String name;
}

class Volume {
  Volume({required this.value, required this.unit});

  factory Volume.fromJson(Map<String, dynamic> json) => Volume(
        value: (json['value'] as num).toDouble(),
        unit: json['unit'] as String,
      );

  final double value;
  final String unit; // 'g' | 'ml' | 'ea'
}

class Price {
  Price({this.msrp, this.avgOnline});

  factory Price.fromJson(Map<String, dynamic> json) => Price(
        msrp: _maybeInt(json['msrp']),
        avgOnline: _maybeInt(json['avgOnline']),
      );

  final int? msrp;
  final int? avgOnline;
}

class ProductImages {
  ProductImages({required this.product, required this.label});

  factory ProductImages.fromJson(Map<String, dynamic> json) => ProductImages(
        product: (json['product'] as List<dynamic>? ?? const [])
            .map((e) => e as String)
            .toList(),
        label: (json['label'] as List<dynamic>? ?? const [])
            .map((e) => e as String)
            .toList(),
      );

  final List<String> product;
  final List<String> label;
}

class IngredientPart {
  IngredientPart({required this.name, this.pct, this.origin});

  factory IngredientPart.fromJson(Map<String, dynamic> json) => IngredientPart(
        name: json['name'] as String,
        pct: _maybeDouble(json['pct']),
        origin: json['origin'] as String?,
      );

  final String name;
  final double? pct;
  final String? origin;
}

class Ingredients {
  Ingredients({required this.rawText, required this.parsed});

  factory Ingredients.fromJson(Map<String, dynamic> json) => Ingredients(
        rawText: json['rawText'] as String? ?? '',
        parsed: (json['parsed'] as List<dynamic>? ?? const [])
            .map((e) => IngredientPart.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  final String rawText;
  final List<IngredientPart> parsed;
}

class Nutrition {
  Nutrition({
    required this.baseUnit,
    required this.baseAmount,
    this.kcal,
    this.protein,
    this.carb,
    this.sugar,
    this.fat,
    this.saturatedFat,
    this.sodium,
    this.cholesterol,
  });

  factory Nutrition.fromJson(Map<String, dynamic> json) => Nutrition(
        baseUnit: json['baseUnit'] as String? ?? '100g',
        baseAmount: (json['baseAmount'] as num? ?? 100).toDouble(),
        kcal: _maybeDouble(json['kcal']),
        protein: _maybeDouble(json['protein']),
        carb: _maybeDouble(json['carb']),
        sugar: _maybeDouble(json['sugar']),
        fat: _maybeDouble(json['fat']),
        saturatedFat: _maybeDouble(json['saturatedFat']),
        sodium: _maybeDouble(json['sodium']),
        cholesterol: _maybeDouble(json['cholesterol']),
      );

  final String baseUnit; // '100g' | '100ml' | 'serving'
  final double baseAmount;
  final double? kcal;
  final double? protein;
  final double? carb;
  final double? sugar;
  final double? fat;
  final double? saturatedFat;
  final double? sodium;
  final double? cholesterol;
}

class CategoryStats {
  CategoryStats({
    required this.rank,
    required this.total,
    required this.avgKeyMetric,
  });

  factory CategoryStats.fromJson(Map<String, dynamic> json) => CategoryStats(
        rank: (json['rank'] as num).toInt(),
        total: (json['total'] as num).toInt(),
        avgKeyMetric: (json['avgKeyMetric'] as num).toDouble(),
      );

  final int rank;
  final int total;
  final double avgKeyMetric;
}

class Product {
  Product({
    required this.id,
    this.barcode,
    required this.name,
    required this.manufacturer,
    required this.category,
    required this.volume,
    required this.price,
    required this.images,
    required this.ingredients,
    required this.additives,
    required this.allergens,
    required this.nutrition,
    required this.keyMetrics,
    this.categoryStats,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'] as String,
        barcode: json['barcode'] as String?,
        name: json['name'] as String,
        manufacturer: ManufacturerRef.fromJson(
          json['manufacturer'] as Map<String, dynamic>,
        ),
        category: CategoryRef.fromJson(
          json['category'] as Map<String, dynamic>,
        ),
        volume: Volume.fromJson(json['volume'] as Map<String, dynamic>),
        price: Price.fromJson(json['price'] as Map<String, dynamic>),
        images: ProductImages.fromJson(
          json['images'] as Map<String, dynamic>,
        ),
        ingredients: Ingredients.fromJson(
          json['ingredients'] as Map<String, dynamic>,
        ),
        additives: (json['additives'] as List<dynamic>? ?? const [])
            .map((e) => e as String)
            .toList(),
        allergens: (json['allergens'] as List<dynamic>? ?? const [])
            .map((e) => e as String)
            .toList(),
        nutrition:
            Nutrition.fromJson(json['nutrition'] as Map<String, dynamic>),
        keyMetrics: Map<String, dynamic>.from(
          json['keyMetrics'] as Map? ?? const {},
        ),
        categoryStats: json['categoryStats'] == null
            ? null
            : CategoryStats.fromJson(
                json['categoryStats'] as Map<String, dynamic>,
              ),
      );

  final String id;
  final String? barcode;
  final String name;
  final ManufacturerRef manufacturer;
  final CategoryRef category;
  final Volume volume;
  final Price price;
  final ProductImages images;
  final Ingredients ingredients;
  final List<String> additives;
  final List<String> allergens;
  final Nutrition nutrition;
  final Map<String, dynamic> keyMetrics;
  final CategoryStats? categoryStats;

  /// Convenience: numeric value for the given key (e.g. 'pork_content_pct').
  /// Returns null when missing or non-numeric (booleans are not coerced).
  double? metricValue(String field) {
    final v = keyMetrics[field];
    if (v is num) return v.toDouble();
    return null;
  }
}
