@echo off
:: Garante que o terminal roda na mesma pasta do .bat
cd /d "%~dp0"

title Assistente Financeiro RPA
echo ==========================================
echo A preparar o ambiente do Robo...
echo ==========================================

:: 1. LIMPEZA INICIAL (Garante que nao ha lixo de execucoes anteriores)
if exist "venv\" (
    echo [0/4] A limpar ficheiros temporarios da ultima sessao...
    rmdir /s /q venv
)

:: 2. Verifica se o Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado neste computador!
    echo Por favor, instale o Python a partir do site oficial: python.org
    echo IMPORTANTE: Lembre-se de marcar a caixa "Add Python.exe to PATH" durante a instalacao.
    pause
    exit
)

:: 3. Cria o ambiente virtual novo
echo [1/4] A criar ambiente virtual isolado, aguarde um momento...
python -m venv venv

:: 4. Ativa o ambiente virtual
echo [2/4] A ativar ambiente...
call venv\Scripts\activate

:: 5. Instala as dependencias
echo [3/4] A transferir dependencias: requests, playwright, PyMuPDF...
pip install -q requests playwright PyMuPDF

:: 6. Verifica os motores de navegacao
echo [4/4] A verificar motores de navegacao do Playwright...
playwright install chromium

:: 7. Roda a automacao
echo ==========================================
echo Tudo pronto! A iniciar o sistema...
echo ==========================================
python automacao_banco.py

:: Quando a pessoa fizer Ctrl+C ou fechar, nao faz mal, porque na proxima vez ele limpa!
pause