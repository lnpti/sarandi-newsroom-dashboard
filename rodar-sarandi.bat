@echo off
cd /d "%~dp0"
set STATION=sarandi
echo Iniciando PlayNews - Radio Sarandi...
call npm run dev
pause
