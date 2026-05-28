import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/theme.dart';
import 'ui/category/category_screen.dart';
import 'ui/compare/compare_screen.dart';
import 'ui/home/home_screen.dart';
import 'ui/insight/insight_detail_screen.dart';
import 'ui/product/product_detail_screen.dart';
import 'ui/search/search_screen.dart';

final _router = GoRouter(
  routes: [
    GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
    GoRoute(
      path: '/category/:slug',
      builder: (_, state) =>
          CategoryScreen(slug: state.pathParameters['slug']!),
    ),
    GoRoute(
      path: '/product/:id',
      builder: (_, state) =>
          ProductDetailScreen(id: state.pathParameters['id']!),
    ),
    GoRoute(path: '/compare', builder: (_, __) => const CompareScreen()),
    GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
    GoRoute(
      path: '/insight/:slug',
      builder: (_, state) =>
          InsightDetailScreen(slug: state.pathParameters['slug']!),
    ),
  ],
);

class InnoApp extends ConsumerWidget {
  const InnoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: '인노',
      debugShowCheckedModeBanner: false,
      theme: InnoTheme.light(),
      routerConfig: _router,
    );
  }
}
