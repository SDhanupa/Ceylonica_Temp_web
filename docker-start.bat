@echo off
title Ceylonica Docker Launcher
echo ===================================================
echo   Starting Ceylonica Public Portal in Docker
echo ===================================================

docker compose up -d

timeout /t 2 /nobreak >nul
start http://localhost:3002/

echo.
echo ===================================================
echo   Portal is running at: http://localhost:3002/
echo ===================================================
pause
