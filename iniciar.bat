@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Iniciando o jogo... (feche esta janela para encerrar o servidor)
start "" "http://localhost:8080"
python servidor.py
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar. Verifique se o Python esta instalado.
  pause
)
