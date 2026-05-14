@echo off
chcp 65001 >nul
echo.
echo  =============================================
echo   소싱킷 앱 시작 중...
echo  =============================================
echo.
echo  잠깐 기다려주세요 (최초 실행은 30초 정도 걸립니다)
echo.
cd /d "%~dp0"
start "" http://localhost:3000
npx next dev
pause
