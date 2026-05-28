# 인노 DB

PostgreSQL 스키마와 시드. 백엔드(`/backend`)가 같은 DB를 직접 읽고 쓰며, 어드민과
모바일은 백엔드를 거쳐 접근한다. 클라이언트가 별도 스키마를 갖지 않는다.

## 파일

```
db/
├── migrations/
│   └── 0001_init.sql              # 전체 스키마 (idempotent하지 않음 — 한 번만 실행)
└── seeds/
    ├── 0001_categories.sql        # 햄/주스/만두 3개 카테고리 + key_metrics_schema
    ├── 0002_manufacturers.sql     # 시드 제조사 ~10개
    └── 0003_sample_products.sql   # 카테고리당 3개씩, 총 9개 제품
```

마이그레이션 도구(prisma, knex 등)는 도입하지 않았다. 운영 규모가 작아서 운영자가
직접 `psql -f`로 적용하고, 변경은 새 번호의 sql을 추가하는 식.

## 첫 셋업

```bash
sudo -u postgres createdb inno
sudo -u postgres psql -d inno -v ON_ERROR_STOP=1 -f migrations/0001_init.sql
sudo -u postgres psql -d inno -v ON_ERROR_STOP=1 \
  -f seeds/0001_categories.sql \
  -f seeds/0002_manufacturers.sql \
  -f seeds/0003_sample_products.sql
```

`ON_ERROR_STOP=1`은 중간에 SQL 에러가 나면 즉시 멈추라는 옵션 — 시드를 부분 적용한
상태로 두지 않기 위해 권장.

## 핵심 테이블

- `categories` — `key_metrics_schema JSONB`가 카테고리별 동적 필드 정의를 갖는다.
  백엔드/어드민/모바일이 모두 이걸 읽어서 정렬·랭킹·폼을 만든다. 하드코딩 0이 목표.
- `products` — JSONB 컬럼 세 개:
  - `ingredients_parsed` (`[{name, pct?, origin?}, ...]`)
  - `nutrition` (kcal/protein/... 키)
  - `key_metrics` (카테고리별 자유형: `{pork_content_pct: 87}` 등)
- `manufacturers` — `aliases TEXT[]`로 검색 동의어
- `product_revisions` — 감사 로그용 (아직 자동 적재 미구현)
- `insights` — 홈 카드 + 본문 (마크다운)
- `product_requests` — 사용자가 검색 빈 결과에서 보낸 등록 요청

상세는 `migrations/0001_init.sql` 참고.

## 카테고리 추가

코드 변경 없이 어드민/모바일 어디든 자동 반영된다.

```sql
INSERT INTO categories (slug, name, key_metrics_schema, display_order)
VALUES ('chocolate', '초콜릿',
  '{
    "key_metric": {"field":"cacao_content_pct","label":"카카오 함량","unit":"%","higher_is_better":true},
    "sortable_fields": [
      {"field":"key_metrics.cacao_content_pct","label":"카카오 함량","higher_is_better":true},
      {"field":"avg_online_price","label":"가격","higher_is_better":false}
    ],
    "insight_thresholds": {"good": 70, "warning": 40}
  }'::jsonb,
  4);
```

이후:

- 어드민 `/products/new`: 카테고리 드롭다운에 자동 노출 + 핵심 지표 입력 칸 자동 생성
- 모바일 홈: 카테고리 그리드에 새 타일
- 모바일 카테고리 화면: 정렬 칩 + 색상 신호가 새 메타로 동작

## 정리

테스트/개발 후 DB 초기화:

```bash
sudo -u postgres dropdb inno
```

## 마이그레이션 추가 시 규칙

1. 파일명: `00NN_<짧은_설명>.sql` (NN 증가)
2. `BEGIN; … COMMIT;`로 감싼다
3. 새 컬럼이라면 NOT NULL이면서 DEFAULT를 함께 주는 게 안전 (기존 행 잠금 회피)
4. JSONB 컬럼이라면 GIN 인덱스가 필요한지 검토 (기존 패턴 참고)
5. 백엔드 코드가 그 컬럼을 알기 전에는 SELECT 절에 넣지 말 것
