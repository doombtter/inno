import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/product.dart';
import 'api_providers.dart';

/// MVP allows up to two products in the compare tray (Phase 2 widens to three).
const int kCompareMaxSlots = 2;

/// Ordered list of product ids in the compare tray. Mutated through
/// [CompareSlots] methods so screens don't poke the list directly.
class CompareSlots extends Notifier<List<String>> {
  @override
  List<String> build() => const [];

  /// Adds [productId] if not already present and the tray isn't full.
  /// Returns true when the slot count actually changed.
  bool add(String productId) {
    if (state.contains(productId)) return false;
    if (state.length >= kCompareMaxSlots) return false;
    state = [...state, productId];
    return true;
  }

  void remove(String productId) {
    state = state.where((id) => id != productId).toList();
  }

  void clear() {
    state = const [];
  }

  bool contains(String productId) => state.contains(productId);
  bool get isFull => state.length >= kCompareMaxSlots;
}

final compareSlotsProvider =
    NotifierProvider<CompareSlots, List<String>>(CompareSlots.new);

final compareProductsProvider = FutureProvider<List<Product>>((ref) async {
  final ids = ref.watch(compareSlotsProvider);
  if (ids.length < 2) return const [];
  return ref.watch(productsRepositoryProvider).compare(ids);
});
