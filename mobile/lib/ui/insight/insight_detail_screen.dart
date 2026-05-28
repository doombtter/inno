import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/insight.dart';
import '../../providers/insights_providers.dart';
import '../../widgets/async_value_view.dart';

class InsightDetailScreen extends ConsumerWidget {
  const InsightDetailScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final insightAsync = ref.watch(insightBySlugProvider(slug));
    return Scaffold(
      appBar: AppBar(title: const Text('')),
      body: AsyncValueView<Insight>(
        value: insightAsync,
        data: (insight) => ListView(
          padding: EdgeInsets.zero,
          children: [
            if (insight.thumbnail != null)
              AspectRatio(
                aspectRatio: 16 / 9,
                child: CachedNetworkImage(
                  imageUrl: insight.thumbnail!,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) =>
                      Container(color: Colors.grey.shade100),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    insight.title,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  if (insight.subtitle != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      insight.subtitle!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  MarkdownBody(
                    data: insight.bodyMarkdown,
                    selectable: true,
                    styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context))
                        .copyWith(p: const TextStyle(height: 1.6)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
