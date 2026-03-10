# 분양라인 - 부동산 분양 구인 플랫폼

## 프로젝트 개요
- **서비스명**: 분양라인 (BunYangLine)
- **목적**: 전국 부동산 분양 현장 정보 제공 및 분양 구인/구직 플랫폼
- **기술 스택**: Hono + TypeScript + Cloudflare Pages + D1 SQLite

## 🌐 접속 URL
- **로컬 개발**: http://localhost:3000
- **플랫폼**: Cloudflare Pages

## 👤 테스트 계정
| 구분 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@bunyang.com | admin1234! |
| 일반회원 | user@test.com | test1234! |

## 📋 구현된 기능

### 메인 페이지 (`/`)
- 베스트 현장 (조회수+문의수 랭킹 기반)
- 신규 현장 목록
- HOT 구인 게시판 미리보기
- 최신 뉴스/공지 목록
- 실시간 방문자 카운터
- 배너 광고 영역
- 지역별 빠른 검색

### 분양 현장 (`/properties`)
- 카드형 목록 UI (지역/유형/상태 필터)
- 검색 기능 (현장명, 지역, 부제목)
- 정렬 옵션 (최신순/인기순/조회수/가격순)
- 프리미엄/슈페리어 광고 강조 표시
- HOT/NEW/추천 뱃지 표시

### 분양 현장 상세 (`/properties/:id`)
- 기본 정보 (가격, 위치, 면적, 세대수, 층수)
- 분양 일정 (시작~마감, 입주예정)
- 현장 소개 및 편의시설
- 담당자 연락처 및 문의 폼
- 관련 현장 추천
- 공유/인쇄 기능

### 구인 게시판 (`/jobs`)
- 지역/직급/수수료/일비/숙소비 필터링
- 급구/HOT/대박 뱃지 시스템
- 프리미엄 광고 상단 고정 노출
- 게시글 상세 (수수료 조건, 근무 조건)
- 지원 문의 폼 (카카오 ID 연동)

### 구인 공고 등록 (`/jobs/new`)
- 현장명, 지역, 직급, 수수료 조건
- 일비/숙소비 지원 여부
- 경력 요건 및 상세 설명
- 담당자 연락처 (전화/카카오)

### 회원 시스템
- **가입** (`/register`): 일반/기업 회원 구분
- **로그인** (`/login`): JWT 인증 (7일 유효)
- **마이페이지** (`/mypage`): 내 정보 수정, 문의 내역, 맞춤 알림 설정

### 뉴스/공지 (`/news`)
- 뉴스/공지사항/이벤트 탭 분류
- 상단 고정 기능
- 조회수 카운팅
- 이전/다음 글 네비게이션

### 관리자 대시보드 (`/admin`)
- **대시보드**: 현장수/공고수/회원수/문의수 통계
- **현장 관리**: 목록 조회, 광고 설정 (프리미엄/슈페리어/베이직)
- **구인 관리**: 목록 조회, HOT/급구/대박 뱃지 설정
- **문의 관리**: 읽음/미읽음, 답변 등록
- **회원 관리**: 회원 목록, 활성/정지 처리
- **뉴스 관리**: 글 작성/삭제

## 🗄️ 데이터 아키텍처

### 스토리지
- **Cloudflare D1**: SQLite 기반 관계형 데이터베이스

### 데이터 모델
| 테이블 | 설명 |
|--------|------|
| `users` | 회원 정보 (일반/기업/관리자) |
| `properties` | 분양 현장 정보 |
| `job_posts` | 구인 게시글 |
| `inquiries` | 고객 문의 |
| `news` | 뉴스/공지사항 |
| `banners` | 배너 광고 |
| `visitor_stats` | 방문자 통계 |
| `notifications` | 사용자 알림 |
| `bookmarks` | 즐겨찾기 |

## 🔌 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 내 정보
- `PUT /api/auth/me` - 내 정보 수정
- `PUT /api/auth/password` - 비밀번호 변경

### 분양 현장
- `GET /api/properties` - 목록 (필터: region, type, status, search, sort)
- `GET /api/properties/best` - 베스트 현장
- `GET /api/properties/:id` - 상세
- `POST /api/properties` - 등록 (로그인 필요)
- `PUT /api/properties/:id` - 수정
- `DELETE /api/properties/:id` - 삭제
- `POST /api/properties/:id/bookmark` - 즐겨찾기 토글

### 구인 게시판
- `GET /api/jobs` - 목록 (필터: region, rank, commission, daily_pay)
- `GET /api/jobs/:id` - 상세
- `POST /api/jobs` - 등록 (로그인 필요)
- `PUT /api/jobs/:id` - 수정
- `DELETE /api/jobs/:id` - 삭제

### 기타
- `GET /api/home` - 홈페이지 데이터 일괄 조회
- `GET /api/visitors` - 방문자 통계
- `GET /api/banners` - 배너 목록
- `POST /api/inquiries` - 문의 등록
- `GET /api/news` - 뉴스/공지 목록

### 관리자 (admin 권한 필요)
- `GET /api/admin/dashboard` - 대시보드 통계
- `GET /api/admin/users` - 회원 목록
- `PUT /api/admin/properties/:id/ad` - 광고 설정
- `PUT /api/admin/jobs/:id/ad` - 구인 광고 설정

## 🎨 디자인 시스템
- **컬러**: 블루 계열 (`#1e3a8a` ~ `#2563eb`)
- **UI**: 카드형 리스트, 모달, 탭 네비게이션
- **반응형**: 모바일 우선 설계
- **뱃지**: HOT🔥 / NEW🆕 / 급구🚨 / 대박💰 / 프리미엄★

## 🚀 개발 실행
```bash
# 로컬 D1 마이그레이션
npx wrangler d1 migrations apply webapp-production --local

# 개발 서버 시작 (PM2)
pm2 start ecosystem.config.cjs

# 또는 직접 실행
npx wrangler pages dev dist --d1=webapp-production --local --port 3000
```

## 📦 빌드 및 배포
```bash
# 빌드
npm run build

# Cloudflare Pages 배포
npx wrangler pages deploy dist --project-name [project-name]
```

## 📅 개발 현황
- **플랫폼**: Cloudflare Pages (Edge Runtime)
- **상태**: ✅ 개발 완료 / 로컬 구동 중
- **마지막 업데이트**: 2025-03-10
