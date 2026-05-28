class Insight {
  Insight({
    required this.slug,
    required this.title,
    this.subtitle,
    this.thumbnail,
    required this.bodyMarkdown,
    required this.relatedProductIds,
    this.categorySlug,
    this.publishedAt,
  });

  factory Insight.fromJson(Map<String, dynamic> json) => Insight(
        slug: json['slug'] as String,
        title: json['title'] as String,
        subtitle: json['subtitle'] as String?,
        thumbnail: json['thumbnail'] as String?,
        bodyMarkdown: json['bodyMarkdown'] as String? ?? '',
        relatedProductIds: (json['relatedProductIds'] as List<dynamic>? ?? const [])
            .map((e) => e as String)
            .toList(),
        categorySlug: json['categorySlug'] as String?,
        publishedAt: json['publishedAt'] == null
            ? null
            : DateTime.tryParse(json['publishedAt'] as String),
      );

  final String slug;
  final String title;
  final String? subtitle;
  final String? thumbnail;
  final String bodyMarkdown;
  final List<String> relatedProductIds;
  final String? categorySlug;
  final DateTime? publishedAt;
}
