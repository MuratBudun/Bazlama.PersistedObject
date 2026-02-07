@echo off
echo ========================================
echo Seeding database with sample data...
echo ========================================
echo.

cd /d "%~dp0\.."

REM Activate virtual environment
call .\.venv\Scripts\activate

REM Run seed script as module
python -m src.seed_data

echo.
echo Seeding completed! You can now explore the example data.
echo Run run-server.bat to start the API server.