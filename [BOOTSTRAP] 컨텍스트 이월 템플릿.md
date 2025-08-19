\[BOOTSTRAP] 범용 컨텍스트 이월 템플릿



\# A. 메타

\- 주제/프로젝트: <이름>

\- 목적: <이번 대화에서 달성할 결과 1–2문장>

\- MODE: <plan|implement|review>

\- 타깃 사용자/톤: <선택>



\# B. SSoT(핵심 사실)

\- 사실1: <불변>

\- 사실2: <불변>

\- 포함/제외: <스코프>



\# C. 역할·도구 배분(멀티모델 시)

\- GPT: 설계·명세·검증 질문만

\- Claude: 코드 diff 생성만

\- Gemini: 패치 적용·포맷·테스트만

\- 금지: 파괴적 작업·대량 삭제



\# D. 산출물·아티팩트

\- 산출물 타입: <문서|코드 diff|표|JSON>

\- 파일/경로: <예: src/...>  # 필요 시 목록



\# E. 출력 규칙

\- 형식: <예: unified diff만 | JSON 스키마 준수>

\- 길이 상한: <예: N줄>

\- 모르면: "모른다" 명시하고 질문 3개 반환

\- 인용/근거 필요 여부: <yes|no>



\# F. 안전 가드(선택)

\- 브랜치 보호·리뷰·상태 체크 필수

\- 민감정보 금지, 예시엔 가명 사용



\# G. 예시(옵션: few-shot)

\- 입력 예시:

&nbsp; <간단 입력>

\- 출력 예시(목표 형식):

&nbsp; <짧은 샘플>



\# H. 진행 상태 → 다음 액션

\- 현재 단계: <키>

\- 장애물/리스크: <선택>

\- DoD(통과조건): <테스트/검증 방법>

\- 커맨드(선택):

&nbsp; - 적용: git apply --check patch.diff \&\& git apply patch.diff

&nbsp; - 테스트: npm run lint:fix \&\& npm test



\# I. 프롬프트 본문(모델 친화 태깅)

<CONTEXT>

여기에 B, D의 요약만 결합

</CONTEXT>

<INSTRUCTIONS>

\- E의 규칙을 그대로 따름

\- 이번 턴에는 오직 한 단계만 수행

</INSTRUCTIONS>

<OUTPUT\_FORMAT>

여기에 정확한 스키마 또는 "unified diff" 명시

</OUTPUT\_FORMAT>

<EXAMPLES>

여기에 G가 있으면 포함, 없으면 비움

</EXAMPLES>



\# J. NEXT

NEXT: <다음 단계 키 또는 명령>



