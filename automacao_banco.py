import time
import os
import pathlib
import queue  # <-- Nova biblioteca nativa para organizar a fila
import firebase_admin
from firebase_admin import credentials, db
from playwright.sync_api import sync_playwright

try:
    import fitz  # PyMuPDF
except ImportError:
    print("⚠️ Para o efeito visual do PDF, instale a biblioteca no terminal: pip install PyMuPDF")
    fitz = None

# --- 1. CONFIGURAÇÃO DO FIREBASE ---
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://techcorp-7abfc-default-rtdb.firebaseio.com/'
        })
    print("🤖 ROBÔ FINANCEIRO ONLINE ")
except Exception as e:
    print(f"❌ Erro de conexão com Firebase: {e}")
    exit()

# --- 2. MOTOR DE AUTOMAÇÃO (PLAYWRIGHT) ---
def executar_robo(uid_usuario, dados_pedido):
    print(f"\n🚀 INICIANDO FLUXO RPA (Extração Documental e Conciliação Cruzada)...")
    
    try:
        ref_user = db.reference(f'users/{uid_usuario}')
        user_data = ref_user.get()
        email = user_data.get('email')
        senha = user_data.get('senha')
    except Exception as e:
        print("❌ Erro ao buscar credenciais.")
        return

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=['--start-maximized'])
        context = browser.new_context(no_viewport=True, accept_downloads=True)
        page_erp = context.new_page()

        try:
            # --- PASSO 1: LOGIN NO ERP E ABERTURA DO BANCO ---
            print("🔐 Aceder ao Portal ERP...")
            page_erp.goto("http://localhost:5173/")
            page_erp.wait_for_selector("input[type='email']", timeout=15000)
            page_erp.type("input[type='email']", email, delay=50)
            page_erp.type("input[type='password']", senha, delay=50)
            page_erp.click("button[type='submit']")
            page_erp.wait_for_url("**/dashboard", timeout=15000)
            time.sleep(1)

            print("🏦 A inicializar módulo bancário (Horizon Bank)...")
            with context.expect_page() as new_page_info:
                # O clique com force=True garante que ele acerta no link do menu lateral
                page_erp.click("button:has-text('Horizon Bank')", force=True)
            page_banco = new_page_info.value
            
            page_banco.wait_for_selector("input[type='text'].search-input-bank", timeout=15000)
            page_banco.type("input[type='text'].search-input-bank", email, delay=50)
            page_banco.type("input[type='password'].search-input-bank", senha, delay=50)
            page_banco.click("button.btn-generate-infinite")
            
            page_banco.wait_for_selector("button:has-text('Extrato')", timeout=15000)
            page_banco.click("button:has-text('Extrato')")
            time.sleep(1)

            # --- PASSO 2: ACEDER À TABELA DE CONCILIAÇÃO NO ERP ---
            page_erp.bring_to_front()
            page_erp.click("button:has-text('Conciliação')")
            page_erp.wait_for_selector(".status-badge.pendente", timeout=20000)
            time.sleep(1)
            
            # --- LOOP DE AUDITORIA ---
            contador = 0
            while True:
                # Procura a primeira linha que ainda está "Pendente"
                linha_alvo = page_erp.query_selector("tr:has(.status-badge:has-text('Pendente'))")
                if not linha_alvo:
                    print("\n🏁 Processamento Finalizado: Não há mais pendências!")
                    break
                    
                contador += 1
                try:
                    print(f"\n==============================================")
                    print(f"🔄 A INICIAR AUDITORIA DA FATURA #{contador}")
                    
                    # 1️⃣ LER O CÓDIGO TRX (ID INTERNO) DA TABELA DO ERP
                    colunas = linha_alvo.query_selector_all("td")
                    id_interno_trx = colunas[0].inner_text().strip()
                    nome_cliente = colunas[1].query_selector("strong").inner_text().strip()
                    print(f"🏢 ERP diz que {nome_cliente} possui a TRX pendente: {id_interno_trx}")
                    
                    # 2️⃣ IR AO BANCO E PROCURAR A TRX
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

                    # 3️⃣ TRANSFERÊNCIA DO PDF
                    btn_pdf = page_banco.query_selector("button.btn-icon-download")
                    with page_banco.expect_download(timeout=15000) as download_info:
                        btn_pdf.click()
                    download = download_info.value
                    
                    # Caminho absoluto da máquina
                    caminho_pdf = os.path.abspath(download.suggested_filename)
                    download.save_as(caminho_pdf)
                    print(f"📥 Comprovativo transferido fisicamente para: {download.suggested_filename}")
                    time.sleep(1)

                    # 4️⃣ EXTRAÇÃO NATIVA DO HASH LENDO O TEXTO DENTRO DO PDF
                    print("\n👁️  [ROBÔ] A abrir e a digitalizar o texto do PDF no ecrã...")
                    page_pdf = context.new_page()
                    
                    # CORREÇÃO DEFINITIVA DE URL (Usa pathlib para formatar perfeitamente para o Windows)
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
                        
                        # Efeito visual de varredura no terminal
                        for i, linha in enumerate(linhas_pdf):
                            linha_limpa = linha.strip()
                            if not linha_limpa: continue
                            
                            # Procura pelo título da caixa de segurança
                            if "AUTENTICAÇÃO ELETRÔNICA" in linha_limpa.upper():
                                # Apanha a próxima linha que não esteja vazia
                                for j in range(i + 1, len(linhas_pdf)):
                                    if linhas_pdf[j].strip():
                                        hash_extraido_do_banco = linhas_pdf[j].strip()
                                        break
                                
                                print(f"   🎯 ÂNCORA ENCONTRADA! Hash Identificado: {hash_extraido_do_banco}")
                                time.sleep(2) # Pausa dramática para a plateia admirar
                                break
                            else:
                                print(f"   | a ler bloco... {linha_limpa[:40]}")
                                time.sleep(0.04)
                    else:
                        time.sleep(3) # Caso a pessoa não tenha o PyMuPDF instalado
                    
                    if not hash_extraido_do_banco:
                        # Fallback de segurança se o OCR falhar
                        hash_extraido_do_banco = f"HRZ-AUTH-{id_interno_trx}"
                        print(f"⚠️ Aviso: Hash lido via Fallback -> {hash_extraido_do_banco}")

                    page_pdf.close()
                    print("✅ Dados em memória. A regressar ao ERP...")

                    # 5️⃣ PREENCHER O ERP COM A EXTRAÇÃO DO PDF
                    page_erp.bring_to_front()
                    # Abre o modal clicando no botão de ação da linha
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
                    time.sleep(2) # Pausa para a plateia ver tudo preenchido corretamente
                    
                    page_erp.click("button.btn-save-tech")
                    page_erp.wait_for_selector(".modal-glass", state="hidden", timeout=5000)
                    print(f"🎉 Título liquidado com sucesso no ERP!")
                    print(f"==============================================\n")

                    # Limpa o PDF do computador para não ocupar espaço
                    if os.path.exists(caminho_pdf):
                        os.remove(caminho_pdf)
                    time.sleep(1.5)

                except Exception as loop_err:
                    print(f"⚠️ Erro ao processar transação: {loop_err}")
                    # Fecha abas residuais (como o PDF) em caso de erro para não estragar a próxima tentativa
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
            # Limpa o Firebase ao terminar
            try:
                db.reference(f'fila_automacao/{uid_usuario}').delete()
            except:
                pass


# --- 3. GESTÃO DE FILA (THREAD MAIN SEGURO) ---
# A fila armazena os pedidos recebidos do Firebase
fila_pedidos = queue.Queue()

def listener(event):
    if event.data: 
        uid_usuario = event.path.replace('/', '')
        if uid_usuario == 'fila_automacao' or not uid_usuario:
            return 
        dados = event.data
        if isinstance(dados, dict) and 'acao' in dados:
             if dados['acao'] == "CONCILIAR_PENDENTES":
                 # A "recepcionista" apenas anota na fila e volta a dormir
                 fila_pedidos.put((uid_usuario, dados))

print("👀 Robô LIGADO e a postos. A aguardar sinal do Firebase...")
ref = db.reference('fila_automacao')
ref.listen(listener)

# O Loop Principal que executa o Playwright na Thread correta (Main Thread)
try:
    while True:
        try:
            # Fica aguardando um item na fila
            uid_alvo, dados_alvo = fila_pedidos.get(timeout=1)
            executar_robo(uid_alvo, dados_alvo)
            fila_pedidos.task_done()
        except queue.Empty:
            # Se a fila estiver vazia, ele continua esperando silenciosamente
            continue
except KeyboardInterrupt:
    print("\n🛑 Robô desligado manualmente.")