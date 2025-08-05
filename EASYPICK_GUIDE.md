# 이지픽 프로젝트 적용 가이드

## 🎯 오늘 작업 내용 요약
- 사이트 이름: 툴즈비 → 이지픽 변경
- 새로운 랜딩 페이지 디자인 (NHN Commerce 스타일)
- 목업폰 슬라이드 애니메이션 추가
- 프롬프트 생성기 UI/UX 대폭 개선
- 이지픽 로고 및 브랜딩 통일

## 📁 수정된 파일들

### 1. `src/app.jsx`
**변경사항:**
- 브랜딩: 툴즈비 → 이지픽
- 로고: 새로운 화살표 아이콘 적용
- 홈 화면과 앱 화면 분리
- 모바일 네비게이션 개선

### 2. `src/components/MainLanding.jsx`
**변경사항:**
- 완전히 새로운 랜딩 페이지 디자인
- NHN Commerce 스타일 컬러 시스템
- 목업폰 슬라이드 (3가지 시나리오)
- 인기 AI 도구 Top 10 섹션
- 핵심 가치 제안 3가지
- CTA 섹션 강화

### 3. `src/features/prompt-launcher/PromptLauncher.jsx`
**변경사항:**
- 3단계 프로세스 시각화
- 간단/고급 모드 토글 개선
- 사용법 가이드 및 성공 사례 추가
- 전체적인 UI/UX 개선

## 🎨 디자인 시스템

### 컬러 팔레트
```css
--primary-blue: #0066FF        /* 메인 브랜드 컬러 */
--primary-navy: #1a2c42        /* 깊이감 있는 네이비 */
--secondary-orange: #FF6B35     /* 포인트 컬러 (CTA 버튼) */
--secondary-green: #00C896      /* 성공/완료 상태 */
--secondary-purple: #8B5FBF     /* 프리미엄 기능 */
```

### 로고
- 검은색 배경 + 흰색 화살표 아이콘
- 32x32 viewBox SVG
- "쉬운 선택"을 상징하는 좌측 화살표

## 🚀 적용 방법

### 단계 1: 백업 생성
```bash
git checkout -b backup-before-easypick
git add .
git commit -m "Backup before applying EasyPick changes"
```

### 단계 2: 새 브랜치 생성
```bash
git checkout -b feature/easypick-rebrand
```

### 단계 3: 파일 업데이트
- 위 3개 파일의 내용을 새로운 버전으로 교체
- package.json의 name을 "easypick"으로 변경 (선택사항)

### 단계 4: 테스트 및 커밋
```bash
npm run dev  # 로컬 테스트
git add .
git commit -m "🎉 EasyPick rebrand and new landing page"
```

### 단계 5: 메인 브랜치에 머지
```bash
git checkout main
git merge feature/easypick-rebrand
```

## ⚡ 즉시 테스트 가능한 명령어
```bash
# 개발 서버 실행
npm run dev

# 빌드 테스트
npm run build
npm run preview
```

## 📋 체크리스트
- [ ] 로고가 모든 위치에서 올바르게 표시되는가?
- [ ] 목업폰 슬라이드가 정상 작동하는가?
- [ ] 모바일 반응형이 정상 작동하는가?
- [ ] 모든 링크와 버튼이 작동하는가?
- [ ] 브랜딩이 일관되게 적용되었는가?

## 🎯 다음 단계
1. 도메인 구매: easypick.co.kr
2. 실제 이미지 에셋 준비
3. SEO 메타태그 설정
4. 성능 최적화
5. 배포 환경 설정
