import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Realtime DB (Usado no CadastroUsuario)
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Firestore (Opcional, mas bom ter)

// --- CONFIGURAÇÃO EXPORTADA (Correção do erro) ---
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // Necessário para Realtime DB
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Exporta os serviços
export const auth = getAuth(app);
export const db = getDatabase(app); // Padronizado como Realtime Database (Correção)
export const firestore = getFirestore(app); // Exporta separado caso precise no futuro

export default app;