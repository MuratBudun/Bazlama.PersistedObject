@echo off
cd /d "%~dp0"

if not exist "node_modules" (
    echo Error: Dependencies not installed!
    echo Please run setup.bat first
    pause
    exit /b 1
)

echo Starting PersistedObject Example Frontend...
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo.
echo Make sure backend is running!
echo Press Ctrl+C to stop the dev server
echo.

call npm run dev
