{
  "areas": {
    "src/components/**": "화면 컴포넌트(페이지 조각)",
    "src/components/ui/**": "공용 UI(버튼/배지/토글 등)",
    "src/data/**": "정적/목록 데이터(예: aiTools.js)",
    "src/lib/**": "외부 연동/유틸(supabase 등)",
    "src/index.css": "전역 스타일 엔트리",
    "src/app.jsx": "앱 엔트리(루트 컴포넌트)"
  },
  "edit_rules": {
    "small_ui_fix": {
      "scope": ["src/components/**", "src/components/ui/**"],
      "examples": ["텍스트 줄바꿈/말줄임", "간격/정렬 수정"],
      "avoid": ["번들 설정 변경", "데이터 스키마 변경"]
    },
    "data_schema": {
      "scope": ["src/data/**"],
      "examples": ["필드 추가(isFree)", "값 정리"],
      "avoid": ["UI 파일 동시에 수정"]
    }
  },
  "protected": [
    "vite.config.js",
    "src/app.jsx"
  ]
}
