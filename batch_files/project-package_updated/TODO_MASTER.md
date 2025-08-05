# TODO Master Checklist (AI Tools Directory + Prompt Launcher 통합)

## A. AI Tools Directory 개선
- [ ] **AI 도구 데이터셋 확장** (현재 60 → 120개, 새 카테고리 3개 추가)
- [ ] **Brandfetch + Iconify** 혼합 로고 로더 구현
- [ ] **카테고리·가격·국내유통 필터** + 키워드 검색 (debounced)
- [ ] **툴 상세 모달**: 기능 요약, 사용 예, 연계 도구, 가격, 후기 링크
- [ ] LocalStorage 기반 **즐겨찾기(⭐) 저장** 기능
- [ ] 다크/라이트 테마 토글 + Tailwind 색상 토큰 적용
- [ ] Lighthouse 퍼포먼스 90점 이상 (코드 스플리팅 & lazy-load)

## B. Prompt Launcher 통합
- [ ] `PromptLauncher` 컴포넌트 → AI Tools 페이지 상단 배치 토글
- [ ] 템플릿 JSON 20개 구조화 (취업 10, 매장 10)
- [ ] React Query + Zustand 통합 (템플릿 fetch & 캐싱)
- [ ] 온보딩 3단 슬라이드 (PWA 대응, 창 닫아도 상태 유지)
- [ ] usage-based **모델 추천 로직 강화** (도메인 + 길이 분석)
- [ ] txt/md 북마크 내보내기 기능

## C. 배포 & DevOps
- [ ] Cloudflare Pages CI 설정 (main → 자동 빌드·배포)
- [ ] GitHub Actions → Jest + ESLint + CodeRabbit Status Check
- [ ] README 업데이트 (설치, 로컬 dev, 배포 방법)