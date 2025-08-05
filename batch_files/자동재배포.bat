@echo off
echo [1/4] Installing gh-pages...
pnpm add -D gh-pages
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Failed to install gh-pages.
    pause
    exit /b
)

echo [2/4] Removing dist folder...
rd /s /q dist

echo [3/4] Building project...
pnpm run build
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Build failed.
    pause
    exit /b
)

echo [4/4] Deploying to GitHub Pages...
pnpm run deploy
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Deployment failed.
    pause
    exit /b
)

echo Deployment complete!
echo Visit: https://ryugw10.github.io/ai-tools
pause