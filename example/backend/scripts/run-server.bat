@echo off

REM Changes the current directory to the directory where this batch file is located
REM %~dp0 expands to the drive and path of the batch file (argument 0)
REM The /d parameter allows changing both drive and directory in one command
REM This ensures the script runs from its own directory regardless of where it was called from
cd /d "%~dp0\.."

if not exist ".venv\Scripts\activate.bat" (
    echo Error: Virtual environment not found!
    echo Please run setup.bat first
    pause
    exit /b 1
)

echo Starting PersistedObject Example API...
echo.
echo API: http://localhost:8000
echo Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

call .venv\Scripts\activate.bat
python main.py
