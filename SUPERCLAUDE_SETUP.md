# SuperClaude 설치 및 설정 가이드

## ✅ SuperClaude 설치 상태

### 1. **VS Code 확장 프로그램 설치**

SuperClaude (Claude Dev) 확장 프로그램을 VS Code에 설치하세요:

1. VS Code를 열기
2. 확장 프로그램 탭 열기 (Ctrl+Shift+X)
3. "Claude Dev" 또는 "SuperClaude" 검색
4. **Saoud Rizwan**이 만든 "Claude Dev" 설치
5. VS Code 재시작

### 2. **API 키 설정**

1. VS Code 설정 열기 (Ctrl+,)
2. "Claude" 검색
3. API 키 입력 (Anthropic API 키 필요)

### 3. **프로젝트별 설정 완료** ✅

이미 설정된 파일들:

#### `.claude/settings.local.json` ✅
- 권한 설정 완료
- 프로젝트 컨텍스트 정의
- 코드 스타일 가이드 설정

#### `.claude/project-context.md` ✅
- 프로젝트 개요 문서화
- 기술 스택 정의
- 주요 기능 설명

#### `.vscode/extensions.json` ✅
- SuperClaude 권장 확장으로 추가됨

## 🚀 SuperClaude 사용법

### 기본 명령어
- **Ctrl+Shift+P** → "Claude: New Chat" - 새 대화 시작
- **Ctrl+L** - 빠른 질문
- **선택 영역 + 우클릭** → "Ask Claude" - 선택한 코드 질문

### 주요 기능
1. **코드 생성**: 자연어로 코드 요청
2. **코드 리팩토링**: 선택한 코드 개선
3. **버그 수정**: 에러 메시지와 함께 질문
4. **문서화**: 코드 주석 및 문서 생성
5. **테스트 작성**: 유닛 테스트 자동 생성

### 이지픽 프로젝트 전용 프롬프트

```
# React 컴포넌트 생성
"Tailwind CSS와 Radix UI를 사용해서 [컴포넌트명] 컴포넌트를 만들어줘"

# Supabase 쿼리
"Supabase를 사용해서 [테이블명]에서 [조건]인 데이터를 가져오는 함수 만들어줘"

# UI 개선
"이 컴포넌트를 Shenkin 스타일로 개선해줘 (다크 배경, 세이지그린 액센트)"

# 성능 최적화
"이 컴포넌트의 렌더링 성능을 최적화해줘"
```

## 🔧 트러블슈팅

### API 키 문제
- Anthropic 콘솔에서 API 키 생성: https://console.anthropic.com/
- 환경 변수에 추가: `ANTHROPIC_API_KEY=your-key`

### 권한 오류
- `.claude/settings.local.json`의 permissions 확인
- 필요한 권한 추가

### 응답 속도 개선
- 프로젝트 컨텍스트 파일 최적화
- 불필요한 파일 제외 설정

## 📚 추가 리소스

- [SuperClaude 공식 문서](https://github.com/saoudrizwan/claude-dev)
- [Anthropic API 문서](https://docs.anthropic.com/)
- [VS Code 확장 마켓플레이스](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev)

## 💡 팁

1. **컨텍스트 유지**: 대화 히스토리를 활용하여 연속적인 작업
2. **코드 스니펫**: 자주 사용하는 패턴을 템플릿으로 저장
3. **페어 프로그래밍**: SuperClaude와 실시간 코드 리뷰
4. **학습 도구**: 새로운 기술 학습 시 설명 요청

---

**🎉 SuperClaude 설정 완료!**

이제 AI 페어 프로그래머와 함께 이지픽 프로젝트를 더욱 효율적으로 개발할 수 있습니다.
