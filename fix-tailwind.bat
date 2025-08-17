@echo off
echo Tailwind CSS v3로 다운그레이드 및 설정 수정...

echo [1/4] 기존 Tailwind 제거...
call pnpm remove tailwindcss @tailwindcss/vite @tailwindcss/postcss

echo [2/4] Tailwind CSS v3 설치...
call pnpm add -D tailwindcss@^3.4.0 postcss autoprefixer

echo [3/4] PostCSS 설정...
echo module.exports = { > postcss.config.cjs
echo   plugins: { >> postcss.config.cjs
echo     tailwindcss: {}, >> postcss.config.cjs
echo     autoprefixer: {}, >> postcss.config.cjs
echo   }, >> postcss.config.cjs
echo } >> postcss.config.cjs

echo [4/4] 완료!
echo.
echo 이제 pnpm dev로 다시 시작하세요.
pause
