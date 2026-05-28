# 인노 (Inno) — 데이터 입력 도구 기획서 (관리자용)

> 본 앱에 들어갈 식품 성분 데이터를 빠르게 입력·검수·관리하기 위한 내부 도구.
> 외부 노출 없음. 운영자 1-3인이 사용하는 어드민 웹.

## 0. 브랜드 정보

- **서비스명**: 인노 (Inno)
- **한 줄 정의**: 함량 그대로, 인노 — 가공식품 라벨 진실 비교 플랫폼
- **본 도구명**: 인노 어드민 (Inno Admin)
- **표기 규칙**:
  - 한글: `인노`
  - 영문: `Inno` (대문자 시작, 본문에서는 소문자 `inno` 허용)
  - 코드 식별자: `inno` (소문자 통일)
  - 절대 사용 금지: 다이어트/건강/리얼/저칼로리 류 어휘

---

## 1. 핵심 목적

- 가공식품 제품 데이터를 **수동 입력 + 부분 자동화**로 빠르게 쌓는다
- 입력자가 라벨 사진 → 5-10분 안에 한 제품을 완료할 수 있게 한다
- 데이터 정합성(함량 합계, 누락 필드, 중복 등)을 입력 단계에서 막는다
- 본 앱의 DB와 동일한 스키마를 사용 (이중 변환 없이 바로 서빙 가능)

## 2. 사용 시나리오

### 시나리오 A: 신규 제품 등록
1. 관리자가 마트/쇼핑몰에서 라벨 사진을 모아옴
2. 어드민에서 "신규 제품 등록" → 카테고리 선택 (예: 햄/소시지)
3. 라벨 사진 업로드 → OCR이 영양성분/원재료 텍스트 자동 추출 (선택적)
4. 폼에 자동 채워진 값 검수 + 누락분 수동 입력
5. 검증 통과 시 "저장" → DB 반영 (즉시 본 앱에 노출 or 검수 대기열로)

### 시나리오 B: 기존 제품 수정
1. 제품 리뉴얼 / 함량 변경 감지 시
2. 검색으로 기존 제품 찾기 → 수정
3. 변경 이력 자동 기록 (누가, 언제, 무엇을 변경)

### 시나리오 C: 일괄 가격 업데이트
1. 크롤러가 쿠팡/마켓컬리에서 가격 수집
2. 어드민에서 일괄 가격 갱신 화면으로 확인 후 반영

---

## 3. 기능 요구사항

### 3.1 인증

- 이메일 + 비밀번호 로그인 (간단하게)
- 역할: `admin` (전체 권한) / `editor` (입력만, 삭제 불가)
- 모든 작업에 작업자 기록 (감사 로그)

### 3.2 카테고리 관리

- 카테고리 CRUD (햄/소시지, 만두, 주스/음료, 초콜릿 등)
- 카테고리별 **핵심 비교 축(key_metrics)** 정의
  - 예: 햄 카테고리는 `pork_content_pct`, 주스 카테고리는 `juice_content_pct`
  - 카테고리마다 다른 필드를 가질 수 있도록 JSON Schema 기반으로 정의
- 카테고리별 입력 폼이 동적으로 생성됨

### 3.3 제품 입력 폼

**공통 필드 (모든 카테고리)**

| 필드 | 타입 | 필수 | 비고 |
|---|---|---|---|
| 바코드 | string (13자리) | N | 중복 체크 |
| 제품명 | string | Y | |
| 제조사 | string (자동완성) | Y | 기존 제조사 목록에서 선택/신규 |
| 카테고리 | enum | Y | 드롭다운 |
| 용량 | number + 단위 | Y | g, ml, 개 등 |
| 권장소비자가 | number (원) | N | |
| 평균 온라인가 | number (원) | N | |
| 제품 이미지 | file (jpeg/png) | Y | 1-3장 |
| 라벨 이미지 | file | N | 영양성분/원재료 라벨 |
| 원재료 전체 텍스트 | textarea | Y | 라벨에 적힌 그대로 |
| 첨가물 리스트 | tag input | N | 자동 추출 가능 |
| 알레르기 유발 | checkbox group | N | 식약처 22종 |

**영양성분 (100g 또는 1회 제공량 기준)**

| 필드 | 타입 | 비고 |
|---|---|---|
| 기준 단위 | enum | 100g / 100ml / 1회 |
| 기준 양 | number | |
| 칼로리 (kcal) | number | |
| 단백질 (g) | number | |
| 탄수화물 (g) | number | |
| 당류 (g) | number | |
| 지방 (g) | number | |
| 포화지방 (g) | number | |
| 나트륨 (mg) | number | |
| 콜레스테롤 (mg) | number | 선택 |

**카테고리별 핵심 지표 (동적 필드)**

각 카테고리는 자체 `key_metrics` 필드를 가짐. 예시:

- **햄/소시지**: 돈육 함량(%) — 필수, 0-100
- **만두**: 고기 함량(%), 채소 함량(%), 만두피 비율(%)
- **주스/음료**: 과즙 함량(%), 농축액 환원 여부(bool), 합성착향료 여부(bool), 액상과당 여부(bool)
- **초콜릿**: 카카오 함량(%), 카카오버터 사용 여부(bool), 식물성유지 대체 여부(bool)
- **우유/유음료**: 원유 함량(%), 무지유고형분(%)

### 3.4 입력 보조 기능

**OCR 자동 추출 (필수)**
- 라벨 이미지 업로드 시 영양성분표/원재료 텍스트 추출
- 추출된 값이 폼에 자동 입력됨 (사용자가 검수)
- 추천 OCR: Google Cloud Vision API 또는 네이버 클로바 OCR (한글 정확도 좋음)
- 정확도 80% 수준으로 가정, 검수 필수

**원재료 텍스트 → 구조화 파싱 (선택)**
- "돼지고기(국산) 87%, 정제수, 정제소금 1.2%, ..." 같은 텍스트에서
- "돼지고기 87%" 같은 함량 표시를 자동 추출
- 카테고리의 핵심 지표 필드에 자동 채움

**중복 체크**
- 바코드 입력 시 실시간 중복 검사
- 제품명 + 제조사 + 용량 조합으로도 유사 제품 경고

**검증 규칙**
- 함량 합계가 100%를 넘으면 경고 (오타 방지)
- 영양성분이 비정상 범위면 경고 (예: 100g당 칼로리 > 900kcal)
- 필수 필드 누락 시 저장 차단

### 3.5 검수 대기열 (선택적 워크플로우)

- 입력자가 등록한 제품은 기본 `pending` 상태
- 관리자가 검수 후 `approved` → 본 앱에 노출
- 검수 화면: 입력값 + 라벨 사진 나란히 보고 빠르게 승인/반려
- MVP 단계에서는 생략 가능 (입력 = 즉시 노출), 운영 인원 늘어나면 도입

### 3.6 제품 목록 / 검색

- 카테고리, 제조사, 상태(pending/approved), 입력자로 필터
- 컬럼: 제품명, 제조사, 카테고리, 핵심 지표값, 등록일, 작업자
- CSV 내보내기 (백업 및 콘텐츠 마케팅용 데이터 추출)
- 일괄 작업: 가격 일괄 수정, 상태 일괄 변경

### 3.7 변경 이력

- 모든 수정 사항 기록 (필드별 before/after)
- 누가, 언제, 무엇을 변경했는지 조회 가능
- 함량 변경 시 자동으로 "리뉴얼 이력" 태그 부여

### 3.8 통계 대시보드

- 카테고리별 등록 제품 수
- 일별/주별 입력량 (입력자별)
- 검수 대기 건수
- 누락 필드 많은 제품 리스트

---

## 4. 기술 스택 권장

> 본 앱과 동일 스택으로 통일하는 게 운영 비용 최소화. 다음은 권장안.

- **프론트**: Next.js + TypeScript + Tailwind + shadcn/ui
- **백엔드**: Next.js API Route 또는 별도 NestJS
- **DB**: PostgreSQL (JSONB 필드 활용 — 카테고리별 동적 필드)
- **파일 저장**: AWS S3 또는 Cloudflare R2 (이미지)
- **OCR**: Google Cloud Vision API 또는 네이버 클로바 OCR
- **인증**: NextAuth.js (간단), 이메일+비번
- **배포**: Vercel + RDS 또는 단일 VPS

---

## 5. 데이터베이스 스키마 (핵심)

```sql
-- 카테고리
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  slug VARCHAR(50) UNIQUE,            -- 'ham', 'dumpling', 'juice'
  name VARCHAR(100),                  -- '햄/소시지'
  key_metrics_schema JSONB,           -- 동적 필드 정의 (JSON Schema)
  display_order INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 제조사
CREATE TABLE manufacturers (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  aliases TEXT[],                     -- 검색 동의어
  created_at TIMESTAMP
);

-- 제품
CREATE TABLE products (
  id UUID PRIMARY KEY,
  barcode VARCHAR(13) UNIQUE,
  name VARCHAR(200) NOT NULL,
  manufacturer_id UUID REFERENCES manufacturers(id),
  category_id UUID REFERENCES categories(id),
  volume_value NUMERIC,
  volume_unit VARCHAR(10),            -- g, ml, ea
  msrp NUMERIC,                       -- 권장소비자가
  avg_online_price NUMERIC,           -- 평균 온라인가

  -- 원재료
  ingredients_raw_text TEXT,          -- 라벨 그대로
  ingredients_parsed JSONB,           -- 구조화: [{name: "돼지고기", pct: 87, origin: "국산"}, ...]
  additives TEXT[],
  allergens TEXT[],

  -- 영양성분
  nutrition_base_unit VARCHAR(10),    -- '100g' / '100ml' / 'serving'
  nutrition_base_amount NUMERIC,
  nutrition JSONB,                    -- {kcal, protein, carb, sugar, fat, ...}

  -- 카테고리별 핵심 지표
  key_metrics JSONB,                  -- 예: {pork_content_pct: 87}

  -- 이미지
  product_images TEXT[],              -- S3 URL 배열
  label_images TEXT[],

  -- 메타
  status VARCHAR(20) DEFAULT 'pending', -- pending / approved / rejected
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 가격 이력 (시계열)
CREATE TABLE product_prices (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  source VARCHAR(50),                 -- 'coupang', 'kurly', 'manual'
  price NUMERIC,
  observed_at TIMESTAMP
);

-- 변경 이력
CREATE TABLE product_revisions (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  changed_by UUID REFERENCES users(id),
  changes JSONB,                      -- {field: [before, after], ...}
  reason VARCHAR(200),
  created_at TIMESTAMP
);

-- 사용자
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(50),
  role VARCHAR(20),                   -- 'admin' / 'editor'
  created_at TIMESTAMP
);
```

---

## 6. 화면 구성

### 6.1 화면 목록

1. 로그인
2. 대시보드 (입력 통계, 검수 대기 건수)
3. 제품 목록 (검색/필터)
4. 제품 신규 등록 (다단계 폼)
5. 제품 상세/수정
6. 검수 대기열 (옵션)
7. 카테고리 관리
8. 제조사 관리
9. 사용자/권한 관리
10. 변경 이력

### 6.2 신규 등록 화면 (핵심)

좌우 2단 레이아웃 권장:

```
┌─────────────────────────────────────────────────┐
│ 좌측 (50%)             │ 우측 (50%)              │
│                        │                         │
│ [라벨 이미지 업로드]   │ [폼 영역]               │
│ - 드래그앤드롭         │ - 카테고리 선택         │
│ - OCR 처리 중...       │ - 제품명, 제조사, 용량   │
│                        │ - 영양성분 (자동 추출)  │
│ [추출된 텍스트 미리보기]│ - 핵심 지표 (동적)      │
│                        │ - 원재료 textarea       │
│                        │ - 가격                  │
│                        │                         │
│                        │ [저장] [임시저장]        │
└─────────────────────────────────────────────────┘
```

핵심 UX 원칙:
- 라벨 사진 한 번 올리면 자동으로 영양성분/원재료가 채워짐
- 사용자는 검수만 → 입력 시간 50% 단축이 목표
- 키보드 단축키: Ctrl+S 저장, Ctrl+N 다음 제품, Tab으로 필드 이동
- 자동 저장 (5초마다 임시저장)

### 6.3 검수 화면 (옵션)

```
┌─────────────────────────────────────────────────┐
│ 좌측: 라벨 사진 (확대 가능)                       │
│ 우측: 입력된 값 (편집 가능)                       │
│                                                  │
│ [승인] [반려 + 사유]   [다음 →]                  │
└─────────────────────────────────────────────────┘
```

---

## 7. 우선순위 (구현 순서)

### Phase 1 (출시 필수, 2-3주)
- 인증
- 카테고리 1개 (햄/소시지) 하드코딩으로 시작 — 동적 필드 나중에
- 제품 CRUD
- 제품 목록/검색
- 이미지 업로드

### Phase 2 (1차 출시 후)
- OCR 통합
- 카테고리 동적 필드 (JSON Schema 기반)
- 검수 대기열
- 변경 이력

### Phase 3
- 크롤러 연동 (가격 자동 갱신)
- 통계 대시보드
- 일괄 작업 도구

---

## 8. 비기능 요구사항

- **응답 속도**: 검색/필터 1초 이내
- **이미지 업로드**: 5MB까지 허용, 자동 리사이즈 (원본 + 썸네일 저장)
- **백업**: DB 일 1회 자동 백업
- **로그**: 모든 쓰기 작업 로그 (7일 보관)

---

## 9. 클로드 코드에게 전달할 핵심 지시사항

1. **DB 스키마 먼저** 위 SQL 그대로 마이그레이션 작성
2. **카테고리 1개(햄/소시지)부터** 동작하는 MVP 빠르게 만들기
3. **JSON Schema 기반 동적 필드는 Phase 2**로 미루고, 일단 햄 카테고리 필드는 하드코딩
4. **OCR도 Phase 2** — Phase 1은 수동 입력만으로 동작 보장
5. UI는 **shadcn/ui** 기본 컴포넌트로 최대한 빠르게, 디자인 욕심 X
6. **타입스크립트로 엄격하게** — 데이터 무결성이 핵심이라 런타임 에러 최소화
