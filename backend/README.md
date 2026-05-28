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
| `JWT_SECRET` | Y | `openssl rand -hex 32` |
| `JWT_TTL` | N (기본 `7d`) | `12h`, `30d` |
| `BOOTSTRAP_ADMIN_EMAIL` | 첫 셋업 시 | `admin@inno.local` |
| `BOOTSTRAP_ADMIN_PASSWORD` | 첫 셋업 시 | `change-me-on-first-login` |
| `BOOTSTRAP_ADMIN_NAME` | N | `Admin` |
| `UPLOAD_DIR` | N (기본 `./uploads`) | `/var/inno/uploads` |
| `PUBLIC_BASE_URL` | N | `https://api.inno.example` (업로드 응답 URL) |

`JWT_SECRET`이 16자 미만이면 서버가 시작 시 던진다 — 프로덕션에서 잊고 안 채우는
사고를 막기 위해 의도된 동작이다.

`BOOTSTRAP_ADMIN_*`는 users 테이블에 admin이 0명일 때만 동작한다. 첫 로그인 후
SQL로 비번을 갈고 env에서 지워도 된다.

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

POST `/admin/auth/login`을 제외한 모든 admin 라우트는 `Authorization: Bearer <jwt>`
헤더가 필요하다 (또는 호환용 `X-Admin-Token: <jwt>`도 받음).

| 메서드 | 경로 | 역할 | 설명 |
|---|---|---|---|
| POST | `/admin/auth/login` | 누구나 | `{email, password}` → `{token, user}` |
| GET | `/admin/auth/me` | 로그인 | 현재 사용자 (DB에서 새로 읽음) |
| GET | `/admin/products` | 로그인 | `?q=&category=&status=&page=&size=` |
| GET | `/admin/products/:id` | 로그인 | 상세 (pending 포함) |
| GET | `/admin/products/:id/revisions` | 로그인 | 변경 이력 (최신순) |
| POST | `/admin/products` | 로그인 | 신규 등록 |
| PUT | `/admin/products/:id` | 로그인 | 전체 업데이트 (자동으로 revisions 적재) |
| PATCH | `/admin/products/:id/status` | **admin** | 노출/검수 대기/반려 전환 |
| GET | `/admin/manufacturers?q=` | 로그인 | 자동완성 검색 |
| POST | `/admin/manufacturers` | 로그인 | 신규 제조사 |
| GET | `/admin/insights` | 로그인 | `?q=&status=draft\|published\|any` |
| GET | `/admin/insights/:id` | 로그인 | 상세 |
| POST | `/admin/insights` | 로그인 | 신규 인사이트 (draft로 시작) |
| PUT | `/admin/insights/:id` | 로그인 | 전체 업데이트 |
| PATCH | `/admin/insights/:id/publish` | **admin** | `{publishedAt: ISO\|null}` |
| DELETE | `/admin/insights/:id` | **admin** | 삭제 |
| POST | `/admin/uploads` | 로그인 | multipart `file` 필드, image/jpeg/png/webp/gif ≤5MB |

역할 정책:
- `admin` — 모든 admin 라우트
- `editor` — create/update/제조사 추가 OK, status PATCH는 403

PUT과 status PATCH는 변경된 필드만 `product_revisions`에 INSERT한다 (changed_by =
JWT의 sub). 변경 없을 시 INSERT 생략.

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
├── auth/                 # JWT 발급/검증, users 부트스트랩, /admin/auth/*
├── admin/                # /api/admin/{products,manufacturers,insights}/* + revisions
└── uploads/              # /api/admin/uploads (multer) + 정적 /api/uploads/*
```

## 검증

자동 테스트는 없다. 검증은 curl + 시드 DB로 수행 — 새 라우트 추가 시 비슷한 흐름으로
확인한다.

```bash
# 헬스 체크
curl http://localhost:3000/api/categories | jq

# admin: 로그인 → 토큰 → 사용
TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"email":"admin@inno.local","password":"hunter2"}' \
  http://localhost:3000/api/admin/auth/login | jq -r .token)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/products | jq
```
