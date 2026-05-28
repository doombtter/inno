# 인노 모바일 (Flutter)

함량 그대로, 인노 — Flutter로 만든 본 앱. Riverpod + Dio + go_router.

대상 플랫폼: Android, iOS. 데스크탑/웹은 시도되지 않음.

## 명령

```bash
flutter pub get

# 안드로이드 에뮬레이터 — 호스트의 localhost는 10.0.2.2로 보인다
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000

# iOS 시뮬레이터 — 그냥 localhost
flutter run --dart-define=API_BASE_URL=http://localhost:3000

# 실기기 (같은 Wi-Fi)
flutter run --dart-define=API_BASE_URL=http://192.168.x.y:3000

flutter analyze         # lint + 타입
flutter test            # 단위/위젯 테스트 (현재 7개)
flutter build apk       # 안드로이드 APK
flutter build ios       # iOS (Xcode 빌드 필요)
```

기본 `API_BASE_URL`은 `http://10.0.2.2:3000` — 안드 에뮬레이터 기본 케이스.

## 빌드 옵션

`--dart-define`으로 컴파일 타임 상수 주입:

| 키 | 기본 | 설명 |
|---|---|---|
| `API_BASE_URL` | `http://10.0.2.2:3000` | 백엔드 베이스 (no trailing `/`) |
| `ADS_ENABLED` | `false` | 광고 슬롯 활성화 |

```bash
flutter run \
  --dart-define=API_BASE_URL=https://api.inno.example \
  --dart-define=ADS_ENABLED=true
```

## 화면

| 라우트 | 화면 |
|---|---|
| `/` | 홈: 검색바 + 빠른 액션(비교/바코드) + 카테고리 그리드 + 인사이트 카드 |
| `/category/:slug` | 카테고리 랭킹 (정렬 칩 + 색상 신호) |
| `/product/:id` | 상세: 캐러셀 + 핵심 지표 + 원재료 막대 + 영양성분 + 주의 성분 |
| `/compare` | 2슬롯 비교 테이블 (행마다 winner 강조) |
| `/search` | 디바운스 검색 + 빈 결과 시 "등록 요청" POST |
| `/insight/:slug` | 인사이트 본문 (마크다운) |

비교 슬롯은 글로벌 Riverpod state — 상세에서 "비교에 추가"하면 다른 화면에서도 카운트가
반영된다.

## 디자인 원칙 (코드 변경 시 지켜야 함)

- **카테고리 메타로 동작** — `Category.keyMetric.field`, `sortableFields`,
  `insightThresholds`를 읽는다. 카테고리별 if/else 분기 금지.
- **색상은 신호로만** — `core/theme.dart`의 `signalColor()`만 사용. 장식적 색 X.
- **다이어트 어휘 금지** — UI 카피/주석/식별자에서 "건강한", "다이어트", "저칼로리" 금지.
- **광고는 `AdSlot` 위젯** — 새 광고 자리는 이걸로 잡고 placement만 다르게. 활성화는
  `Env.adsEnabled` 일괄 토글.

## 코드 지도

```
lib/
├── main.dart                 # ProviderScope(InnoApp)
├── app.dart                  # MaterialApp.router, 6개 라우트
├── core/
│   ├── env.dart              # --dart-define
│   ├── api_client.dart       # Dio
│   ├── theme.dart            # signalColor, 라이트 테마
│   └── ads/ad_slot.dart      # 비활성 광고 슬롯
├── domain/                   # Category, Product, Insight + fromJson
├── data/                     # repository 4종
├── providers/                # Riverpod
├── ui/                       # home / category / product / compare / search / insight
└── widgets/                  # ProductCard, MetricBadge, AsyncValueView 등
```

## 테스트

```bash
flutter test
```

- `test/widget_test.dart` — `signalColor` 임계값 4건, `MetricBadge` 렌더
- `test/domain_parse_test.dart` — 실제 백엔드 응답 스냅샷으로 `Category.fromJson`,
  `Product.fromJson` 검증

새 도메인 타입 추가 시 두 번째 파일에 fixture를 하나 더 추가하는 게 회귀 안전선.
