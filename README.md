<div align="center">

  # ⚡ Demo Automação
  
  ### Sandbox Corporativo para Testes de RPA e QA

  ![Status](https://img.shields.io/badge/STATUS-ATIVO-00ff00?style=for-the-badge&logo=statuspage&logoColor=black)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)

  <p align="center">
    <a href="#-sobre">Sobre</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    <a href="#-tecnologias">Tecnologias</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    <a href="#-funcionalidades">Módulos & Desafios</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    <a href="#-devtools">DevTools</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    <a href="#-como-rodar">Como Rodar</a>
  </p>
</div>

---

## 💻 Sobre

O **Demo Automação** é um ambiente simulado de **Portal Corporativo (Intranet) e Banco Digital** desenvolvido para desafiar engenheiros de QA e desenvolvedores de RPA (Robotic Process Automation).

Diferente de sites de treino estáticos, esta aplicação possui **persistência de dados em tempo real**, fluxos assíncronos complexos e elementos dinâmicos, simulando cenários reais de:
* 🏢 **RH & Departamento Pessoal** (Folha de ponto, Férias, Holerite)
* 🏦 **Banco Digital** (Extrato, Transferências, Validação de Saldo)
* ⚙️ **Gestão Corporativa** (Aprovações, Reembolsos, Helpdesk)
* 🛠️ **Fábrica de Dados** (Geração de massa de dados para testes)

---

## 🚀 Tecnologias

O projeto utiliza uma stack moderna para criar desafios de automação reais (Shadow DOM, Canvas/SVG, iFrames simulados, Download de arquivos):

<div align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=react,vite,firebase,css,html,js,git&theme=dark" />
  </a>
</div>

**Bibliotecas Chave para Automação:**
- **Firebase Realtime Database**: Persistência de dados instantânea (Desafio: Sincronização de testes).
- **ExcelJS & File-Saver**: Geração de relatórios `.xlsx` no frontend (Desafio: Validação de download e conteúdo de Excel).
- **JSPDF**: Geração dinâmica de comprovantes e holerites em PDF (Desafio: Leitura e extração de texto em PDF).
- **Recharts**: Gráficos renderizados via SVG (Desafio: Extração de dados visuais).
- **Framer Motion**: Animações de interface (Desafio: Lidar com *waits* e elementos em movimento).

---

## ✨ Funcionalidades (Módulos)

### 🛠️ DevTools (Fábrica de Dados)
Painel administrativo para controle total do ambiente de teste.
- **Funcionalidade**: Gerar ou limpar massa de dados instantaneamente (Usuários, Viagens, Ponto, Chamados).
- **Cenário RPA**: O robô deve acessar `/devtools` para preparar o estado do banco (Data Seeding) antes de iniciar os testes.

### 🏦 Banco Digital Simulado
Módulo financeiro isolado com autenticação própria.
- **Funcionalidades**: Login seguro, extrato com filtros, botões "olho" para ocultar saldo.
- **Desafios RPA**: 
    - Quebra de elementos de segurança visual.
    - Validação de cálculos em tabelas dinâmicas.
    - Download de extrato para conciliação bancária.

### 👥 Portal RH Completo
Simula o ciclo de vida do colaborador.
- **Folha de Ponto**: Registro de entrada/saída com bloqueio lógico (não permite bater ponto futuro).
- **Holerite**: Geração e impressão de documento PDF.
- **Férias & Carreira**: Formulários com Datepickers complexos e validação de regras de negócio.

### 💬 Comunicação & Chat
Sistema de mensageria em tempo real.
- **Funcionalidades**: Chat setorizado e direto.
- **Desafio RPA**: Monitorar o DOM (MutationObserver) para detectar novas mensagens sem recarregar a página e interagir com *popups* de notificação.

### 🆘 Central de Serviços (Helpdesk)
Sistema de tickets de TI.
- **Funcionalidades**: Abertura, acompanhamento e SLA de chamados.
- **Desafio RPA**: Fluxo de status (Pendente -> Em Andamento -> Concluído).

---

## 🔧 Como Rodar

Siga os passos abaixo para executar o projeto localmente:

### Pré-requisitos
* Node.js instalado (v18 ou superior)
* Gerenciador de pacotes (npm ou yarn)

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone [https://github.com/seu-usuario/demo-automacao.git](https://github.com/seu-usuario/demo-automacao.git)
   cd demo-automacao
Instale as dependências

Bash
npm install
# Instale dependências extras se necessário
npm install exceljs file-saver jspdf recharts firebase framer-motion
Configure o Ambiente (Firebase) Crie um arquivo .env na raiz do projeto com suas credenciais:

Fragmento do código
VITE_FIREBASE_API_KEY="sua-api-key"
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="[https://seu-projeto-default-rtdb.firebaseio.com](https://seu-projeto-default-rtdb.firebaseio.com)"
VITE_FIREBASE_PROJECT_ID="seu-projeto-id"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="seu-sender-id"
VITE_FIREBASE_APP_ID="seu-app-id"
Inicie o servidor

Bash
npm run dev
Acesse: http://localhost:5173

<div align="center"> <sub>Projeto Open Source para a comunidade de QA e RPA.</sub> </div>
