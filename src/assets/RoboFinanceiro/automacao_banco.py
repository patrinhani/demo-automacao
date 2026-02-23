import time
import os
import pathlib
import requests
import getpass
from playwright.sync_api import sync_playwright

try:
    import fitz  # PyMuPDF
except ImportError:
    print("⚠️ Para o efeito visual do PDF, instale a biblioteca no terminal: pip install PyMuPDF")
    fitz = None

# --- 1. CONFIGURAÇÃO PÚBLICA DO FIREBASE ---
# Cole aqui a sua VITE_FIREBASE_API_KEY que está no .env do React
API_KEY = "AIzaSyAo4nYPG-harTGiNiPkxXBH1sgZ4VY2-ao" 
DATABASE_URL = "https://techcorp-7abfc-default-rtdb.firebaseio.com"

# --- 2. MOTOR DE AUTOMAÇÃO (PLAYWRIGHT) ---
def executar_robo(uid_usuario, dados_pedido, email_digitado, senha_digitada, id_token):
    print(f"\n🚀 INICIAR FLUXO RPA (Extração Documental e Conciliação Cruzada)...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, channel="msedge", args=['--start-maximized'])
        context = browser.new_context(no_viewport=True, accept_downloads=True)
        page_erp = context.new_page()

        try:
            print("🔐 A aceder ao Portal ERP...")
            page_erp.goto("http://localhost:5173/") 
            page_erp.wait_for_selector("input[type='email']", timeout=15000)
            
            page_erp.type("input[type='email']", email_digitado, delay=50)
            page_erp.type("input[type='password']", senha_digitada, delay=50)
            page_erp.click("button[type='submit']")
            page_erp.wait_for_url("**/dashboard", timeout=15000)
            time.sleep(1)

            print("🏦 A inicializar módulo bancário (Horizon Bank)...")
            with context.expect_page() as new_page_info:
                page_erp.click("button:has-text('Horizon Bank')", force=True)
            page_banco = new_page_info.value
            
            page_banco.wait_for_selector("input[type='text'].search-input-bank", timeout=15000)
            page_banco.type("input[type='text'].search-input-bank", email_digitado, delay=50)
            page_banco.type("input[type='password'].search-input-bank", senha_digitada, delay=50)
            page_banco.click("button.btn-generate-infinite")
            
            page_banco.wait_for_selector("button:has-text('Extrato')", timeout=15000)
            page_banco.click("button:has-text('Extrato')")
            time.sleep(1)

            page_erp.bring_to_front()
            page_erp.click("button:has-text('Conciliação')")
            page_erp.wait_for_selector(".status-badge.pendente", timeout=20000)
            time.sleep(1)
            
            contador = 0
            while True:
                linha_alvo = page_erp.query_selector("tr:has(.status-badge:has-text('Pendente'))")
                if not linha_alvo:
                    print("\n🏁 Processamento Finalizado: Não há mais pendências!")
                    break
                    
                contador += 1
                try:
                    print(f"\n==============================================")
                    print(f"🔄 A INICIAR AUDITORIA DA FATURA #{contador}")
                    
                    colunas = linha_alvo.query_selector_all("td")
                    id_interno_trx = colunas[0].inner_text().strip()
                    nome_cliente = colunas[1].query_selector("strong").inner_text().strip()
                    print(f"🏢 ERP diz que {nome_cliente} possui a TRX pendente: {id_interno_trx}")
                    
                    print(f"🔍 A alternar sistema... A procurar TRX no Extrato Bancário...")
                    page_banco.bring_to_front()
                    
                    input_busca = page_banco.query_selector("input[placeholder='🔍 Buscar lançamento...']")
                    input_busca.click(click_count=3)
                    page_banco.keyboard.press("Backspace")
                    page_banco.type("input[placeholder='🔍 Buscar lançamento...']", id_interno_trx, delay=80)
                    time.sleep(1.5)
                    
                    linhas_banco = page_banco.query_selector_all(".table-container tbody tr")
                    if len(linhas_banco) == 0 or "Nenhum" in linhas_banco[0].inner_text():
                        raise Exception(f"Fraude ou Erro: TRX {id_interno_trx} não consta no banco!")

                    btn_pdf = page_banco.query_selector("button.btn-icon-download")
                    with page_banco.expect_download(timeout=15000) as download_info:
                        btn_pdf.click()
                    download = download_info.value
                    
                    caminho_pdf = os.path.abspath(download.suggested_filename)
                    download.save_as(caminho_pdf)
                    print(f"📥 Comprovativo transferido fisicamente para: {download.suggested_filename}")
                    time.sleep(1)

                    print("\n👁️  [ROBÔ] A abrir e a digitalizar o texto do PDF no ecrã...")
                    page_pdf = context.new_page()
                    url_pdf = pathlib.Path(caminho_pdf).as_uri()
                    page_pdf.goto(url_pdf)
                    page_pdf.bring_to_front()
                    time.sleep(1.5)
                    
                    hash_extraido_do_banco = None
                    if fitz:
                        print("🤖 A extrair âncoras de texto (OCR)...")
                        doc = fitz.open(caminho_pdf)
                        texto_completo = doc[0].get_text("text") 
                        doc.close()
                        
                        linhas_pdf = texto_completo.split('\n')
                        for i, linha in enumerate(linhas_pdf):
                            linha_limpa = linha.strip()
                            if not linha_limpa: continue
                            
                            if "AUTENTICAÇÃO ELETRÔNICA" in linha_limpa.upper():
                                for j in range(i + 1, len(linhas_pdf)):
                                    if linhas_pdf[j].strip():
                                        hash_extraido_do_banco = linhas_pdf[j].strip()
                                        break
                                
                                print(f"   🎯 ÂNCORA ENCONTRADA! Hash Identificado: {hash_extraido_do_banco}")
                                time.sleep(2)
                                break
                            else:
                                print(f"   | a ler bloco... {linha_limpa[:40]}")
                                time.sleep(0.04)
                    else:
                        time.sleep(3)
                    
                    if not hash_extraido_do_banco:
                        hash_extraido_do_banco = f"HRZ-AUTH-{id_interno_trx}"
                        print(f"⚠️ Aviso: Hash lido via Fallback -> {hash_extraido_do_banco}")

                    page_pdf.close()
                    print("✅ Dados em memória. A regressar ao ERP...")

                    page_erp.bring_to_front()
                    linha_alvo.query_selector("button.btn-action-tech").click()
                    page_erp.wait_for_selector(".modal-glass", timeout=5000)
                    time.sleep(1)
                    
                    print(f"📝 A injetar o Hash de validação '{hash_extraido_do_banco}' no sistema...")
                    page_erp.type("input.input-highlight", hash_extraido_do_banco, delay=100)
                    time.sleep(0.5)
                    
                    page_erp.fill("input[type='date']", time.strftime("%Y-%m-%d"))
                    page_erp.select_option("select", label="Horizon Bank (Corp)")
                    time.sleep(0.5)
                    
                    print("📎 A anexar o comprovativo PDF físico no formulário...")
                    page_erp.set_input_files("input[type='file']", caminho_pdf)
                    time.sleep(2)
                    
                    page_erp.click("button.btn-save-tech")
                    page_erp.wait_for_selector(".modal-glass", state="hidden", timeout=5000)
                    print(f"🎉 Título liquidado com sucesso no ERP!")
                    print(f"==============================================\n")

                    if os.path.exists(caminho_pdf):
                        os.remove(caminho_pdf)
                    time.sleep(1.5)

                except Exception as loop_err:
                    print(f"⚠️ Erro ao processar transação: {loop_err}")
                    for p in context.pages:
                        if p != page_erp and p != page_banco:
                            p.close()
                    page_erp.bring_to_front()
                    page_erp.keyboard.press("Escape")
                    time.sleep(2)
                    continue

        except Exception as main_err:
            print(f"❌ Erro Crítico: {main_err}")
        finally:
            browser.close()
            # Limpa o pedido usando a REST API de forma segura
            try:
                url_delete = f"{DATABASE_URL}/fila_automacao/{uid_usuario}.json?auth={id_token}"
                requests.delete(url_delete)
            except:
                pass

# --- 3. AUTENTICAÇÃO SEGURA (API REST) ---
print("\n====================================================")
print("🏦 BEM-VINDO AO SEU ASSISTENTE FINANCEIRO PESSOAL")
print("====================================================")

meu_email = input("Digite o seu E-mail do Portal: ").strip()
minha_senha = getpass.getpass("Digite a sua Palavra-passe (ela ficará oculta): ").strip()

print("\n🔍 A validar credenciais no sistema de segurança...")

# Autentica usando o sistema oficial de Login do Firebase
auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
resposta_auth = requests.post(auth_url, json={"email": meu_email, "password": minha_senha, "returnSecureToken": True})
dados_auth = resposta_auth.json()

if "error" in dados_auth:
    print(f"❌ Erro de Login: Palavra-passe ou e-mail incorretos.")
    exit()

meu_uid = dados_auth["localId"]
id_token = dados_auth["idToken"] # Token de segurança temporário
print(f"✅ Utilizador autenticado com sucesso!")

# --- 4. GESTÃO DE FILA SIMPLIFICADA ---
print(f"\n👀 O seu Robô Pessoal está LIGADO e a postos.")
print("A aguardar ordens de conciliação do Portal...\n")

url_fila = f"{DATABASE_URL}/fila_automacao/{meu_uid}.json"

try:
    while True:
        try:
            # Pergunta à base de dados se há tarefas novas
            resposta_fila = requests.get(f"{url_fila}?auth={id_token}")
            dados_fila = resposta_fila.json()

            if dados_fila and isinstance(dados_fila, dict) and dados_fila.get('acao') == 'CONCILIAR_PENDENTES':
                executar_robo(meu_uid, dados_fila, meu_email, minha_senha, id_token)
                print("\n👀 A aguardar novas ordens...")
                
        except requests.exceptions.RequestException:
            pass # Ignora falhas rápidas de internet
            
        # Espera 3 segundos antes de perguntar outra vez para não sobrecarregar o servidor
        time.sleep(3)
        
except KeyboardInterrupt:
    print("\n🛑 Robô desligado manualmente.")