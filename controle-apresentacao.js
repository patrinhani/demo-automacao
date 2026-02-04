import 'dotenv/config'; 
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// Verifica se leu o arquivo .env (Debug)
if (!process.env.VITE_FIREBASE_API_KEY) {
  console.error("❌ ERRO: O arquivo .env não foi lido ou a chave VITE_FIREBASE_API_KEY não foi encontrada.");
  process.exit(1);
}

// Configuração corrigida com OS SEUS NOMES de variáveis
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL, // Importante para o Realtime Database
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Inicializa conexão
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const comando = process.argv[2]; 

async function alterarEstado() {
  const caminhoDemo = 'configuracoes_globais/modo_apresentacao';
  
  if (comando === 'on') {
    console.log("---------------------------------------------------");
    console.log("🟢 ATIVANDO MODO APRESENTAÇÃO...");
    await set(ref(db, caminhoDemo), true);
    console.log("   -> SUCESSO! Botões liberados para todos.");
    console.log("---------------------------------------------------");
  } else if (comando === 'off') {
    console.log("---------------------------------------------------");
    console.log("🔴 DESATIVANDO MODO APRESENTAÇÃO...");
    await set(ref(db, caminhoDemo), false);
    console.log("   -> SUCESSO! Botões ocultados.");
    console.log("---------------------------------------------------");
  } else {
    console.log("⚠️  Comando inválido. Use 'on' ou 'off'.");
  }
  
  process.exit();
}

alterarEstado();