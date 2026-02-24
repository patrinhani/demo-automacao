@echo off
:: Garante que o terminal roda na mesma pasta do .bat
cd /d "%~dp0"
title Assistente Financeiro RPA

echo ==========================================
echo A preparar o Assistente Financeiro...
echo ==========================================

:: Verifica se a pasta do Python Portatil ja existe.
if not exist "python_portatil\" (
    echo [1/5] A baixar o motor do Python Portatil...
    curl -# -o python_zip.zip https://www.python.org/ftp/python/3.11.8/python-3.11.8-embed-amd64.zip
    mkdir python_portatil
    tar -xf python_zip.zip -C python_portatil
    del python_zip.zip

    echo [2/5] A configurar o ambiente isolado...
    echo import site>> python_portatil\python311._pth

    echo [3/5] A instalar o gestor de pacotes pip...
    curl -# -o get-pip.py https://bootstrap.pypa.io/get-pip.py
    python_portatil\python.exe get-pip.py >nul
    del get-pip.py

    echo [4/5] A baixar as bibliotecas... isso pode demorar um pouco...
    python_portatil\python.exe -m pip install -q requests playwright PyMuPDF

    echo [5/5] A baixar o navegador invisivel do Playwright...
    python_portatil\python.exe -m playwright install chromium
    
    echo.
    echo Instalacao do ambiente concluida com sucesso!
)

echo ==========================================
echo INICIAR O ROBO...
echo ==========================================
:: Executa o script usando o Python Portatil que acabamos de baixar
python_portatil\python.exe automacao_banco.py

pause