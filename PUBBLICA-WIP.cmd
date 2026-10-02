@echo off
setlocal
cd /d "%~dp0"
echo CoreChatX-WebSite-wip - pubblicazione GitHub Pages
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Publish-Wip.ps1"
set "RESULT=%ERRORLEVEL%"
echo.
if not "%RESULT%"=="0" echo Pubblicazione interrotta. Leggi il messaggio e docs\DEPLOY_WIP.md.
pause
exit /b %RESULT%
