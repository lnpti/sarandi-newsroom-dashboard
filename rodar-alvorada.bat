@echo off
cd /d "%~dp0"
set STATION=alvorada
echo Iniciando PlayNews - Tua Radio Alvorada...
call npm run dev
pause
