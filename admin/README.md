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

## 인증 (`ADMIN_TOKEN`)

백엔드의 `ADMIN_TOKEN` env로 보호된다. 어드민이 백엔드에 요청할 때마다
`X-Admin-Token: <token>` 헤더를 동봉한다.

흐름:

1. 운영자가 `/login`에서 토큰 입력
2. 토큰을 `localStorage.inno_admin_token`에 저장
3. 가벼운 admin GET으로 토큰 유효성 확인 → 통과 시 `/products`로 이동
4. 이후 모든 요청에 헤더 자동 첨부

토큰 발급:

```bash
openssl rand -hex 32   # 백엔드 .env의 ADMIN_TOKEN에 넣고, 같은 값을 운영자에게 공유
```

기기/브라우저별로 한 번만 붙여넣으면 된다 — 갱신/만료 없음. 토큰이 노출되면 백엔드
`.env`의 값을 바꾸면 모든 세션이 무효화된다.

## 화면

| 경로 | 설명 |
|---|---|
| `/login` | 토큰 입력 |
| `/products` | 제품 목록 + 검색/카테고리/상태 필터 + 페이징 |
| `/products/new` | 신규 등록 폼 (좌: 이미지, 우: 폼) |
| `/products/[id]` | 수정 폼 + 상태 토글 (검수 대기/노출/반려) |

## 카테고리별 동적 필드

핵심 지표 섹션은 카테고리 메타에서 직접 읽어 렌더링한다.

- `category.keyMetric.field` → 첫 번째 numeric 입력
- `category.sortableFields` 중 `key_metrics.*`인 항목 → 추가 numeric 입력
- 주스 카테고리의 boolean(`hfcs`, `artificial_flavor`, `concentrate_restored`) →
  체크박스 (`components/key-metrics-fields.tsx`에서 카테고리별 화이트리스트)

새 카테고리를 백엔드에 INSERT하면 어드민에 자동으로 드롭다운 항목과 입력 필드가
나타난다 — 코드 변경 0.

## 이미지

MVP에서는 URL 입력만 받는다 (`UrlListField`). 실제 파일 업로드(S3/R2)는 Phase 2.

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

## 검증 체크리스트

수동으로 한 번씩:

- [ ] `/login`에 잘못된 토큰 → 빨간 메시지, 진입 차단
- [ ] `/products`에서 카테고리/상태 필터 동작
- [ ] `/products/new`로 햄 카테고리 제품 등록 → 목록 + 모바일 공개 API에 즉시 노출
- [ ] 주스 카테고리 선택 시 boolean 체크박스 3개 노출 확인
- [ ] 제조사 콤보박스에서 없는 이름 입력 → "새 제조사로 등록" 버튼으로 즉석 생성
- [ ] 수정 화면에서 상태 버튼으로 pending ↔ approved 토글
