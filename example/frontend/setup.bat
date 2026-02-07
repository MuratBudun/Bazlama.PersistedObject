@echo off
echo ========================================
echo PersistedObject Example - Frontend Setup
echo ========================================
echo.

cd /d "%~dp0"

echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete! 🎉
echo ========================================
echo.
echo To start the dev server:
echo   npm run dev
echo.
echo   Or run: run-dev.bat
echo.
echo Frontend will be available at: http://localhost:5173
echo.
pause
