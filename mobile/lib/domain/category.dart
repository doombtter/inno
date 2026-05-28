class CategoryKeyMetric {
  CategoryKeyMetric({
    required this.field,
    required this.label,
    required this.unit,
    required this.higherIsBetter,
  });

  factory CategoryKeyMetric.fromJson(Map<String, dynamic> json) {
    return CategoryKeyMetric(
      field: json['field'] as String,
      label: json['label'] as String,
      unit: (json['unit'] as String?) ?? '%',
      higherIsBetter: json['higherIsBetter'] as bool? ?? true,
    );
  }

  final String field;
  final String label;
  final String unit;
  final bool higherIsBetter;
}

class CategorySortableField {
  CategorySortableField({
    required this.field,
    required this.label,
    required this.higherIsBetter,
  });

  factory CategorySortableField.fromJson(Map<String, dynamic> json) {
    return CategorySortableField(
      field: json['field'] as String,
      label: json['label'] as String,
      higherIsBetter: json['higherIsBetter'] as bool? ?? true,
    );
  }

  final String field;
  final String label;
  final bool higherIsBetter;
}

class CategoryThresholds {
  CategoryThresholds({required this.good, required this.warning});

  factory CategoryThresholds.fromJson(Map<String, dynamic> json) {
    return CategoryThresholds(
      good: (json['good'] as num).toDouble(),
      warning: (json['warning'] as num).toDouble(),
    );
  }

  final double good;
  final double warning;
}

class Category {
  Category({
    required this.slug,
    required this.name,
    required this.keyMetric,
    required this.sortableFields,
    required this.insightThresholds,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      slug: json['slug'] as String,
      name: json['name'] as String,
      keyMetric: CategoryKeyMetric.fromJson(
        json['keyMetric'] as Map<String, dynamic>,
      ),
      sortableFields: (json['sortableFields'] as List<dynamic>)
          .map((e) => CategorySortableField.fromJson(e as Map<String, dynamic>))
          .toList(),
      insightThresholds: CategoryThresholds.fromJson(
        json['insightThresholds'] as Map<String, dynamic>,
      ),
    );
  }

  final String slug;
  final String name;
  final CategoryKeyMetric keyMetric;
  final List<CategorySortableField> sortableFields;
  final CategoryThresholds insightThresholds;
}
