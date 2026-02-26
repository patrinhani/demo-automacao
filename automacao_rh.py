import time
import requests
import getpass
import unicodedata
from playwright.sync_api import sync_playwright

# --- 1. CONFIGURAÇÃO PÚBLICA DO FIREBASE ---
API_KEY = "AIzaSyAo4nYPG-harTGiNiPkxXBH1sgZ4VY2-ao" 
DATABASE_URL = "https://techcorp-7abfc-default-rtdb.firebaseio.com"

# --- 2. AS 7 REGRAS OFICIAIS DE RH (SEM O ASSUNTO) ---
# Chaves em minúsculas e SEM acentos para garantir a correspondência exata
REGRAS_RH = {
    # CASO 1: Marcação Ímpar / Esquecimento / Ausência
    "impar": (
        "Olá!\n\n"
        "Identificamos uma marcação ímpar no seu espelho de ponto referente ao dia [DATA]. Isso significa que o sistema registrou sua entrada, mas não encontrou a saída (ou vice-versa).\n\n"
        "Por favor, verifique se houve esquecimento e realize o ajuste ou justificativa no sistema o quanto antes para evitar descontos ou inconsistências no fechamento.\n\n"
        "Atenciosamente,\n"
        "Equipe de RH"
    ),
    
    # CASO 2: Falta Injustificada
    "falta": (
        "Olá!\n\n"
        "Não identificamos nenhum registro de ponto no dia [DATA]. Caso tenha sido uma falta justificada, folga compensatória ou trabalho externo, por favor anexe o comprovante ou realize o ajuste manual no sistema.\n\n"
        "Se foi um esquecimento total das batidas, regularize sua situação imediatamente.\n\n"
        "Obrigado,\n"
        "Equipe de RH"
    ),
    
    # CASO 3: Intervalo Curto (< 1 Hora)
    "intervalo": (
        "Olá!\n\n"
        "Notamos que seu intervalo de almoço no dia [DATA] foi inferior a 1 hora (Mínimo legal). Lembre-se que, por lei e política da empresa, o intervalo de descanso deve ser respeitado integralmente. Evite retornar antes do tempo para não gerar passivo trabalhista.\n\n"
        "Atenciosamente,\n"
        "Equipe de RH"
    ),
    
    # CASO 4: Atraso Excessivo / Crítico
    "atraso": (
        "Olá!\n\n"
        "Identificamos um atraso superior à tolerância permitida (10 min) no dia [DATA].\n"
        "Caso tenha ocorrido algum problema de transporte ou imprevisto, favor justificar no campo de observação do ponto para avaliação do gestor.\n\n"
        "Obrigado,\n"
        "Equipe de RH"
    ),
    
    # CASO 5: Hora Extra Não Autorizada
    "extra": (
        "Olá!\n\n"
        "Verificamos que sua saída no dia [DATA] ocorreu muito após o horário contratual, gerando horas extras não planejadas.\n\n"
        "Lembramos que toda hora extra deve ser previamente alinhada e autorizada pelo gestor imediato. Favor alinhar com sua liderança.\n\n"
        "Atenciosamente,\n"
        "Equipe de RH"
    ),
    
    # CASO 6: Batida Duplicada
    "duplicad": (
        "Olá!\n\n"
        "O sistema identificou registros duplicados no seu ponto do dia [DATA] (Ex: Bateu entrada duas vezes seguidas).\n\n"
        "Por gentileza, solicite a desconsideração/exclusão da marcação incorreta via sistema para que o cálculo de horas do dia fique correto.\n\n"
        "Obrigado,\n"
        "Equipe de RH"
    ),
    
    # CASO 7: Ponto Britânico (Horários Idênticos)
    "britanico": (
        "Olá!\n\n"
        "Notamos que seus registros de ponto estão idênticos por vários dias consecutivos (Ex: Entrando exatamente às 08:00 e saindo exatamente às 17:00).\n\n"
        "O Ministério do Trabalho exige a variação real dos minutos (Ponto Real). Por favor, atente-se para registrar o ponto no momento exato que iniciar/terminar suas atividades, evitando anotações artificiais.\n\n"
        "Atenciosamente,\n"
        "Equipe de RH"
    )
}

# Mapeamento extra sem acentos para a regra 7
REGRAS_RH["identico"] = REGRAS_RH["britanico"]
REGRAS_RH["invariavel"] = REGRAS_RH["britanico"]
# Adicionando uma variação extra para o caso 1 para garantir
REGRAS_RH["marcacao impar"] = REGRAS_RH["impar"]

# --- 3. MOTOR DE AUTOMAÇÃO (PLAYWRIGHT) ---
def executar_robo_rh(uid_usuario, dados_pedido, email_digitado, senha_digitada, id_token):
    print(f"\n🚀 INICIAR FLUXO RPA (Auditoria de Ponto e Cobrança no Chat)...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, channel="msedge", args=['--start-maximized'])
        context = browser.new_context(no_viewport=True)
        page_erp = context.new_page()

        try:
            # ==========================================
            # PASSO 1: LOGIN NO SISTEMA
            # ==========================================
            print("🔐 A aceder ao Portal ERP...")
            page_erp.goto("https://demo-automacao.vercel.app/") 
            
            page_erp.wait_for_selector("input[type='email']", timeout=15000)
            page_erp.locator("input[type='email']").click()
            page_erp.locator("input[type='email']").fill(email_digitado)
            
            page_erp.locator("input[type='password']").click()
            page_erp.locator("input[type='password']").fill(senha_digitada)
            
            page_erp.click("button[type='submit']")
            page_erp.wait_for_url("**/dashboard", timeout=15000)
            time.sleep(1)

            # ==========================================
            # PASSO 2: AUDITORIA NA FOLHA DE PONTO
            # ==========================================
            print("⏰ A navegar direto para o módulo de Folha de Ponto...")
            page_erp.goto("https://demo-automacao.vercel.app/folha-ponto")
            page_erp.wait_for_selector(".toggle-btn:has-text('Gestão RH')", timeout=10000)
            
            contador = 0
            while True:
                page_erp.click(".toggle-btn:has-text('Gestão RH')")
                time.sleep(1)
                
                linha_alvo = page_erp.query_selector("tr:has(button.btn-chamar)")
                
                if not linha_alvo:
                    print("\n🏁 Auditoria Finalizada: Não há mais inconsistências para cobrar!")
                    break
                    
                contador += 1
                try:
                    print(f"\n==============================================")
                    print(f"🔄 A INICIAR COBRANÇA DO CASO #{contador}")
                    
                    nome_colab = linha_alvo.query_selector(".user-info-modern strong").inner_text().strip()
                    tipo_erro_ui = linha_alvo.query_selector(".erro-badge").inner_text().strip()
                    data_erro_ui = linha_alvo.query_selector(".date-badge").inner_text().strip()
                    
                    print(f"👤 Colaborador: {nome_colab} | ⚠️ Ocorrência: {tipo_erro_ui} | 📅 Data: {data_erro_ui}")
                    
                    # 1. Tratamento avançado de texto: Remove acentos e converte para minúsculas
                    erro_normalizado = unicodedata.normalize('NFKD', tipo_erro_ui).encode('ASCII', 'ignore').decode('utf-8').lower()
                    mensagem_oficial = "Por favor, acesse o sistema e justifique sua inconsistência referente ao dia [DATA]." # Fallback
                    
                    for palavra_chave, texto_regra in REGRAS_RH.items():
                        if palavra_chave in erro_normalizado:
                            mensagem_oficial = texto_regra
                            break
                    
                    # 2. Substitui a data real da interface
                    mensagem_oficial = mensagem_oficial.replace("[DATA]", data_erro_ui)
                    
                    print("🤖 A abrir o Chat Interno com o colaborador...")
                    linha_alvo.query_selector("button.btn-chamar").click()
                    page_erp.wait_for_url("**/chat", timeout=10000)
                    time.sleep(2)
                    
                    print("💬 A colar a mensagem exata no chat...")
                    entrada_chat = page_erp.locator("input[type='text'], textarea").last
                    entrada_chat.click()
                    
                    # Cola o texto íntegro instantaneamente
                    entrada_chat.fill(mensagem_oficial) 
                    time.sleep(1)
                    page_erp.keyboard.press("Enter")
                    time.sleep(2)
                    
                    print(f"✅ Notificação enviada com sucesso!")
                    
                    print("⏳ A aguardar simulação de correção do colaborador...")
                    resp = requests.get(f"{DATABASE_URL}/rh/erros_ponto.json?auth={id_token}")
                    erros_db = resp.json()
                    
                    for colab_id, dados_erro in erros_db.items():
                        if dados_erro.get('nome') == nome_colab and dados_erro.get('status') != 'Respondido':
                            patch_data = {"status": "Respondido"}
                            # Resolve os pontos com base no tipo de erro original
                            if "atraso" not in erro_normalizado and "falta" not in erro_normalizado:
                                patch_data["pontos"] = {"e": "08:00", "si": "12:00", "vi": "13:00", "s": "17:00"}
                            requests.patch(f"{DATABASE_URL}/rh/erros_ponto/{colab_id}.json?auth={id_token}", json=patch_data)
                            break
                    time.sleep(1.5)

                    print("↩️ A regressar ao painel de Auditoria...")
                    page_erp.goto("https://demo-automacao.vercel.app/folha-ponto")
                    time.sleep(2)

                except Exception as loop_err:
                    print(f"⚠️ Erro ao processar colaborador: {loop_err}")
                    page_erp.goto("https://demo-automacao.vercel.app/folha-ponto")
                    time.sleep(2)
                    continue

        except Exception as main_err:
            print(f"❌ Erro Crítico no Robô: {main_err}")
        finally:
            browser.close()
            try:
                requests.delete(f"{DATABASE_URL}/fila_automacao_rh/{uid_usuario}.json?auth={id_token}")
            except:
                pass

# --- 4. AUTENTICAÇÃO SEGURA (API REST) ---
if __name__ == "__main__":
    print("\n====================================================")
    print("👔 BEM-VINDO AO SEU ASSISTENTE DE RH PESSOAL")
    print("====================================================")

    meu_email = input("Digite o seu E-mail do Portal (Gestor/RH): ").strip()
    minha_senha = getpass.getpass("Digite a sua Palavra-passe oculta: ").strip()

    print("\n🔍 A validar credenciais no sistema...")
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    resposta_auth = requests.post(auth_url, json={"email": meu_email, "password": minha_senha, "returnSecureToken": True})
    dados_auth = resposta_auth.json()

    if "error" in dados_auth:
        print(f"❌ Erro de Login: Palavra-passe ou e-mail incorretos.")
        exit()

    meu_uid = dados_auth["localId"]
    id_token = dados_auth["idToken"]
    print(f"✅ Utilizador autenticado com sucesso!")

    # --- 5. GESTÃO DE FILA SIMPLIFICADA ---
    print(f"\n👀 O seu Robô de Recursos Humanos está LIGADO.")
    print("A aguardar ordens de Auditoria do Portal...\n")

    url_fila = f"{DATABASE_URL}/fila_automacao_rh/{meu_uid}.json"

    try:
        while True:
            try:
                resposta_fila = requests.get(f"{url_fila}?auth={id_token}")
                dados_fila = resposta_fila.json()

                if dados_fila and isinstance(dados_fila, dict) and dados_fila.get('acao') == 'ANALISAR_INCONSISTENCIAS_PONTO':
                    executar_robo_rh(meu_uid, dados_fila, meu_email, minha_senha, id_token)
                    print("\n👀 A aguardar novas ordens...")
                    
            except requests.exceptions.RequestException:
                pass 
                
            time.sleep(3)
            
    except KeyboardInterrupt:
        print("\n🛑 Robô desligado manualmente.")