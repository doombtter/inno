import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/product.dart';
import '../../providers/api_providers.dart';
import '../../providers/products_providers.dart';
import '../../widgets/async_value_view.dart';
import '../../widgets/product_thumb.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      ref.read(productSearchQueryProvider.notifier).state = v;
    });
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(productSearchQueryProvider);
    final results = ref.watch(productSearchResultsProvider);

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: '제품, 제조사 검색',
            border: InputBorder.none,
          ),
          textInputAction: TextInputAction.search,
          onChanged: _onChanged,
        ),
      ),
      body: query.trim().isEmpty
          ? const _Placeholder()
          : AsyncValueView<List<Product>>(
              value: results,
              data: (list) {
                if (list.isEmpty) return _EmptyResults(query: query);
                return ListView.separated(
                  itemCount: list.length,
                  separatorBuilder: (_, __) =>
                      Divider(height: 1, color: Colors.grey.shade200),
                  itemBuilder: (context, i) {
                    final p = list[i];
                    final thumb = p.images.product.isNotEmpty
                        ? p.images.product.first
                        : null;
                    return ListTile(
                      leading: ProductThumb(url: thumb, size: 48),
                      title: Text(p.name),
                      subtitle:
                          Text('${p.category.name} · ${p.manufacturer.name}'),
                      onTap: () => context.push('/product/${p.id}'),
                    );
                  },
                );
              },
            ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Text(
          '제품명 또는 제조사로 검색해보세요',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade600,
              ),
        ),
      ),
    );
  }
}

class _EmptyResults extends ConsumerStatefulWidget {
  const _EmptyResults({required this.query});
  final String query;

  @override
  ConsumerState<_EmptyResults> createState() => _EmptyResultsState();
}

class _EmptyResultsState extends ConsumerState<_EmptyResults> {
  bool _sending = false;
  bool _sent = false;

  Future<void> _request() async {
    setState(() => _sending = true);
    try {
      await ref
          .read(productRequestsRepositoryProvider)
          .create(searchQuery: widget.query);
      if (mounted) setState(() => _sent = true);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('요청을 보내지 못했어요. 잠시 후 다시 시도해주세요.')),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '"${widget.query}" 검색 결과가 없어요',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              '이 제품이 없나요? 등록을 요청하면 함량 데이터를 추가합니다.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                  ),
            ),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: _sent || _sending ? null : _request,
              child: Text(_sent ? '요청 완료' : '등록 요청'),
            ),
          ],
        ),
      ),
    );
  }
}
