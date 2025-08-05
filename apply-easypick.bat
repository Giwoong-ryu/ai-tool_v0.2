@echo off
echo 🚀 이지픽 프로젝트 적용 시작...
echo.

echo ⏰ 백업 생성 중...
if exist src\app.jsx.backup (
    echo 이미 백업이 존재합니다.
) else (
    copy src\app.jsx src\app.jsx.backup
    copy src\components\MainLanding.jsx src\components\MainLanding.jsx.backup 2>nul
    copy src\features\prompt-launcher\PromptLauncher.jsx src\features\prompt-launcher\PromptLauncher.jsx.backup 2>nul
    echo ✅ 백업 완료
)

echo.
echo 📱 개발 서버 실행 중...
echo 브라우저에서 http://localhost:5173 으로 접속하세요
echo.
echo 🎯 변경사항:
echo   - 브랜딩: 툴즈비 → 이지픽
echo   - 새로운 랜딩 페이지 디자인
echo   - 목업폰 슬라이드 애니메이션
echo   - 프롬프트 생성기 UI 개선
echo.

npm run dev
