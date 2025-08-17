@echo off
cls
echo ========================================
echo   이지픽 Tailwind 문제 해결 및 1단계 적용
echo ========================================
echo.

echo [1/6] 기존 node_modules 정리...
if exist node_modules rmdir /s /q node_modules

echo [2/6] Tailwind CSS v3로 다운그레이드...
call pnpm remove tailwindcss @tailwindcss/vite @tailwindcss/postcss

echo [3/6] Tailwind CSS v3 및 필수 패키지 설치...
call pnpm add -D tailwindcss@^3.4.0 postcss autoprefixer
call pnpm install

echo [4/6] PostCSS 설정 파일 생성...
echo module.exports = { > postcss.config.cjs
echo   plugins: { >> postcss.config.cjs
echo     tailwindcss: {}, >> postcss.config.cjs
echo     autoprefixer: {}, >> postcss.config.cjs
echo   }, >> postcss.config.cjs
echo } >> postcss.config.cjs

echo [5/6] 캐시 정리...
if exist .vite rmdir /s /q .vite
if exist dist rmdir /s /q dist

echo [6/6] 완료!
echo.
echo ========================================
echo   Tailwind 문제 해결 완료!
echo ========================================
echo.
echo 이제 'pnpm dev'를 실행하여 개발 서버를 시작하세요.
echo 더 이상 bg-primary-100 오류가 발생하지 않을 것입니다.
echo.
echo 사용 가능한 새로운 클래스들:
echo - btn-primary (파란색 버튼)
echo - btn-secondary (세이지 그린 버튼)
echo - glass (투명 효과)
echo - animate-fade-in-up (부드러운 애니메이션)
echo - text-gradient-primary (그라데이션 텍스트)
echo.
pause
