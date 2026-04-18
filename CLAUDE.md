# FreeFree - 프리랜서 심리상담사 통합 대시보드

## Context

프리랜서 심리상담사가 여러 상담센터에 출근하며 일하는 경우, 각 센터의 일정과 내담자를 하나의 대시보드에서 통합 관리할 수 있는 웹 서비스.

- **기술 스택**: Next.js 16 (App Router) + Supabase + Tailwind CSS 4 + shadcn/ui
- **인증**: 이메일/비밀번호 (Supabase Auth)
- **핵심 기능**: 통합 캘린더 스케줄 관리, 내담자 관리, 심리검사 관리
- **배포**: Vercel (https://freefree-sooty.vercel.app)

---

## Database Schema (Supabase/PostgreSQL)

| 테이블 | 설명 |
|--------|------|
| `profiles` | 상담사 프로필 (auth.users 확장, 트리거로 자동 생성) |
| `centers` | 상담센터 정보 |
| `user_centers` | 상담사-센터 관계 (색상, 활성 여부) |
| `schedules` | 센터별 근무 일정 (DB 존재, UI 미연동) |
| `clients` | 내담자 정보 (센터 소속) |
| `sessions` | 상담 회기 기록 |
| `client_tests` | 심리검사 기록 (검사명, 날짜, 메모) |

모든 테이블에 RLS 적용 (`user_id = auth.uid()` 기반 접근 제어)
트리거: `handle_updated_at()` (자동 타임스탬프), `handle_new_user()` (회원가입 시 프로필 생성)

---

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx, actions.ts       # 로그인
│   │   ├── register/page.tsx, actions.ts    # 회원가입
│   │   └── logout/actions.ts                # 로그아웃
│   └── (dashboard)/
│       ├── layout.tsx                        # 사이드바 + 헤더 레이아웃
│       ├── dashboard/page.tsx, actions.ts    # 통합 캘린더 (홈)
│       ├── centers/page.tsx, page-client.tsx, actions.ts  # 센터 관리
│       ├── clients/
│       │   ├── page.tsx, page-client.tsx, actions.ts      # 내담자 목록
│       │   └── [id]/page.tsx, page-client.tsx             # 내담자 상세
│       └── settings/page.tsx, page-client.tsx, actions.ts # 프로필 설정
├── components/
│   ├── ui/                            # shadcn/ui (button, card, dialog, input, select 등 11개)
│   ├── layout/
│   │   ├── sidebar.tsx                # 사이드바 네비게이션 + 로그아웃
│   │   └── header.tsx                 # 상단 헤더
│   ├── calendar/
│   │   ├── weekly-calendar.tsx        # 주간 캘린더 (CSS Grid, 미니 캘린더, 센터 필터)
│   │   └── schedule-form.tsx          # 캘린더 세션 추가/수정 폼
│   └── centers/
│       ├── center-form.tsx            # 센터 생성/수정 폼 (24색 팔레트 + 커스텀 컬러 피커)
│       └── center-card.tsx            # 센터 카드 (수정/삭제)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # 브라우저 Supabase 클라이언트
│   │   ├── server.ts                  # 서버 Supabase 클라이언트
│   │   └── middleware.ts              # 인증 세션 미들웨어
│   ├── types/database.ts             # Supabase 타입
│   └── utils.ts                       # cn() 유틸리티
└── middleware.ts                      # Next.js 인증 가드
```

---

## 구현 완료 기능

### 인증
- 이메일/비밀번호 로그인, 회원가입
- 미들웨어 기반 세션 관리 및 인증 가드
- 루트(`/`) → `/dashboard` 리다이렉트

### 대시보드 레이아웃
- 사이드바 (캘린더, 센터, 내담자, 설정 메뉴 + 로그아웃)
- 반응형: 모바일에서 사이드바 숨김, 헤더에 메뉴
- Glass-morphism UI (`bg-white/70 backdrop-blur-sm`)
- 커스텀 그라디언트 (`bg-gradient-mint-pink-vivid`)

### 센터 관리
- 센터 CRUD (생성, 조회, 수정, 삭제)
- 카드 그리드 레이아웃 (반응형 1~3열)
- 센터 색상: 24개 프리셋 (6×4 그리드) + 커스텀 컬러 피커 (자유 색상 선택)
- 색상은 hex 코드로 `user_centers.color`에 저장, 앱 전체에서 hex + "20" (20% opacity) 패턴 사용

### 캘린더 (핵심 기능)
- CSS Grid 기반 주간 캘린더 (9시~19시, 월~일)
- 세션 블록: 센터 색상으로 구분, 시간 기반 위치/높이 계산
- 미니 캘린더: 월 탐색, 세션 날짜 도트 표시, 클릭 시 해당 주 이동
- 센터 필터 토글: 센터별 on/off, 센터별 총 시간 표시 (Xh00 포맷)
- 세션 생성/수정: 다이얼로그 폼 (센터, 내담자, 날짜, 시간, 유형, 회기번호)
- 회기번호 자동 계산 (내담자별 다음 번호)
- 모바일 대응: 센터 필터 pill 버튼

### 내담자 관리
- 내담자 CRUD
- 실시간 이름 검색 + 센터별 필터 드롭다운
- 내담자 카드: 아바타 (이니셜), 이름, 소속 센터, 전화번호
- 내담자 상세 페이지:
  - 상담 회기 목록 (생성/수정/삭제, 인라인 편집)
  - 심리검사 기록 (추가/삭제, pill 형태 표시)
  - 각 섹션 카운트 배지

### 상담 기록
- 회기 기록 작성/조회/수정/삭제
- 회기번호 자동 증가 (수동 오버라이드 가능)
- 상담 유형: 개인상담, 해석상담, 집단상담, 기타
- 시작/종료 시간 → 소요시간(분) 자동 계산

### 심리검사 관리
- `client_tests` 테이블 (검사명, 날짜, 메모)
- 내담자 상세에서 검사 기록 추가/삭제
- 검사 예시: MMPI-2, SCT, HTP 등

### 프로필 설정
- 이름, 전화번호 수정

---

## 데이터 흐름 패턴

- **서버 페이지**: Supabase RLS로 데이터 fetch → 클라이언트 컴포넌트에 전달
- **클라이언트 컴포넌트**: UI 로직, 상태 관리
- **Server Actions**: 모든 데이터 변경은 서버 액션으로 처리, `revalidatePath`로 갱신
- **클라이언트 사이드 Supabase 쿼리 없음** (SSR 패턴)

---

## 주요 의존성

- `next` 16.2.4, `react` 19.2.4
- `@supabase/supabase-js`, `@supabase/ssr`
- `date-fns` (날짜 처리, 한국어 로케일)
- `lucide-react` (아이콘)
- `clsx`, `tailwind-merge`, `class-variance-authority` (스타일 유틸)
- `tailwindcss` 4, `@tailwindcss/postcss`
- shadcn/ui (프로젝트에 복사)

---

## 검증 방법

1. `npm run dev`로 로컬 실행
2. 회원가입 → 로그인 → 대시보드 접근 확인
3. 센터 생성 → 색상 선택 (프리셋 + 커스텀) → 캘린더에서 색상 구분 확인
4. 내담자 생성 → 상담 기록 작성 → 내담자 상세에서 이력 확인
5. 내담자 상세 → 심리검사 추가 → pill 표시 확인
6. 다른 사용자 데이터 접근 불가 확인 (RLS)

---

## 배포

- **플랫폼**: Vercel
- **프로덕션 URL**: https://freefree-sooty.vercel.app
- **자동 배포**: GitHub `main` 브랜치 푸시 시 (간헐적 미트리거 → `npx vercel --prod`로 수동 배포)
- **환경변수**: Supabase URL/Key는 Vercel 환경변수로 관리
