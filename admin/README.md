# 인노 어드민 (Next.js)

운영자 1-3인이 가공식품 데이터를 입력·검수·관리하는 내부 도구. Next.js 14 App Router +
Tailwind + React Query.

## 명령

```bash
npm install
npm run dev -- -p 3001    # http://localhost:3001
npm run build             # 정적 빌드
npm run start -- -p 3001  # 프로덕션 실행
npm run lint              # ESLint
```

백엔드가 3000을 쓰므로 어드민은 3001을 권장.

## 환경변수 (`.env.local`)

| 변수 | 필수 | 예시 |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Y | `http://localhost:3000` |

`NEXT_PUBLIC_` 접두사라 브라우저 번들에 포함된다 — 비밀이 아니다. 진짜 비밀(어드민
토큰)은 운영자가 로그인 화면에 손으로 붙여넣는다.

## 인증 (계정 + JWT)

이메일/비밀번호 로그인. 백엔드가 JWT를 발급하면 어드민이 `localStorage`에 보관하고
이후 모든 요청에 `Authorization: Bearer <jwt>`로 동봉한다.

### 첫 admin 계정

백엔드 `.env`에 `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD`를 넣고 서버를 한
번 띄우면 users 테이블에 admin 행이 만들어진다. 첫 로그인 후 비밀번호는 SQL로 갱신.

### 흐름

1. `/login`에서 이메일/비번 입력 → `POST /admin/auth/login` 호출
2. 응답 `{token, user}`를 `localStorage`에 저장 (`inno_admin_token`, `inno_admin_user`)
3. AuthGuard가 매 진입 시 `GET /admin/auth/me`로 토큰 유효성 검증. 401이면 자동
   로그아웃 + 로그인 화면으로 이동
4. NavBar에 현재 사용자 이름과 역할 배지 노출

### 역할

- `admin` — 모든 admin 기능
- `editor` — create + update + 제조사 추가까지. 상태 토글(승인/반려)은 admin만.
  editor가 만든 제품은 자동으로 `pending` 상태로 들어간다. UI에서도 editor에게는
  상태 버튼이 안 보인다.

## 화면

| 경로 | 설명 |
|---|---|
| `/login` | 토큰 입력 |
| `/products` | 제품 목록 + 검색/카테고리/상태 필터 + 페이징 |
| `/products/new` | 신규 등록 폼 (좌: 이미지, 우: 폼) |
| `/products/[id]` | 수정 폼 + 상태 토글 (검수 대기/노출/반려) + 변경 이력 |
| `/insights` | 인사이트 목록 + 발행/비공개 필터 |
| `/insights/new` | 신규 인사이트 (좌: 메타+본문, 우: 미리보기 + 발행) |
| `/insights/[id]` | 인사이트 수정 |

## 카테고리별 동적 필드

핵심 지표 섹션은 카테고리 메타에서 직접 읽어 렌더링한다.

- `category.keyMetric.field` → 첫 번째 numeric 입력
- `category.sortableFields` 중 `key_metrics.*`인 항목 → 추가 numeric 입력
- 주스 카테고리의 boolean(`hfcs`, `artificial_flavor`, `concentrate_restored`) →
  체크박스 (`components/key-metrics-fields.tsx`에서 카테고리별 화이트리스트)

새 카테고리를 백엔드에 INSERT하면 어드민에 자동으로 드롭다운 항목과 입력 필드가
나타난다 — 코드 변경 0.

## 이미지

URL 직접 입력과 파일 업로드 둘 다 지원한다.

- 어드민 폼의 `UrlListField`(제품 사진/라벨), `ImageUploader`(인사이트 썸네일)에 파일
  선택 버튼이 있다.
- 백엔드는 multipart로 받아 `UPLOAD_DIR/<uuid>.<ext>`에 쓰고, 절대 URL을 응답으로
  돌려준다.
- 백엔드가 `/api/uploads/*`를 정적으로 서빙하므로 본 앱이 그대로 표시할 수 있다.
- 디스크 저장이라 컨테이너 재시작 시 사라진다 — 운영 시 `UPLOAD_DIR`를 볼륨에
  마운트하거나, 같은 인터페이스로 R2/S3 어댑터를 끼우는 게 자연스러운 다음 단계.

허용 mime: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. 한 파일당 5MB.

## 코드 지도

```
src/
├── app/
│   ├── layout.tsx               # Tailwind + React Query Provider
│   ├── page.tsx → /products
│   ├── login/page.tsx
│   └── (auth)/                  # AuthGuard로 묶인 그룹
│       └── products/
│           ├── page.tsx         # 목록
│           ├── new/page.tsx
│           └── [id]/page.tsx
├── components/
│   ├── ui/                      # Tailwind 기반 작은 컴포넌트
│   ├── product-form.tsx         # 2단 레이아웃, 등록/수정 공통
│   ├── manufacturer-combobox.tsx
│   ├── key-metrics-fields.tsx   # 카테고리 메타 기반 동적 폼
│   └── …
├── hooks/                       # React Query 래퍼
└── lib/
    ├── api.ts                   # fetch + 토큰 헤더
    ├── auth.ts                  # localStorage 토큰
    └── types.ts                 # 백엔드 응답 타입
```

## 변경 이력

수정 화면 좌측 패널에 "변경 이력" 카드가 자동 표시된다. 백엔드가 PUT과 상태 토글 시
변경된 필드만 `product_revisions`에 INSERT하고, `/admin/products/:id/revisions`로
최신순 정렬 후 반환한다.

각 항목은 `{시각, 작업자 이름/이메일, 필드별 before → after}` 형태. 객체/배열은
`{…}` / `[N개]`로 요약 (전체 diff는 DB에 그대로 들어있음).

## 검증 체크리스트

수동으로 한 번씩:

- [ ] `/login`에서 잘못된 비번 → 빨간 메시지, 진입 차단
- [ ] `/products`에서 카테고리/상태 필터 동작
- [ ] `/products/new`로 햄 카테고리 제품 등록 → 목록 + 모바일 공개 API에 즉시 노출
- [ ] 주스 카테고리 선택 시 boolean 체크박스 3개 노출 확인
- [ ] 제조사 콤보박스에서 없는 이름 입력 → "새 제조사로 등록"으로 즉석 생성
- [ ] admin 계정으로 수정 화면에서 상태 버튼으로 pending ↔ approved 토글
- [ ] editor 계정으로 같은 화면 진입 → 상태 버튼이 안 보이고 안내 문구만 노출
- [ ] PUT 후 좌측 변경 이력 카드에 새 행 등장
- [ ] `/insights/new`에서 슬러그 + 본문 입력 → 우측에 마크다운 미리보기가 갱신
- [ ] 신규 인사이트는 draft로 저장, 발행 버튼(admin)으로 공개 ↔ 비공개 전환
- [ ] editor 계정에서 인사이트 발행/삭제 버튼이 사라지고 안내 문구만 노출
- [ ] 썸네일 파일 업로드 → 응답 URL이 `<img>` 미리보기에 즉시 반영
- [ ] 발행된 인사이트가 모바일 본 앱 홈의 "오늘의 발견"에 나타남
