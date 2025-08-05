@echo off
echo [1] 개발 서버를 실행합니다...
call pnpm install
start http://localhost:5173
pnpm run dev
pause
