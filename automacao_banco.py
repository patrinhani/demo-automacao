import firebase_admin
from firebase_admin import credentials, db
from playwright.sync_api import sync_playwright
import time
import urllib.parse
import os

# --- CONFIGURAÇÃO ---
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    # Verifica se já não foi inicializado antes de tentar conectar
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://techcorp-7abfc-default-rtdb.firebaseio.com/'
        })
    print("✅ Conectado ao Firebase! Aguardando o clique do botão...")
except Exception as e:
    print(f"❌ Erro de conexão: {e}")
    exit()

def abrir_navegador_teste(nome_usuario, uid_alvo):
    print(f"\n🚀 COMANDO RECEBIDO! Iniciando Playwright para: {nome_usuario}")
    
    with sync_playwright() as p:
        print("   -> Abrindo Chromium...")
        # headless=False para você ver o navegador abrindo
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        nome_safe = urllib.parse.quote(nome_usuario)
        
        # --- URL CORRIGIDA: Apontando para a raiz (/) para manter os parâmetros ---
        link = f"http://localhost:5173/?auth_bypass=true&dono={nome_safe}&target_uid={uid_alvo}"
        
        print(f"   -> Acessando URL Mágica: {link}")
        page.goto(link) 
        
        try:
            # Espera 20 segundos para ver se entra na Dashboard
            page.wait_for_url("**/dashboard", timeout=20000)
            print("   -> 🔓 SUCESSO! Login realizado automaticamente.")
            
            # Navega para conciliação
            page.goto("http://localhost:5173/conciliacao")
            
            # Marca visual
            page.evaluate("document.body.style.border = '10px solid red'")
            print("   -> 📸 Navegador pronto na tela de Conciliação!")
            
            # Mantém aberto por 15 segundos para você celebrar
            time.sleep(15)
            
        except Exception as e:
            print("   -> ⚠️ O robô travou no login ou não achou a dashboard!")
            print(f"   -> Erro detalhado: {e}")
            time.sleep(20) # Deixa aberto pra você ler o erro na tela
            
        browser.close()
        print("✅ Fim da execução.\n")

def ouvir_fila():
    ref_fila = db.reference('fila_automacao')
    
    # Limpa a fila ao iniciar para não processar comandos antigos
    ref_fila.set({}) 
    print("👀 Aguardando clique no site...")
    
    while True:
        pedidos = ref_fila.get()
        if pedidos:
            updates = {}
            for uid, dados in pedidos.items():
                abrir_navegador_teste(dados.get('nome', 'Usuário'), uid)
                # Marca para remoção
                updates[f"fila_automacao/{uid}"] = None
            
            if updates:
                db.reference().update(updates)
        
        time.sleep(0.5)

if __name__ == "__main__":
    ouvir_fila()