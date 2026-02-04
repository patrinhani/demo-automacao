// controle-apresentacao.js
import 'dotenv/config'; // <--- Isso carrega seu arquivo .env
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// Verifica se as chaves foram carregadas (Debug de segurança)
if (!process.env.VITE_API_KEY) {
  console.error("❌ ERRO: Não foi possível ler o arquivo .env");
  console.error("Dica: Verifique se o arquivo .env está na raiz do projeto.");
  process.exit(1);
}

// Configuração puxando direto do .env
const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Lê o comando do terminal (on ou off)
const comando = process.argv[2]; 

async function alterarEstado() {
  const caminhoDemo = 'configuracoes_globais/modo_apresentacao';
  
  if (comando === 'on') {
    console.log("---------------------------------------------------");
    console.log("🟢 ATIVANDO MODO APRESENTAÇÃO...");
    console.log("   -> Enviando sinal para todos os computadores conectados...");
    await set(ref(db, caminhoDemo), true);
    console.log("   -> SUCESSO! Botões de automação liberados.");
    console.log("---------------------------------------------------");
  } else if (comando === 'off') {
    console.log("---------------------------------------------------");
    console.log("🔴 DESATIVANDO MODO APRESENTAÇÃO...");
    await set(ref(db, caminhoDemo), false);
    console.log("   -> SUCESSO! Botões ocultados.");
    console.log("---------------------------------------------------");
  } else {
    console.log("⚠️  Comando inválido.");
    console.log("   Use: node controle-apresentacao.js on");
    console.log("   Ou:  node controle-apresentacao.js off");
  }
  
  // Encerra o script
  process.exit();
}

alterarEstado();