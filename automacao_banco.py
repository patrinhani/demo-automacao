import firebase_admin
from firebase_admin import credentials, db
from playwright.sync_api import sync_playwright
import time
import random
from datetime import datetime

# --- CONFIGURAÇÃO ---
# Se ainda não configurou a chave, baixe o JSON no console do Firebase
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://techcorp-7abfc-default-rtdb.firebaseio.com/'
})

def destacar_elemento(page, seletor):
    """
    Truque visual: Desenha uma borda vermelha no elemento 
    para a plateia ver o que o robô está focando.
    """
    try:
        page.evaluate(f"""
            document.querySelector('{seletor}').style.border = '5px solid red';
            document.querySelector('{seletor}').style.backgroundColor = 'yellow';
        """)
        time.sleep(0.5) # Pausa dramática para verem o destaque
    except:
        pass

def executar_robo_visual(uid_solicitante, nome_usuario):
    print(f"🎬 AÇÃO! Iniciando robô para: {nome_usuario}")
    
    with sync_playwright() as p:
        # headless=False FAZ O NAVEGADOR APARECER
        # slow_mo=1000 DEIXA TUDO MAIS LENTO (1s por ação) PARA A PLATEIA VER
        browser = p.chromium.launch(headless=False, slow_mo=1500)
        page = browser.new_page()
        
        # --- CENA 1: ACESSANDO O "SITE DO BANCO" ---
        # Como é demo, vamos usar um site de exemplo ou o Google para ilustrar
        print("   -> Acessando portal externo...")
        page.goto("https://www.saucedemo.com/") # Site de teste seguro e visual
        
        # --- CENA 2: LOGIN AUTOMATIZADO ---
        print("   -> Preenchendo credenciais...")
        page.fill("#user-name", "standard_user")
        destacar_elemento(page, "#user-name")
        
        page.fill("#password", "secret_sauce")
        destacar_elemento(page, "#password")
        
        print("   -> Clicando em entrar...")
        destacar_elemento(page, "#login-button")
        page.click("#login-button")
        
        # --- CENA 3: "EXTRAINDO DADOS" ---
        print("   -> Coletando informações financeiras...")
        # Simula o robô escolhendo um produto/valor
        item = page.wait_for_selector(".inventory_item_name")
        destacar_elemento(page, ".inventory_item_name")
        nome_produto = item.inner_text()
        
        preco_el = page.wait_for_selector(".inventory_item_price")
        destacar_elemento(page, ".inventory_item_price")
        preco_texto = preco_el.inner_text() # Ex: $29.99
        
        # Limpa o texto para virar numero
        valor_final = float(preco_texto.replace("$", "")) * 100 
        
        print(f"   -> DADO EXTRAÍDO: {nome_produto} - Valor: {valor_final}")
        time.sleep(2) # Pausa final para aplausos
        
        browser.close()
        
        # Retorna o pacote de dados para o Firebase
        return {
            "data": datetime.now().isoformat(),
            "historico": f"Compra: {nome_produto} (Automação Web)",
            "documento": f"NF-{random.randint(100,999)}",
            "valor": -valor_final, # Negativo pois é gasto
            "tipo": "D",
            "uid": uid_solicitante
        }

def ouvir_fila():
    print("👀 ROBÔ PRONTO! Aguardando clique no site...")
    print("   (Mantenha esta janela visível durante a apresentação)")
    
    ref_fila = db.reference('fila_automacao')
    
    while True:
        pedidos = ref_fila.get()
        if pedidos:
            updates = {}
            for uid, dados in pedidos.items():
                # 1. Executa o Teatro do Robô
                resultado = executar_robo_visual(uid, dados.get('nome', 'Usuário'))
                
                # 2. Salva o resultado (O site atualiza sozinho na tela)
                chave = f"tx_{int(time.time())}"
                updates[f"banco_mock/transacoes/{chave}"] = resultado
                
                # 3. Limpa a fila
                updates[f"fila_automacao/{uid}"] = None
                
            db.reference().update(updates)
            print("✅ Processo concluído com sucesso!")
        
        time.sleep(2)

if __name__ == "__main__":
    ouvir_fila()