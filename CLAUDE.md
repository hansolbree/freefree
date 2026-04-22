# FreeFree - 프리랜서 심리상담사 통합 대시보드

## Context

프리랜서 심리상담사가 여러 상담센터에 출근하며 일하는 경우, 각 센터의 일정과 내담자를 하나의 대시보드에서 통합 관리할 수 있는 웹 서비스.

- **기술 스택**: Next.js 16 (App Router) + Supabase + Tailwind CSS 4 + shadcn/ui + base-ui
- **인증**: 이메일/비밀번호 (Supabase Auth)
- **핵심 기능**: 통합 캘린더(세션+강의), 내담자 관리, 심리검사 관리, 전역 검색, 어드민
- **배포**: Vercel (https://freefree-sooty.vercel.app)

---

## Database Schema (Supabase/PostgreSQL)

| 테이블 | 설명 |
|--------|------|
| `profiles` | 상담사 프로필 (auth.users 확장, `handle_new_user` 트리거로 자동 생성) |
| `centers` | 상담센터 정보 |
| `user_centers` | 상담사-센터 관계 (색상, 활성 여부) |
| `schedules` | 센터별 근무 일정 (DB 존재, UI 미연동) |
| `clients` | 내담자 정보 (센터 소속) |
| `sessions` | 상담 회기 기록 (내담자별) |
| `client_tests` | 심리검사 기록 (검사명, 날짜, 메모) |
| `lectures` | 집단상담/외부강의 스케줄 (series_id로 반복 회차 묶음) |

모든 테이블 RLS 적용 (`user_id = auth.uid()`). `lectures.center_id`는 nullable(외부 강의용).
트리거: `handle_updated_at()` (타임스탬프), `handle_new_user()` (회원가입 시 프로필 생성).

마이그레이션 (수동 SQL 실행, Supabase CLI 연동 없음):
- `001_initial_schema.sql`
- `002_add_client_occupation.sql`
- `003_add_lectures.sql`

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                              # 랜딩 (정적 + AutoRedirect 클라이언트 점프)
│   ├── (auth)/
│   │   ├── login/page.tsx, actions.ts
│   │   ├── register/page.tsx, actions.ts
│   │   └── logout/actions.ts
│   └── (dashboard)/
│       ├── layout.tsx                        # 사이드바 + 헤더 (isAdmin 주입)
│       ├── dashboard/
│       │   ├── page.tsx                      # 셸만 렌더 (데이터는 클라이언트에서 페치)
│       │   ├── loading.tsx                   # 스켈레톤
│       │   └── actions.ts                    # getCalendarData, searchEvents, 세션/강의 CRUD
│       ├── centers/
│       ├── clients/
│       │   ├── page.tsx, page-client.tsx     # 목록 + 인라인 수정 다이얼로그
│       │   └── [id]/
│       ├── settings/
│       └── admin/
│           ├── page.tsx, page-client.tsx     # 가입자 목록 + 활용도 통계 (service_role 필요)
│           └── ...
├── components/
│   ├── ui/                                   # shadcn + base-ui
│   ├── layout/
│   │   ├── sidebar.tsx                       # isAdmin prop으로 어드민 링크 조건부 노출
│   │   └── header.tsx
│   ├── calendar/
│   │   ├── weekly-calendar.tsx               # 주간 캘린더 + 데스크탑 스크롤 + 강의 블록
│   │   ├── schedule-form.tsx                 # 세션 예약 폼
│   │   └── calendar-search.tsx               # 전역 검색 입력 + 드롭다운
│   ├── lectures/
│   │   └── lecture-form.tsx                  # 강의 생성/수정 폼 (반복 포함)
│   ├── centers/
│   └── landing/
│       ├── reveal.tsx
│       └── auto-redirect.tsx                 # 쿠키 감지 후 /dashboard 점프
└── lib/
    ├── supabase/
    │   ├── client.ts                         # 브라우저 클라이언트
    │   ├── server.ts                         # 서버 클라이언트
    │   ├── middleware.ts                     # 인증 가드 (쿠키 패스트패스, 네트워크 호출 없음)
    │   ├── auth.ts                           # getAuthUser (React.cache 래퍼)
    │   └── admin.ts                          # service_role 클라이언트 + isAdminEmail
    ├── types/database.ts
    └── utils.ts
```

---

## 구현 완료 기능

### 인증
- 이메일/비밀번호 로그인/회원가입
- 미들웨어 인증 가드: **쿠키 존재만 체크** (Supabase 네트워크 호출 생략). 랜딩 `/`은 미들웨어도 스킵.
- 실제 세션 검증은 페이지/서버 액션의 `createClient()` 시점에 Supabase SSR 클라이언트가 자동 수행

### 랜딩 (`/`)
- 정적 서버 컴포넌트 (auth 호출 없음)
- `AutoRedirect` 클라이언트 컴포넌트가 `sb-*-auth-token` 쿠키 감지 시 `/dashboard`로 `router.replace`

### 대시보드 레이아웃
- 사이드바: 캘린더/센터/내담자/설정 (+ 어드민 조건부) + 로그아웃
- 모바일: Sheet 기반 메뉴
- Glass-morphism (`bg-white/70 backdrop-blur-sm`) + 민트-핑크 그라디언트

### 센터 관리
- CRUD, 카드 그리드 (반응형 1~3열)
- 24색 프리셋 + 커스텀 컬러 피커. `user_centers.color`에 hex 저장, 앱 전체에서 `color + "20"` (20% opacity) 패턴

### 캘린더 (핵심)
- CSS Grid 주간 뷰 (9~22시), 데스크탑은 스크롤 영역으로 감싸고 초기 위치 13시
- **세션 블록**: 내담자 이름, 회기번호·유형, 센터 색상
- **강의 블록** (📚 아이콘): 제목, 장소/센터, 대상. 강의별 색상
- 미니 캘린더(데스크탑), 센터 필터 토글, 강의 필터 토글
- 센터별 총 근무시간 자동 집계 (세션 + 강의 합산)
- 전역 검색창: 내담자/센터/강의 제목/장소/대상/메모 → 결과 클릭 시 해당 주로 점프
- **데이터 페치는 클라이언트에서** (`getCalendarData` 통합 서버 액션 1회 호출) — 서버는 셸만 반환해서 TTFB 최소화
- `loading.tsx`로 SSR 대기 중 스켈레톤 표시

### 세션 예약
- 센터/내담자/날짜/시간/유형/회기번호/메모
- 회기번호 자동 계산 (내담자별 다음 번호, 수동 오버라이드 가능)
- 상담 유형: 개인상담, 해석상담, 집단상담, 기타
- 소요시간 자동 계산

### 강의 스케줄 (집단상담/외부강의)
- 제목, 센터(선택) 또는 외부 장소, 대상, 날짜/시간, 색상, 페이, 수령여부, 메모
- 반복 설정: 없음/매주/격주, 최대 12회 — 생성 시 개별 레코드로 펼쳐서 저장 (`series_id`로 묶음)
- 반복 강의 삭제 시 시리즈 전체/개별 회차 선택 가능

### 내담자 관리
- CRUD + 이름 검색 + 센터 필터
- 카드에 아바타(이니셜), 이름, 메타(나이·성별·직업), 센터, 전화번호
- **카드 인라인 수정**: ✎ 버튼 → 다이얼로그 (상세 페이지 이동 없이 편집)
- 내담자 상세: 상담 회기 목록 + 심리검사(pill)

### 상담 기록 / 심리검사
- 회기 기록 CRUD, 인라인 편집
- 심리검사: 검사명, 날짜, 메모 (MMPI-2, SCT, HTP 등)

### 프로필 설정
- 이름, 전화번호 수정

### 어드민 (`/admin`)
- **접근 제어**: `ADMIN_EMAIL` env와 현재 로그인 이메일 일치 시만 접근 (일치 안 하면 `/dashboard`로 redirect)
- **데이터 조회**: `SUPABASE_SERVICE_ROLE_KEY` 기반 admin 클라이언트로 RLS 우회
- 표시: 가입자 목록, 이메일/이름/전화, 센터/내담자/세션/강의 수, 가입일, 최근 활동일
- 검색(이메일/이름/전화), 전체 통계 카드
- **민감 데이터 (내담자 이름·상담 내용) 일체 조회 안 함**

---

## 성능 최적화 요약

- **미들웨어 패스트패스**: `sb-*-auth-token` 쿠키 존재만 확인, Supabase 네트워크 호출 없음
- **React.cache 기반 `getAuthUser`**: layout + page의 auth 호출 dedupe
- **랜딩 정적화**: 서버 auth 호출 제거, 클라이언트 AutoRedirect로 대체
- **대시보드 셸 렌더**: 데이터 페치를 서버(SSR) → 클라이언트(액션 1회)로 이동
- **통합 서버 액션 `getCalendarData`**: sessions + lectures + userCenters를 1 round trip에 조회
- **loading.tsx 스켈레톤**: 모바일/데스크탑 반응형
- **GitHub Actions keep-warm cron** (`.github/workflows/keep-warm.yml`): 5분 간격 `/`와 `/login` 핑으로 Vercel 콜드스타트 완화

---

## 데이터 흐름 패턴

- **서버 페이지**: 레이아웃 `getAuthUser` 1회 + 각 페이지별 쿼리 (내담자/센터/설정 등)
- **대시보드만 예외**: 서버는 셸만, 데이터는 클라이언트가 `getCalendarData` 액션으로 조회
- **서버 액션**: 모든 변경은 서버 액션으로 처리, `revalidatePath`로 갱신
- **보안**: RLS(`user_id = auth.uid()`)로 내부 접근 제어. 어드민만 service_role 우회.

---

## 주요 의존성

- `next` 16.2.4, `react` 19.2.4
- `@supabase/supabase-js`, `@supabase/ssr`
- `@base-ui/react` (shadcn 신규 컴포넌트 백엔드)
- `date-fns` (한국어 로케일)
- `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`
- `tailwindcss` 4, `@tailwindcss/postcss`

---

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# 어드민 기능용 (선택)
SUPABASE_SERVICE_ROLE_KEY=          # Supabase Dashboard → Settings → API → service_role (⚠️ 클라 노출 금지)
ADMIN_EMAIL=                         # 어드민으로 취급할 이메일
```

Vercel에서 Production + Preview에 동일하게 등록 (Development는 Vercel 정책상 민감 변수 제한 있음).

---

## 검증 방법

1. `npm run dev`로 로컬 실행 (네트워크 노출: `npx next dev -H 0.0.0.0`, `next.config.ts`의 `allowedDevOrigins`에 로컬 IP 추가)
2. 회원가입 → 로그인 → 대시보드 접근 확인
3. 센터 생성 → 색상 선택 (프리셋 + 커스텀) → 캘린더에서 색상 구분
4. 세션 예약 / 강의 추가(반복 포함) / 내담자 생성 / 내담자 카드 수정 / 심리검사 pill
5. 전역 검색으로 이름·제목·메모 찾기 → 클릭 시 해당 주 점프
6. `/admin` 접근 (ADMIN_EMAIL 일치 시만) → 가입자 통계 확인
7. 다른 사용자 데이터 접근 불가 확인 (RLS)

---

## 배포

- **플랫폼**: Vercel
- **프로덕션 URL**: https://freefree-sooty.vercel.app
- **자동 배포**: GitHub `main` 브랜치 푸시 시 (간헐적 미트리거 → `npx vercel --prod --yes`로 수동 배포)
- **콜드스타트 완화**: GitHub Actions `keep-warm.yml`이 5분 간격 핑
- **마이그레이션**: Supabase Dashboard SQL Editor에서 `supabase/migrations/NNN_*.sql` 내용 수동 실행
