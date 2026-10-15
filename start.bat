@echo off
title Ceylonica Public Portal Launcher
echo ===================================================
echo   Starting Ceylonica Public Portal
echo ===================================================

:: Start Backend
echo Starting Backend (Laravel API on port 8000)...
start "Ceylonica Backend (:8000)" cmd /k "cd /d %~dp0backend && C:\xampp\php\php.exe artisan serve --host=127.0.0.1 --port=8000"

:: Start Frontend
echo Starting Frontend (Vite on port 5175)...
start "Ceylonica Frontend (:5175)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

:: Wait 3 seconds and open in default browser
timeout /t 3 /nobreak >nul
start http://localhost:5175/

echo.
echo ===================================================
echo   Portal is running at: http://localhost:5175/
echo   API is running at:    http://127.0.0.1:8000/
echo ===================================================
