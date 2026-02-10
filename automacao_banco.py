import time
import os
import urllib.parse
from firebase_admin import credentials, db, initialize_app
from playwright.sync_api import sync_playwright

# --- 1. CONFIGURAÇÃO DO FIREBASE ---
cred = credentials.Certificate("serviceAccountKey.json")
try:
    initialize_app(cred, {
        'databaseURL': 'https://demo-automacao-default-rtdb.firebaseio.com/' 
    })
except ValueError:
    pass 

print("🤖 ROBÔ FINANCEIRO (NÍVEL 5) INICIADO...")
print("Escutando fila de automação...")

# --- FUNÇÃO AUXILIAR: CRIA PDF FAKE ---
def criar_comprovante_fake():
    filename = "comprovante_temp.pdf"
    if not os.path.exists(filename):
        with open(filename, "wb") as f:
            f.write(b"%PDF-1.4 fake pdf content for validation")
    return os.path.abspath(filename)

# --- 2. MOTOR DE AUTOMAÇÃO (PLAYWRIGHT) ---
def executar_robo(uid_usuario, dados_pedido):
    nome_dono = dados_pedido.get('nome', 'Cliente')
    qtd = dados_pedido.get('qtd_pendencias', 0)
    
    print(f"\n🚀 NOVA DEMANDA: {qtd} itens para {nome_dono}")
    
    # Prepara o arquivo para upload
    caminho_pdf = criar_comprovante_fake()

    with sync_playwright() as p:
        # headless=False para você ver o robô trabalhando
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Monta a URL Mágica (Identidade do Robô)
        nome_safe = urllib.parse.quote(nome_dono)
        url_final = f"http://localhost:5173/conciliacao?target_uid={uid_usuario}&dono={nome_safe}"
        
        print(f"🔗 Acessando ERP: {url_final}")
        
        try:
            page.goto(url_final)
            
            # Espera o carregamento da tabela
            try:
                page.wait_for_selector(".tech-table", timeout=15000)
            except:
                print("⚠️ Tabela não carregou ou não há itens.")
            
            print("✅ Painel carregado. Iniciando processamento...")
            time.sleep(2) # Pausa dramática para ver o painel
            
            # --- LOOP DE PROCESSAMENTO ---
            # Usamos while True para pegar sempre o primeiro botão disponível
            # pois ao conciliar, o botão some da lista de pendentes.
            
            contador = 0
            while True:
                # Busca o primeiro botão 'Auditar' visível
                btn = page.query_selector("button.btn-action-tech")
                
                if not btn:
                    print("🏁 Todas as pendências foram resolvidas!")
                    break
                
                contador += 1
                print(f"⚡ Processando item #{contador}...")
                
                # 1. Abre o Modal
                btn.click()
                page.wait_for_selector(".modal-glass")
                
                # 2. "Lê" o Hash da tela (Scraping)
                # O React mostra: "(Disponível no Extrato: ABC1234)"
                # Vamos pegar o texto e limpar
                texto_hash_container = page.text_content("label span") # Pega o span dentro do label
                codigo_hash = texto_hash_container.split(":")[1].replace(")", "").strip()
                print(f"   -> Hash Identificado: {codigo_hash}")
                
                # 3. Preenche o Formulário
                page.fill("input.input-highlight", codigo_hash) # Campo Hash
                page.fill("input[type='date']", time.strftime("%Y-%m-%d")) # Data Hoje
                page.select_option("select", label="Horizon Bank (Corp)") # Seleciona Banco
                
                # 4. Faz Upload do Arquivo (Obrigatório)
                page.set_input_files("input[type='file']", caminho_pdf)
                
                time.sleep(0.5) # Pequeno delay humano
                
                # 5. Salva (Clica no botão de submit)
                page.click("button.btn-save-tech")
                
                # 6. Espera o modal fechar (sinal de sucesso)
                page.wait_for_selector(".modal-glass", state="hidden")
                print("   -> Baixa efetuada com sucesso.")
                
                # Pequena pausa entre itens
                time.sleep(1)

        except Exception as e:
            print(f"❌ Erro na automação: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            browser.close()
            # Limpa a fila
            db.reference(f'fila_automacao/{uid_usuario}').delete()
            print("🗑️ Tarefa concluída e fila limpa.")
            
            # Remove o PDF temporário (opcional)
            try:
                os.remove(caminho_pdf)
            except:
                pass

# --- 3. LISTENER ---
def listener(event):
    if event.data: 
        uid_usuario = event.path.replace('/', '')
        if uid_usuario == 'fila_automacao' or not uid_usuario:
            return 
        
        dados = event.data
        if isinstance(dados, dict) and 'acao' in dados:
             executar_robo(uid_usuario, dados)

# Inicia a escuta
ref = db.reference('fila_automacao')
ref.listen(listener)