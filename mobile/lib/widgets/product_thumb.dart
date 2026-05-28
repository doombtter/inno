import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// 80×80 rounded thumbnail with a placeholder for missing/empty image URLs.
class ProductThumb extends StatelessWidget {
  const ProductThumb({
    super.key,
    required this.url,
    this.size = 72,
  });

  final String? url;
  final double size;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(8);
    final fallback = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: radius,
      ),
      alignment: Alignment.center,
      child: Icon(Icons.image_outlined,
          color: Colors.grey.shade400, size: size * 0.4),
    );

    if (url == null || url!.isEmpty) return fallback;
    return ClipRRect(
      borderRadius: radius,
      child: CachedNetworkImage(
        imageUrl: url!,
        width: size,
        height: size,
        fit: BoxFit.cover,
        placeholder: (_, __) => fallback,
        errorWidget: (_, __, ___) => fallback,
      ),
    );
  }
}
