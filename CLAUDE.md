# FreeFree - 프리랜서 심리상담사 통합 대시보드

## Context

프리랜서 심리상담사가 여러 상담센터에 출근하며 일하는 경우, 각 센터의 일정과 내담자를 하나의 대시보드에서 통합 관리할 수 있는 웹 서비스.

- **기술 스택**: Next.js (App Router) + Supabase + Tailwind CSS + shadcn/ui
- **인증**: 이메일/비밀번호 (Supabase Auth)
- **핵심 기능**: 통합 캘린더 스케줄 관리, 내담자 관리

---

## Database Schema (Supabase/PostgreSQL)

| 테이블 | 설명 |
|--------|------|
| `profiles` | 상담사 프로필 (auth.users 확장) |
| `centers` | 상담센터 정보 |
| `user_centers` | 상담사-센터 관계 (색상, 활성 여부) |
| `schedules` | 센터별 근무 일정 |
| `clients` | 내담자 정보 (센터 소속) |
| `sessions` | 상담 회기 기록 |

모든 테이블에 RLS 적용 (`user_id = auth.uid()` 기반 접근 제어)

---

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/login, register        # 인증 페이지
│   └── (dashboard)/                   # 인증된 사용자 영역
│       ├── dashboard/                 # 통합 캘린더 (홈)
│       ├── centers/                   # 센터 관리
│       ├── clients/                   # 내담자 관리
│       ├── sessions/new/              # 상담 기록 작성
│       └── settings/                  # 프로필 설정
├── components/
│   ├── ui/                            # shadcn/ui 컴포넌트
│   ├── layout/                        # sidebar, header
│   ├── calendar/                      # 캘린더 뷰, 이벤트, 스케줄 폼
│   ├── centers/                       # 센터 목록, 카드, 폼
│   ├── clients/                       # 내담자 목록, 상세, 폼
│   └── sessions/                      # 상담 기록 목록, 폼
├── lib/
│   ├── supabase/client.ts, server.ts  # Supabase 클라이언트
│   ├── hooks/                         # use-centers, use-schedules 등
│   └── types/database.ts             # Supabase 타입
└── middleware.ts                      # 인증 가드
```

---

## 구현 순서

### Phase 1: 프로젝트 초기 설정
- Next.js + TypeScript + Tailwind 프로젝트 생성
- Supabase 연동 (`@supabase/supabase-js`, `@supabase/ssr`)
- 데이터베이스 마이그레이션 (테이블, RLS, 인덱스, 트리거)
- 인증 미들웨어 설정

### Phase 2: 인증 (로그인/회원가입)
- 로그인/회원가입 페이지 및 폼 컴포넌트
- 루트 페이지 리다이렉트 로직

### Phase 3: 대시보드 레이아웃
- shadcn/ui 컴포넌트 설치
- 사이드바, 헤더 레이아웃 구성
- 반응형 모바일 네비게이션

### Phase 4: 센터 관리
- 센터 CRUD (생성, 조회, 수정, 삭제)
- 센터 목록 (카드 그리드) / 상세 페이지

### Phase 5: 캘린더/스케줄 관리 (핵심)
- CSS Grid 기반 주간/월간 캘린더 구현
- 센터별 색상 구분
- 스케줄 추가/수정/삭제
- 센터 필터 토글

### Phase 6: 내담자 관리
- 내담자 CRUD
- 센터별 필터, 이름 검색
- 내담자 상세 (상담 이력 포함)

### Phase 7: 상담 기록
- 상담 회기 기록 작성/조회
- 회기 번호 자동 증가
- 내담자 상세에서 회기 목록 표시

### Phase 8: 마무리
- 프로필 설정 페이지
- 로딩/에러/빈 상태 UI
- 토스트 알림

---

## 주요 의존성

- `next`, `react`, `react-dom`
- `@supabase/supabase-js`, `@supabase/ssr`
- `date-fns` (날짜 처리)
- `lucide-react` (아이콘)
- `clsx`, `tailwind-merge` (스타일 유틸)
- shadcn/ui (프로젝트에 복사)

---

## 검증 방법

1. `npm run dev`로 로컬 실행
2. 회원가입 → 로그인 → 대시보드 접근 확인
3. 센터 생성 → 스케줄 추가 → 캘린더에서 색상 구분 확인
4. 내담자 생성 → 상담 기록 작성 → 내담자 상세에서 이력 확인
5. 다른 사용자 데이터 접근 불가 확인 (RLS)
