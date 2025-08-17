# 이지픽 (EasyPick) AI Tools Website

## 프로젝트 개요
이지픽은 AI 도구를 쉽게 찾고 비교할 수 있는 플랫폼입니다.

## 기술 스택
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + Radix UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment**: PayPal + Toss Payments
- **Analytics**: Google Analytics 4

## 주요 기능
1. AI 도구 검색 및 필터링
2. 카테고리별 도구 탐색
3. 사용자 북마크 기능
4. 구독 플랜 (Free/Basic/Pro)
5. 결제 시스템 통합

## 폴더 구조
```
src/
├── components/     # React 컴포넌트
├── lib/           # 유틸리티 및 설정
├── pages/         # 페이지 컴포넌트
├── hooks/         # 커스텀 훅
├── styles/        # 스타일 파일
└── assets/        # 이미지 및 정적 파일
```

## 환경 변수
- `.env.local`: Supabase, 소셜 로그인, 결제 관련 키
- `.env`: 공개 가능한 환경 변수

## 데이터베이스 스키마
- `user_profiles`: 사용자 프로필
- `ai_tools`: AI 도구 정보
- `bookmarks`: 북마크
- `subscriptions`: 구독 정보
- `payments`: 결제 내역

## 디자인 가이드라인
- **Primary Color**: Sage Green (#7D8E82)
- **Secondary Color**: Dark (#26312C)
- **Background**: White/Light Gray
- **Font**: Pretendard (한글), Poppins (영문)

## 개발 명령어
```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
```

## 중요 파일
- `/src/lib/supabase.js`: Supabase 클라이언트 설정
- `/src/components/AIToolsGrid.jsx`: AI 도구 그리드
- `/src/pages/MainLanding.jsx`: 메인 랜딩 페이지
- `/database-schema.sql`: DB 스키마 정의

## 현재 작업 중
- UI/UX 개선 (Shenkin 스타일 적용)
- Hero 섹션 리디자인
- 프로페셔널한 디자인 시스템 구축
