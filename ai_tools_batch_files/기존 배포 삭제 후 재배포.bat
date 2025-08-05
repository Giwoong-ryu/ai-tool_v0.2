@echo off
echo [3] 이전 빌드 결과(dist)를 삭제합니다...
rmdir /s /q dist

echo [3] 의존성 설치 및 새 빌드 시작...
call pnpm install
pnpm run build

echo [3] 빌드 완료. 정적 프리뷰를 실행합니다...
start http://localhost:4173
pnpm run preview
pause
