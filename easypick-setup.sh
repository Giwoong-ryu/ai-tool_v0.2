#!/bin/bash
# easypick-setup.sh

echo "🚀 이지픽 프로젝트 설정 시작..."

# 1. 새 프로젝트 폴더 생성
echo "📁 프로젝트 폴더 생성..."
mkdir -p ~/Projects/easypick
cd ~/Projects/easypick

# 2. Git 초기화
echo "🔧 Git 초기화..."
git init
git remote add origin https://github.com/your-username/easypick.git  # 실제 리포지토리로 변경

# 3. 기본 구조 생성
echo "📋 기본 구조 생성..."
echo "# EasyPick - AI 도구 추천 플랫폼

## 🎯 프로젝트 소개
쉬운 선택, 정확한 결과 - 한 번의 클릭으로 최적의 AI 도구와 프롬프트를 제공합니다.

## 🛠️ 기술 스택
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Icons**: Lucide React

## 🚀 시작하기
\`\`\`bash
npm install
npm run dev
\`\`\`

## 📁 프로젝트 구조
\`\`\`
src/
├── components/          # 재사용 컴포넌트
│   ├── ui/             # shadcn/ui 컴포넌트
│   ├── MainLanding.jsx # 메인 랜딩 페이지
│   └── ...
├── features/           # 기능별 컴포넌트
│   ├── prompt-launcher/
│   └── workflows/
├── data/              # 정적 데이터
└── store/             # 상태 관리
\`\`\`

## 🎨 디자인 시스템
- Primary: #0066FF
- Secondary: #FF6B35
- Success: #00C896
- Purple: #8B5FBF
" > README.md

echo "✅ 프로젝트 설정 완료!"
echo "📍 위치: $(pwd)"
echo "🔗 다음 단계: 기존 파일들을 이 폴더로 복사하세요"
