@echo off
echo ========================================
echo PersistedObject Example - Backend Setup
echo ========================================
echo.

REM Changes the current directory to the directory where this batch file is located
REM %~dp0 expands to the drive and path of the batch file (argument 0)
REM The /d parameter allows changing both drive and directory in one command
REM This ensures the script runs from its own directory regardless of where it was called from
cd /d "%~dp0\.."

echo Step 1: Creating virtual environment...
python -m venv .venv
if errorlevel 1 (
    echo Error: Failed to create virtual environment
    exit /b 1
)
echo Virtual environment created

echo.
echo Step 2: Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo Step 3: Installing persisted-object package...
pip install ..\..\python
if errorlevel 1 (
    echo Error: Failed to install persisted-object
    exit /b 1
)
echo persisted-object installed

echo.
echo Step 4: Installing project dependencies...
pip install -e .
if errorlevel 1 (
    echo Error: Failed to install project dependencies
    exit /b 1
)
echo Project dependencies installed

echo.
echo Step 5: Creating database directory and tables...
if not exist "db" mkdir db
python -c "from src.database import create_tables_sync; create_tables_sync()"
if errorlevel 1 (
    echo Error: Failed to create database tables
    exit /b 1
)
echo Database tables created

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the server:
echo   1. Activate virtual environment: .venv\Scripts\activate.bat
echo   2. Run: python main.py
echo.
echo   Or simply run: run-server.bat
echo.
echo API will be available at: http://localhost:8000
echo OpenAPI docs: http://localhost:8000/docs
echo.