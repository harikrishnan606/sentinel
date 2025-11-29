@echo off
cd /d "%~dp0"
echo Stopping existing Node.js processes...
taskkill /F /IM node.exe
echo Starting Sentinel Server as Administrator...
node src/index.js
pause
