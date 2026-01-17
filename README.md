<div align="center">

  # ⚡ Demo Automação
  
  ### Simulação de Intranet Corporativa para Testes de Automação

  ![Status do Projeto](https://img.shields.io/badge/STATUS-EM_DESENVOLVIMENTO-00ff00?style=for-the-badge&logo=statuspage&logoColor=black)
  ![Licença](https://img.shields.io/badge/LICENSE-MIT-blue?style=for-the-badge&logo=open-source-initiative&logoColor=white)

  <p align="center">
    <a href="#-sobre">Sobre</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    <a href="#-tecnologias">Tecnologias</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    <a href="#-funcionalidades">Funcionalidades</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
    <a href="#-como-rodar">Como Rodar</a>
  </p>
</div>

---

## 💻 Sobre

O **Demo Automação** é uma aplicação web desenvolvida para simular um **Portal Corporativo (Intranet)**. O objetivo principal deste projeto é servir como um ambiente controlado ("sandbox") para o desenvolvimento, teste e demonstração de scripts de **RPA (Robotic Process Automation)** e automação web.

A aplicação apresenta cenários complexos propositais — como formulários dinâmicos, elementos que dependem de tempo e componentes interativos — para desafiar e validar robôs de automação.

---

## 🚀 Tecnologias

O projeto foi construído com uma stack moderna, focada em performance e componentização:

<div align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=react,vite,firebase,css,html,js&theme=dark" />
  </a>
</div>

- **React**: Biblioteca principal para construção da interface.
- **Vite**: Build tool para desenvolvimento rápido e otimizado.
- **Firebase**: Backend-as-a-Service para autenticação e banco de dados em tempo real.
- **CSS Modules**: Estilização modular para componentes isolados.

---

## ✨ Funcionalidades (Módulos)

A aplicação é dividida em módulos que simulam processos reais de uma empresa:

### 1. 💰 Solicitação de Reembolso
Um formulário complexo para envio de despesas.
- **Desafio de Automação**: Uso de *Uncontrolled Components* e manipulação direta do DOM, exigindo que o robô interaja com elementos nativos e uploads de arquivos.

### 2. 🧾 Gerador de Notas Fiscais
Módulo para emissão e download de documentos simulados.
- **Desafio de Automação**: Interceptação de downloads e validação de arquivos PDF gerados dinamicamente.

### 3. ⏰ Espelho de Ponto
Sistema interativo de registro de ponto com relógio em tempo real.
- **Desafio de Automação**: Sincronização com elementos de tempo real e validação de registros de entrada/saída.

### 4. 🆔 Carteirinha Digital
Componente visual com efeito 3D (Flip).
- **Desafio de Automação**: Leitura de dados em elementos que sofrem transformações CSS (rotação/ocultação) e extração de dados visuais.

### 5. 🆘 Central de Serviços (Helpdesk)
Painel para abertura e acompanhamento de chamados de TI.
- **Desafio de Automação**: Fluxos de navegação multi-etapas e gerenciamento de estado de tickets.

---

## 📷 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Dashboard+Principal" alt="Dashboard Preview" width="700px" style="border-radius: 10px; box-shadow: 0px 0px 20px rgba(0,0,0,0.5);">
</div>

---

## 🔧 Como Rodar

Siga os passos abaixo para executar o projeto localmente:

### Pré-requisitos
* Node.js instalado (v16 ou superior)
* Gerenciador de pacotes (npm ou yarn)

### Passo a Passo

