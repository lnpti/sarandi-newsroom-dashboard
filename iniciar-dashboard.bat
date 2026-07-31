@echo off
rem Roda o Sarandi Newsroom Dashboard direto desta pasta, sem instalar.
rem Basta manter este .bat dentro da pasta do projeto e dar duplo-clique.

cd /d "%~dp0"

if not exist "out\main\index.js" (
    echo.
    echo Build nao encontrado em "out\".
    echo Rode uma vez no terminal:  npm run build
    echo.
    pause
    exit /b
)

if not exist "node_modules\electron\dist\electron.exe" (
    echo.
    echo Electron nao encontrado. Rode uma vez:  npm install
    echo.
    pause
    exit /b
)

start "" "node_modules\electron\dist\electron.exe" "out\main\index.js"
