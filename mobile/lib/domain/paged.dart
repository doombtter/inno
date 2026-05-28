class Paged<T> {
  Paged({
    required this.items,
    required this.total,
    required this.page,
    required this.size,
  });

  factory Paged.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) parseItem,
  ) {
    return Paged<T>(
      items: (json['items'] as List<dynamic>)
          .map((e) => parseItem(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num).toInt(),
      page: (json['page'] as num).toInt(),
      size: (json['size'] as num).toInt(),
    );
  }

  final List<T> items;
  final int total;
  final int page;
  final int size;
}
