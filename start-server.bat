@echo off
echo ========================================
echo   EduTVET Backend - Quick Start
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
    echo.
)

REM Check if documents folder exists
if not exist "documents" (
    echo Creating documents folder...
    mkdir documents
    echo ✓ Documents folder created
    echo.
)

REM Start the server
echo Starting EduTVET API Server...
echo.
echo ========================================
echo   Server starting on port 5000
echo   http://localhost:5000
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

pause
