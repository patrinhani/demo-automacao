import firebase_admin
from firebase_admin import credentials, db
from playwright.sync_api import sync_playwright
import time

# --- 1. CONFIGURAÇÃO ---
# Certifique-se de que o arquivo 'serviceAccountKey.json' está na mesma pasta
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://techcorp-7abfc-default-rtdb.firebaseio.com/'
    })
    print("✅ Conectado ao Firebase! Aguardando o clique do botão...")
except Exception as e:
    print(f"❌ Erro de conexão: {e}")
    exit()

# --- 2. FUNÇÃO QUE ABRE O NAVEGADOR ---
def abrir_navegador_teste(nome_usuario):
    print(f"\n🚀 COMANDO RECEBIDO! Iniciando Playwright para: {nome_usuario}")
    
    with sync_playwright() as p:
        # headless=False -> O navegador aparece na tela (OBRIGATÓRIO PARA A DEMO)
        print("   -> Abrindo Chromium...")
        browser = p.chromium.launch(headless=False)
        
        context = browser.new_context()
        page = context.new_page()
        
        # Acessa uma página qualquer só para mostrar que está vivo
        print("   -> Carregando página...")
        page.goto("https://www.google.com") 
        
        # Desenha uma borda vermelha na página (Efeito Visual)
        page.evaluate("document.body.style.border = '10px solid red'")
        print("   -> 📸 Navegador aberto e visível!")
        
        # Mantém aberto por 5 segundos para você ver
        for i in range(5, 0, -1):
            print(f"   -> Fechando em {i}...")
            time.sleep(1)
            
        browser.close()
        print("✅ Teste concluído com sucesso.\n")
        print("👀 Aguardando próximo clique...")

# --- 3. LOOP QUE VIGIA O BOTÃO ---
def ouvir_fila():
    ref_fila = db.reference('fila_automacao')
    
    # Limpa a fila ao iniciar para não processar cliques velhos
    ref_fila.set({}) 
    
    print("   (Mantenha esta janela aberta e clique no botão 'Processar Tudo Agora' no site)")
    
    while True:
        # Lê a fila
        pedidos = ref_fila.get()
        
        if pedidos:
            updates = {}
            for uid, dados in pedidos.items():
                # CHAMA A FUNÇÃO QUE ABRE O NAVEGADOR
                abrir_navegador_teste(dados.get('nome', 'Usuário'))
                
                # Remove o pedido da fila imediatamente
                updates[f"fila_automacao/{uid}"] = None
                
            if updates:
                db.reference().update(updates)
        
        time.sleep(0.5) # Verifica a cada meio segundo (resposta rápida)

if __name__ == "__main__":
    ouvir_fila()