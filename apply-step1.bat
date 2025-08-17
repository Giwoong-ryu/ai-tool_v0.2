@echo off
cls
echo ========================================
echo   이지픽 프로페셔널 UI/UX 1단계 적용
echo ========================================
echo.

echo [1/5] 기존 node_modules 정리...
if exist node_modules rmdir /s /q node_modules

echo [2/5] 필수 패키지 설치...
call pnpm install

echo [3/5] 개발 서버 재시작 준비...
taskkill /f /im node.exe 2>nul

echo [4/5] 캐시 정리...
if exist .vite rmdir /s /q .vite
if exist dist rmdir /s /q dist

echo [5/5] 개발 서버 시작...
echo.
echo ========================================
echo   1단계 적용 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. 브라우저에서 localhost:5173 확인
echo 2. Tailwind 클래스 적용 확인
echo 3. 폰트 로딩 최적화 확인
echo 4. 애니메이션 동작 확인
echo.
echo 준비되면 2단계(Hero 섹션)을 진행하세요!
echo.
pause

start cmd /k "pnpm dev"
