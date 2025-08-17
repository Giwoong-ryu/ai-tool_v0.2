프롬프트 시스템 정리 (오늘 기준)

본 문서는 오늘 수정 이후 기준으로 구현된 구조와 다음 수정 시 참고 정보를 정리한다.

1. 현재 구현된 템플릿

공통: 인라인 한 줄 선택(라벨 • 선택/입력 • 우측 요약설명), 미리보기/편집 토글, 복사/전송, 고급 모드(템플릿별 추가 요청사항).

템플릿 ID 화면 제목 주요 행(Row) 비고
resume_cover_letter 자기소개서/커버레터 페르소나(role), 지원 직무(position), 회사명(company, 입력), 경력 수준(experience), 어조(tone), 분량(length) DESCR/ADVANCED 매핑
blog_article 블로그 글 페르소나(role), 주제(topic, 입력), 대상 독자(target_audience), 글 스타일(style), 분량(length) DESCR/ADVANCED 매핑
ppt_presentation PPT 프레젠테이션 페르소나(role), 발표 주제(subject), 슬라이드 수(slideCount), 톤·스타일(toneStyle), 툴(tool), 구조(contentStructure) DESCR/ADVANCED 매핑
social_media SNS 포스팅 페르소나(role), 플랫폼(platform), 유형(content_type), 톤(tone) DESCR/ADVANCED 매핑
email_writing 이메일 작성 페르소나(role), 이메일 유형(email_type), 수신자(recipient), 긴급도(urgency) DESCR/ADVANCED 매핑
템플릿별 추가 요청사항(고급 모드)

resume_cover_letter: 성과 2개 이상, STAR 구문, 회사/산업 리서치 연결, 90일 계획

blog_article: Hook, 키워드 소제목, 예시/표, FAQ 2개

ppt_presentation: 슬라이드 포인트 3~5, 데모 시각자료, 지표/타임라인, 최종 CTA

social_media: Hook, 해시태그 코어3+롱테일7, 이모지 0~2, CTA 1문장

email_writing: 제목 접두사, 기한/담당/다음 단계, 능동태, 15~20자 문장

2. UX/동작 요약

상단 검색바 상시 노출. 예) “인스타 제품 소개 캐주얼 톤”, “PPT 제품 소개 15장”

가로 폭 제한: max-w-[960px] xl:max-w-[1100px] mx-auto

템플릿 보기 버튼으로 갤러리 회귀

한 줄 행 패턴

RowSel: 드롭다운 + 우측 요약설명(DESCR)

RowInput: 텍스트 입력 + 우측 설명

미리보기/편집 토글, 복사/전송

고급 모드: 템플릿별 추가 요청사항 체크리스트

3. 라우팅/검색 플로우

상단 검색바 → URL ?q=...

auto/autoTemplate.applyFromQuery(q)

intent.classifyTemplate(q) → 템플릿 결정

intent.extractDefaults(id, q) → 기본값 추출

usePromptStore.initializeWithDefaults()로 스토어 초기화

컴포저가 ?view=compose&template={id}로 이동

PromptPanel이 인라인 행 렌더 + generatePrompt()로 본문 생성

추가 요청사항은 프롬프트 하단에 자동 병합

URL 규칙

갤러리: ?view=gallery

작성: ?view=compose&template={id}

검색 진입: ?q=문장

4. 디렉터리 구조(핵심 파일)
   src/
   auto/
   autoTemplate.js # ?q=... → 분류/기본값 → 스토어 초기화
   intent.js # classifyTemplate, extractDefaults
   components/
   prompt/
   PromptComposer.jsx # 검색바 + 라우팅 + 폭 제한 컨테이너
   PromptPanel.jsx # 인라인 한 줄 행 + 우측 설명 + 고급 모드
   TemplateGallery.jsx
   common/
   InlineSelect.jsx
   ui/
   button.jsx, card.jsx, textarea.jsx, switch.jsx, checkbox.jsx
   store/
   promptStore.js # 상태/옵션/프롬프트 생성 (문구: '생성 지침(자동 반영)')
   templates/
   registry.js # TEMPLATE_KEYWORDS, LEXICONS

5. 사전/매핑

templates/registry.js

TEMPLATE_KEYWORDS: 템플릿 분류 키워드(한글)

LEXICONS: 각 옵션의 표준 어휘 목록

PromptPanel.jsx

DESCR: 선택값 → 우측 요약설명 문자열

ADVANCED_BY_TEMPLATE: 템플릿별 추가 요청사항 목록

6. 다음 수정 시 체크리스트
   새 템플릿 추가

templates/registry.js

TEMPLATE_KEYWORDS에 키워드 추가

LEXICONS에 옵션별 어휘 추가

store/promptStore.js

templates 배열에 템플릿 메타/옵션 정의

generatePromptText()에 출력 포맷 추가

components/prompt/PromptPanel.jsx

DESCR에 우측 설명 추가

ADVANCED_BY_TEMPLATE에 추가 요청사항 추가

switch에 RowSel/RowInput 배치

선택: TemplateGallery.jsx 카드/설명 추가

기존 템플릿 옵션 추가/이름 변경

스토어 옵션 키(key)와 DESCR/LEXICONS/RowSel의 키 일관성 유지

LEXICONS에 해당 값 문자열 추가(자동 기본값 추출용)

문구/톤 정책

“추천 선택지(필요 시 선택하여 반영)” → **“생성 지침(자동 반영)”**으로 통일

우측 요약설명은 최대 10~16자로 간결 유지

7. 품질/운영 메모

배포 환경 대소문자 민감. 파일명 케이스 일치 필요

@/… alias를 쓰지 않는 환경이면 상대경로 유지

새 값 추가 시 검색 분류 강화 필요하면 TEMPLATE_KEYWORDS/LEXICONS에 동의어 보강

에러 회피: currentTemplate.options.find(...) 없을 때 빈 배열 처리

8. 미해결/후속 과제(제안)

최근 선택값 로컬 저장 및 자동 복원

검색어 → 설정 요약 칩 노출

DESCR/LEXICONS i18n 분리

단축키: Alt+↑/↓ 옵션 순환, Cmd/Ctrl+K 포커스 검색

테스트: intent/lexicon 스냅샷, generatePrompt 템플릿 스냅샷
