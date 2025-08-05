@echo off
echo 🚀 이지픽 프로젝트 VS Code로 이전하기
echo.

echo 1️⃣ 새 폴더 생성...
set "NEW_PATH=C:\Users\user\Projects\easypick"
if not exist "%NEW_PATH%" mkdir "%NEW_PATH%"

echo 2️⃣ 프로젝트 파일 복사 중...
xcopy "C:\Users\user\Desktop\gpt\ai-tools-website\*" "%NEW_PATH%\" /E /I /H /Y

echo 3️⃣ VS Code에서 새 프로젝트 열기...
code "%NEW_PATH%"

echo 4️⃣ 터미널에서 다음 명령어를 실행하세요:
echo    cd "%NEW_PATH%"
echo    npm install
echo    npm run dev
echo.

echo ✅ 이전 완료! 
echo 📍 새 위치: %NEW_PATH%
echo 🔗 VS Code에서 터미널을 열고 위 명령어를 실행하세요

pause
