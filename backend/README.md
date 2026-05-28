# 인노 백엔드 (NestJS)

모바일 본 앱과 어드민이 함께 쓰는 단일 API. pg 드라이버 직접 사용.

## 명령

```bash
npm install
npm run start:dev        # nest start --watch (개발)
npm run start            # nest start (그냥 한 번)
npm run build            # dist/ 생성
npm run start:prod       # node dist/main.js
npm run typecheck        # tsc --noEmit
```

## 환경변수 (`.env`)

| 변수 | 필수 | 예시 |
|---|---|---|
| `DATABASE_URL` | Y | `postgres://postgres:postgres@127.0.0.1:5432/inno` |
| `PORT` | N (기본 3000) | `3000` |
| `CORS_ORIGINS` | N (기본 `*`) | `http://localhost:3001` |
| `ADMIN_TOKEN` | Y (admin 사용 시) | `openssl rand -hex 32` |

`ADMIN_TOKEN`이 비어있거나 8자 미만이면 `/admin/*` 라우트가 통째로 401을 반환한다 —
프로덕션에서 잊고 안 채우는 사고를 막기 위해 의도된 동작이다.

## 엔드포인트

모든 경로는 `/api` 접두사를 가진다. 인증이 필요한 라우트는 `X-Admin-Token` 헤더(또는
`Authorization: Bearer …`)로 보호된다.

### Public (모바일 앱)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/categories` | 카테고리 목록 + key metric 메타 |
| GET | `/categories/:slug/products` | 카테고리 랭킹. `?sort=…&manufacturer=…&maxPrice=…&page=&size=` |
| GET | `/products/:id` | 제품 상세 + categoryStats |
| GET | `/products/compare?ids=a,b,c` | 2-3개 비교 |
| GET | `/products/search?q=…` | 이름/제조사 검색 |
| GET | `/content/insights` | 발행된 인사이트 카드 |
| GET | `/content/insights/:slug` | 인사이트 상세 |
| POST | `/products/requests` | 사용자 "이 제품 등록 요청" |

`sort`는 카테고리 메타의 `sortable_fields`에 화이트리스트된 필드만 허용 — 임의의
JSONB 경로 주입 불가.

### Admin (어드민)

전부 `X-Admin-Token` 필요.

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/admin/products` | `?q=&category=&status=&page=&size=`. status=`any`로 전 상태 |
| GET | `/admin/products/:id` | 상세 (pending도 조회 가능) |
| POST | `/admin/products` | 신규 등록 |
| PUT | `/admin/products/:id` | 전체 업데이트 |
| PATCH | `/admin/products/:id/status` | `{status: 'pending'\|'approved'\|'rejected'}` |
| GET | `/admin/manufacturers?q=` | 자동완성용 검색 |
| POST | `/admin/manufacturers` | 신규 제조사 |

POST/PUT 페이로드는 `src/admin/dto/product-payload.dto.ts`의 `ProductPayloadDto`와
같다. `keyMetrics`는 자유형(Record<string, number\|boolean>)이지만 서비스가 키 형식과
값 타입을 검사한다.

## DB 준비

```bash
cd ../db   # 또는 프로젝트 루트에서
sudo -u postgres createdb inno
sudo -u postgres psql -d inno -f migrations/0001_init.sql
sudo -u postgres psql -d inno -f seeds/0001_categories.sql
sudo -u postgres psql -d inno -f seeds/0002_manufacturers.sql
sudo -u postgres psql -d inno -f seeds/0003_sample_products.sql
```

자세한 건 [`../db/README.md`](../db/README.md).

## 코드 지도

```
src/
├── main.ts               # bootstrap, /api prefix, ValidationPipe, CORS
├── app.module.ts
├── common/               # DTO 매퍼, 공유 타입
├── database/             # pg Pool + PG_POOL 토큰
├── categories/           # /api/categories
├── products/             # /api/products/*, /api/categories/:slug/products
├── insights/             # /api/content/insights
├── product-requests/     # POST /api/products/requests
└── admin/                # /api/admin/* (AdminTokenGuard 적용)
```

## 검증

자동 테스트는 없다. 검증은 curl + 시드 DB로 수행 — 새 라우트 추가 시 비슷한 흐름으로
확인한다.

```bash
# 헬스 체크
curl http://localhost:3000/api/categories | jq

# admin
TOKEN=$(grep ^ADMIN_TOKEN .env | cut -d= -f2)
curl -H "X-Admin-Token: $TOKEN" http://localhost:3000/api/admin/products
```
