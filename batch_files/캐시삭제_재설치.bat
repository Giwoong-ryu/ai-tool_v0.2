@echo off
REM -- 개발 환경 초기화 및 시작 스크립트 --
REM 이 스크립트는 npm 캐시를 정리하고, node_modules 및 Vite 캐시를 삭제한 다음,
REM 의존성을 재설치하고 개발 서버를 시작합니다.
REM 각 단계의 성공 여부를 확인하여 오류 시 알려줍니다.

REM 콘솔 인코딩을 UTF-8로 설정하여 한글 깨짐 방지
chcp 65001 > nul

REM 지연된 변수 확장을 활성화하여 ERRORLEVEL 변화를 정확히 확인 (디버깅용)
setlocal enabledelayedexpansion

echo.
echo ===================================================
echo   개발 환경 초기화 및 재시작 스크립트 실행 중...
echo ===================================================
echo.

:step1_start
REM 1. npm 캐시 정리
echo [1/4] npm 캐시를 정리합니다...
call npm cache clean --force
echo   - (npm cache clean) ERRORLEVEL: !ERRORLEVEL!
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo 오류: npm 캐시 정리 중 문제가 발생했습니다.
    goto :error_exit
)
echo.
echo DEBUG: npm 캐시 정리 완료. 다음 단계로 진행하려면 아무 키나 누르세요...
pause
echo.
echo DEBUG: step1_start에서 step2_start로 이동합니다...
goto :step2_start

:step2_start
REM 2. 기존 의존성 및 캐시 폴더 삭제
echo [2/4] 기존 node_modules, .vite, lock 파일들을 삭제합니다...

REM node_modules 폴더 삭제
echo   - node_modules 폴더 삭제 시도...
timeout /t 1 > nul REM 삭제 전 잠시 대기
if exist node_modules (
    rmdir /s /q node_modules
    echo   - (rmdir node_modules) ERRORLEVEL: !ERRORLEVEL!
    if !ERRORLEVEL! NEQ 0 (
        echo 오류: node_modules 삭제 중 문제가 발생했습니다.
        goto :error_exit
    )
) else (
    echo   - node_modules 폴더가 없습니다.
)
timeout /t 1 > nul REM 삭제 후 잠시 대기

REM .vite 캐시 폴더 삭제
echo   - .vite 폴더 삭제 시도...
timeout /t 1 > nul REM 삭제 전 잠시 대기
if exist .vite (
    rmdir /s /q .vite
    echo   - (rmdir .vite) ERRORLEVEL: !ERRORLEVEL!
    if !ERRORLEVEL! NEQ 0 (
        echo 오류: .vite 폴더 삭제 중 문제가 발생했습니다.
        goto :error_exit
    )
) else (
    echo   - .vite 폴더가 없습니다.
)
timeout /t 1 > nul REM 삭제 후 잠시 대기

REM package-lock.json 파일 삭제 (npm 사용 시)
echo   - package-lock.json 파일 삭제 시도...
timeout /t 1 > nul REM 삭제 전 잠시 대기
if exist package-lock.json (
    del /q package-lock.json
    echo   - (del package-lock.json) ERRORLEVEL: !ERRORLEVEL!
    if !ERRORLEVEL! NEQ 0 (
        echo 오류: package-lock.json 삭제 중 문제가 발생했습니다.
        goto :error_exit
    )
) else (
    echo   - package-lock.json 파일이 없습니다.
)
timeout /t 1 > nul REM 삭제 후 잠시 대기

REM yarn.lock 파일 삭제 (yarn 사용 시)
echo   - yarn.lock 파일 삭제 시도...
timeout /t 1 > nul REM 삭제 전 잠시 대기
if exist yarn.lock (
    del /q yarn.lock
    echo   - (del yarn.lock) ERRORLEVEL: !ERRORLEVEL!
    if !ERRORLEVEL! NEQ 0 (
        echo 오류: yarn.lock 삭제 중 문제가 발생했습니다.
        goto :error_exit
    )
) else (
    echo   - yarn.lock 파일이 없습니다.
)
echo.
echo DEBUG: 기존 의존성 및 캐시 삭제 완료. 다음 단계로 진행하려면 아무 키나 누르세요...
pause
echo.
echo DEBUG: step2_start에서 step3_start로 이동합니다...
goto :step3_start

:step3_start
REM 3. 의존성 재설치
echo [3/4] npm 의존성을 재설치합니다. (시간이 다소 소요될 수 있습니다...)
call npm install
echo   - (npm install) ERRORLEVEL: !ERRORLEVEL!
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo 오류: npm install 중 문제가 발생했습니다. 네트워크 연결을 확인해주세요.
    goto :error_exit
)
echo.
echo DEBUG: npm install 완료. 다음 단계로 진행하려면 아무 키나 누르세요...
pause
echo.
echo DEBUG: step3_start에서 step4_start로 이동합니다...
goto :step4_start

:step4_start
REM 4. 개발 서버 시작 (별도 창에서 실행하고 종료까지 대기)
echo [4/4] 개발 서버를 시작합니다. 새 창이 열릴 수 있습니다.
echo.
start "개발 서버" /wait npm run dev
echo   - (npm run dev) ERRORLEVEL: !ERRORLEVEL!
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo 오류: 개발 서버 시작 또는 실행 중 문제가 발생했습니다.
    goto :error_exit
)

goto :script_end

:script_end
echo.
echo ===================================================
echo   스크립트 실행이 완료되었습니다.
echo   창을 닫으려면 아무 키나 누르세요...
echo ===================================================
pause
endlocal
goto :eof

:error_exit
echo.
echo ===================================================
echo   오류로 인해 스크립트가 중단되었습니다.
echo   위 메시지를 확인하고 문제를 해결한 후 다시 시도해주세요.
echo   창을 닫으려면 아무 키나 누르세요...
echo ===================================================
echo.
pause
endlocal
goto :eof
