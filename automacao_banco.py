import time
import os
import firebase_admin
from firebase_admin import credentials, db
from playwright.sync_api import sync_playwright

# --- 1. CONFIGURAÇÃO DO FIREBASE ---
try:
    # Garante que não inicializa duas vezes
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred, {
            # 👇 URL CORRIGIDA AQUI:
            'databaseURL': 'https://techcorp-7abfc-default-rtdb.firebaseio.com/'
        })
    print("🤖 ROBÔ FINANCEIRO (LOGIN REAL) INICIADO...")
    print(f"📡 Conectado ao banco: https://techcorp-7abfc-default-rtdb.firebaseio.com/")
except Exception as e:
    print(f"❌ Erro de conexão com Firebase: {e}")
    exit()

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
    
    # --- PASSO A: BUSCAR CREDENCIAIS NO BANCO ---
    print(f"🔍 Buscando credenciais de {nome_dono} no banco...")
    
    try:
        ref_user = db.reference(f'users/{uid_usuario}')
        user_data = ref_user.get()

        if not user_data:
            print(f"❌ Erro: Usuário {uid_usuario} não encontrado no banco.")
            return

        email = user_data.get('email')
        senha = user_data.get('senha')

        if not email or not senha:
            print(f"❌ Erro: E-mail ou Senha não cadastrados para este usuário.")
            return

        print(f"✅ Credenciais encontradas: {email} | ********")

    except Exception as e:
        print(f"❌ Erro ao buscar dados no Firebase: {e}")
        return

    # Prepara o arquivo para upload
    caminho_pdf = criar_comprovante_fake()

    with sync_playwright() as p:
        # headless=False para ver o navegador abrindo
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        try:
            # --- PASSO B: FAZER LOGIN REAL ---
            print("🔐 Acessando tela de Login...")
            # Acessa a raiz para logar
            page.goto("http://localhost:5173/")
            
            # Espera carregar o campo de email
            page.wait_for_selector("input[type='email']", timeout=10000)
            
            print("⌨️  Digitando credenciais...")
            page.fill("input[type='email']", email)
            page.fill("input[type='password']", senha)
            time.sleep(1) 
            
            print("👆 Clicando em Entrar...")
            # Clica no botão de entrar (pode ser button ou input submit)
            page.click("button[type='submit']")
            
            # Espera o login acontecer (redirecionar para dashboard)
            print("⏳ Aguardando autenticação...")
            try:
                page.wait_for_url("**/dashboard", timeout=15000)
                print("✅ Login realizado com sucesso!")
            except:
                print("⚠️ Alerta: Não detectou redirecionamento para dashboard, mas tentará continuar.")

            time.sleep(2)

            # --- PASSO C: IR PARA CONCILIAÇÃO ---
            print("➡️ Navegando para Conciliação Financeira...")
            page.goto("http://localhost:5173/conciliacao")
            
            # Espera a tabela carregar
            try:
                page.wait_for_selector(".tech-table", timeout=15000)
            except:
                print("⚠️ Tabela não carregou ou não há itens pendentes.")
            
            print("✅ Painel carregado. Iniciando processamento...")
            
            # --- LOOP DE PROCESSAMENTO (CONCILIAÇÃO) ---
            contador = 0
            while True:
                # Busca o primeiro botão 'Auditar' visível
                btn = page.query_selector("button.btn-action-tech")
                
                if not btn:
                    print("🏁 Todas as pendências visíveis foram resolvidas!")
                    break
                
                contador += 1
                print(f"⚡ Processando item #{contador}...")
                
                # 1. Clica no botão e abre o Modal
                btn.click()
                page.wait_for_selector(".modal-glass")
                
                # 2. "Lê" o Hash da tela (Simulando OCR)
                try:
                    texto_hash_container = page.text_content("label span") 
                    codigo_hash = texto_hash_container.split(":")[1].replace(")", "").strip()
                    print(f"   -> Hash Identificado: {codigo_hash}")
                except:
                    codigo_hash = "ERRO_LEITURA"
                    print("   -> Erro ao ler hash, tentando genérico...")

                # 3. Preenche o Formulário
                page.fill("input.input-highlight", codigo_hash) 
                page.fill("input[type='date']", time.strftime("%Y-%m-%d")) 
                
                # Seleciona o banco
                try:
                    page.select_option("select", label="Horizon Bank (Corp)")
                except:
                    page.select_option("select", index=1) 
                
                # 4. Faz Upload do Arquivo
                page.set_input_files("input[type='file']", caminho_pdf)
                
                time.sleep(0.5) 
                
                # 5. Salva
                page.click("button.btn-save-tech")
                
                # 6. Espera o modal fechar
                try:
                    page.wait_for_selector(".modal-glass", state="hidden", timeout=5000)
                    print("   -> Baixa efetuada com sucesso.")
                except:
                    print("   -> Erro: Modal não fechou. Verifique validação.")
                    page.keyboard.press("Escape")
                
                time.sleep(1)

        except Exception as e:
            print(f"❌ Erro na automação: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            browser.close()
            try:
                os.remove(caminho_pdf)
            except:
                pass
            
            # Limpa a fila no Firebase para evitar loop infinito
            try:
                db.reference(f'fila_automacao/{uid_usuario}').delete()
                print("🗑️ Tarefa concluída e fila limpa.")
            except:
                pass

# --- 3. LISTENER (ESCUTA FIREBASE) ---
def listener(event):
    if event.data: 
        # O event.path vem como /UID, removemos a barra
        uid_usuario = event.path.replace('/', '')
        
        # Ignora a raiz ou dados vazios
        if uid_usuario == 'fila_automacao' or not uid_usuario:
            return 
        
        dados = event.data
        # Verifica se é um dicionário com a ação esperada
        if isinstance(dados, dict) and 'acao' in dados:
             executar_robo(uid_usuario, dados)

print("👀 Aguardando novos pedidos na fila...")
# Inicia a escuta no nó raiz da fila
ref = db.reference('fila_automacao')
ref.listen(listener)