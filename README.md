# 인노 (Inno)

> 함량 그대로, 인노 — 가공식품 라벨 진실 비교 플랫폼.

가공식품을 카테고리별 핵심 함량(돈육 %, 과즙 %, 고기 %, …) 기준으로 비교·정렬해
보여주는 모바일 앱과, 데이터를 입력·관리하는 어드민. 다이어트 앱이 아니라 **라벨에
적힌 그대로의 함량을 비교 축으로** 사용한다.

기획서는 별도 문서에 있다:
- [`02_main_app_spec.md`](./02_main_app_spec.md) — 본 앱
- [`01_admin_data_tool_spec.md`](./01_admin_data_tool_spec.md) — 어드민

## 구조

```
inno/
├── db/         # PostgreSQL 마이그레이션 + 시드 (단일 진실 출처)
├── backend/    # NestJS API — 모바일/어드민 공통, pg 직접
├── mobile/     # Flutter 본 앱 (Riverpod + Dio + go_router)
└── admin/      # Next.js 어드민 (Tailwind + React Query)
```

데이터 흐름:

```
어드민 ──(write)──▶ NestJS ──▶ PostgreSQL ──▶ NestJS ──(read)──▶ 모바일 앱
```

## 빠른 시작 (0 → 동작)

### 1. PostgreSQL + 스키마

```bash
# PG 16 가정. 다른 환경이면 db/README.md 참고.
sudo -u postgres createdb inno
sudo -u postgres psql -d inno -f db/migrations/0001_init.sql
sudo -u postgres psql -d inno -f db/seeds/0001_categories.sql
sudo -u postgres psql -d inno -f db/seeds/0002_manufacturers.sql
sudo -u postgres psql -d inno -f db/seeds/0003_sample_products.sql
```

### 2. 백엔드 (port 3000)

```bash
cd backend
cp .env.example .env       # DATABASE_URL, JWT_SECRET, BOOTSTRAP_ADMIN_* 수정
npm install
npm run start:dev          # http://localhost:3000/api
# 첫 시작 시 BOOTSTRAP_ADMIN_EMAIL/PASSWORD로 admin 계정이 만들어짐
```

### 3. 어드민 (port 3001)

```bash
cd admin
cp .env.example .env.local
npm install
npm run dev -- -p 3001     # http://localhost:3001/login
# 백엔드 BOOTSTRAP_ADMIN_EMAIL/PASSWORD로 로그인 → 제품 CRUD
```

### 4. 모바일

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000   # Android 에뮬
flutter run --dart-define=API_BASE_URL=http://localhost:3000  # iOS 시뮬
```

## 자세한 가이드

- 백엔드 API · 엔드포인트 · env → [`backend/README.md`](./backend/README.md)
- 어드민 화면 흐름 · ADMIN_TOKEN 발급 → [`admin/README.md`](./admin/README.md)
- 모바일 화면 · 빌드 옵션 · 에뮬레이터 별 URL → [`mobile/README.md`](./mobile/README.md)
- DB 스키마 · 마이그레이션 · 시드 → [`db/README.md`](./db/README.md)

## 카테고리 추가는 코드 없이

새 카테고리(예: 초콜릿)는 백엔드/모바일/어드민 코드 변경 없이 DB에 INSERT만 하면 동작한다.

```sql
INSERT INTO categories (slug, name, key_metrics_schema, display_order) VALUES
('chocolate', '초콜릿',
 '{"key_metric": {"field":"cacao_content_pct","label":"카카오 함량","unit":"%","higher_is_better":true},
   "sortable_fields": [
     {"field":"key_metrics.cacao_content_pct","label":"카카오 함량","higher_is_better":true},
     {"field":"avg_online_price","label":"가격","higher_is_better":false}
   ],
   "insight_thresholds": {"good":70, "warning":40}
 }'::jsonb, 4);
```

이후 어드민의 카테고리 드롭다운, 모바일 홈 그리드, 정렬 칩, 랭킹 색상이 자동으로 따라온다.

이 원칙(카테고리 메타 기반)을 어기는 하드코딩이 나오면 다시 뽑는다.
