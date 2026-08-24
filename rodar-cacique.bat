@echo off
cd /d "%~dp0"
set STATION=cacique
echo Iniciando PlayNews - Tua Radio Cacique...
call npm run dev
pause
