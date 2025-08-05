@echo off
echo [2] 프로덕션용 빌드를 시작합니다...
call pnpm install
pnpm run build
echo [2] 빌드가 완료되었습니다. 로컬 서버로 프리뷰 실행...
start http://localhost:4173
pnpm run preview
pause
