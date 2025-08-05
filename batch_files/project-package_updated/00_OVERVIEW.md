# Prompt Launcher 프로젝트 개요 (High‑Level Overview)

**목표**  
- “프롬프트 설계 피로”를 제거해 누구나 30초 만에 AI 대화를 시작하게 한다.  
- 기본값만으로도 품질 높은 프롬프트를 즉시 제공하며, 선택을 추가할수록 사용자의 개성이 강화된다.  
- ChatGPT·Claude·Gemini 등 다양한 모델로 1‑클릭 전송, 프롬프트 자동 복사, 북마크 저장 기능을 포함한다.

**주요 기능**  
1. 실시간 프롬프트 미리보기 & 변경 하이라이트  
2. 심플 / 고급 모드 전환 – 선택 0~2개로 빠른 전송 or 세부 조정  
3. 페르소나·톤·질문 추천, 기본 ↔ 사용자 선택 비교 미리보기  
4. 모델 추천 + 새 탭 열기 & 자동 클립보드 복사  
5. 북마크(txt/Markdown) 내보내기, 최소 메타 only

**기술 스택**  
- **프론트** : React + Vite + Tailwind (shadcn/ui)  
- **상태 관리** : Zustand, React Query  
- **데이터** : 템플릿 JSON → 차후 Firebase/Supabase  
- **배포** : GitHub Pages (정적)  
- **개발 환경** : Windows + VSCode 기준 문서화

**현재 상황**  
- AI 툴 소개 사이트(카드 UI)는 완성.  
- `PromptLauncher.jsx` MVP+ (v0.2) 구현 완료.  
- 추가해야 할 작업은 템플릿 DB 분리, 온보딩 Flow, 모델 추천 고도화.

**파일 맵**  
`` `
00_OVERVIEW.md      # 이 파일
01_SPEC/            # 전체 사양서·UI/UX·스키마
02_CODE/            # 기존 Vite + React 코드
03_ASSETS/          # 디자인 레퍼런스(예: Figma export)
TODO_MASTER.md      # 진행 단계별 체크리스트
claude_prompt.txt   # Claude 대화용 기본 프롬프트
`` `