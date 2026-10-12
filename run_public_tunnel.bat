@echo off
chcp 65001 > nul
title Self-Driving Portfolio - Public Share Tunnel (Cloudflare)
echo ============================================================================
echo   [Self-Driving Portfolio] 외부 인터넷 공유 터널 실행 중 (Cloudflare Tunnel)...
echo ============================================================================
echo.
echo   잠시만 기다리시면 아래 박스에 https://xxxx-xxxx.trycloudflare.com 주소가 나타납니다.
echo   해당 주소를 복사하여 카카오톡/슬랙/메신저로 공유하시면
echo   스마트폰(LTE/5G)이나 외부 PC 어디서든 즉시 접속 가능합니다!
echo   (시간 제한 없이 유지되며, 암호 입력 페이지 없이 바로 접속됩니다.)
echo.
cd /d "%~dp0"
.\cloudflared.exe tunnel --protocol http2 --url http://127.0.0.1:5173
pause
