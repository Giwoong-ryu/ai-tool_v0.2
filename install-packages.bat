@echo off
echo Installing required packages for professional UI/UX...

echo.
echo Installing font packages...
pnpm add @fontsource/pretendard @fontsource/poppins

echo.
echo Installing animation packages...
pnpm add @headlessui/react @heroicons/react

echo.
echo Installing additional utilities...
pnpm add @tailwindcss/typography @tailwindcss/aspect-ratio

echo.
echo All packages installed successfully!
echo.
pause
