import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  
  // --- PERMISSÕES ---
  const [realRole, setRealRole] = useState(null);       
  const [simulatedRole, setSimulatedRole] = useState(null);
  const [realSetor, setRealSetor] = useState(null);
  const [simulatedSetor, setSimulatedSetor] = useState(null);
  
  // --- IDENTIDADE ---
  const [uidAtivo, setUidAtivo] = useState(null); 
  const [simulatedName, setSimulatedName] = useState(null); 
  const [dbName, setDbName] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      
      // --- LÓGICA DE DETECÇÃO (ROBÔ VS HUMANO) ---
      const params = new URLSearchParams(window.location.search);
      const targetUid = params.get('target_uid');
      const donoNome = params.get('dono');
      
      let usuarioFinal = currentUser;
      let isRoboMode = false;

      // CASO 1: Navegador do Python (Sem Login, mas com URL Mágica)
      // Se não tem login real, mas tem a URL, criamos um "Usuário Virtual"
      if (!currentUser && targetUid) {
          console.log("🤖 MODO BYPASS: Robô detectado (Acesso sem senha)");
          usuarioFinal = {
              uid: targetUid,
              email: 'robo-auto@tech.com',
              displayName: donoNome ? `🤖 Robô de ${donoNome}` : '🤖 Robô Automático',
              photoURL: null,
              isAnonymous: true
          };
          isRoboMode = true;
      } 
      // CASO 2: Login Manual com a conta de Demo
      else if (currentUser && currentUser.email === 'demo@tech.com' && targetUid) {
          isRoboMode = true;
      }

      setUser(usuarioFinal);
      
      if (usuarioFinal) {
        // --- CONFIGURAÇÃO DO ROBÔ ---
        if (isRoboMode) {
            setUidAtivo(targetUid); 
            const nomeRobo = donoNome ? `🤖 Robô de ${donoNome}` : '🤖 Robô Automático';
            setSimulatedName(nomeRobo);

            // Robô ganha permissão total de Financeiro para operar
            setRealRole('gestor');
            setSimulatedRole('gestor');
            setRealSetor('Financeiro');
            setSimulatedSetor('Financeiro');
            
            setDbName(null); 
        } 
        // --- CONFIGURAÇÃO DE USUÁRIO NORMAL ---
        else {
            setUidAtivo(usuarioFinal.uid); 
            setSimulatedName(null);

            // Busca dados reais no banco
            const userRef = ref(db, `users/${usuarioFinal.uid}`);
            onValue(userRef, (snapshot) => {
              const data = snapshot.val();
              
              const dbRole = data?.role || 'colaborador'; 
              const dbSetor = data?.setor || 'Geral';
              const nomeNoBanco = data?.nome; 

              setRealRole(dbRole);
              setRealSetor(dbSetor);
              if (nomeNoBanco) setDbName(nomeNoBanco);

              setSimulatedRole((prev) => prev || dbRole);
              setSimulatedSetor((prev) => prev || dbSetor);
            });
        }

      } else {
        // Logout Total
        setRealRole(null);
        setSimulatedRole(null);
        setRealSetor(null);
        setSimulatedSetor(null);
        setUidAtivo(null);
        setSimulatedName(null);
        setDbName(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- FUNÇÕES DEV ---
  const switchProfile = (preset) => {
    switch (preset) {
        case 'admin': setSimulatedRole('admin'); setSimulatedSetor('Tecnologia'); break;
        case 'financeiro': setSimulatedRole('gestor'); setSimulatedSetor('Financeiro'); break;
        case 'rh': setSimulatedRole('gestor'); setSimulatedSetor('RH'); break;
        case 'colaborador': setSimulatedRole('colaborador'); setSimulatedSetor('Geral'); break;
        default: break;
    }
  };
  
  const switchRole = (role) => setSimulatedRole(role); 

  // --- FLAGS DE ACESSO ---
  const isAdmin = simulatedRole === 'admin';
  const isGestor = simulatedRole === 'gestor' || isAdmin;
  const isDev = realRole === 'dev' || realRole === 'admin'; 
  const isFinanceiro = simulatedSetor === 'Financeiro' || isAdmin;
  const isRH = simulatedSetor === 'RH' || isAdmin;

  // Prioridade de Nome: Simulado > Banco > Login > Fallback
  const displayNameFinal = simulatedName || dbName || user?.displayName || "Usuário";
  const userComMascara = user ? { ...user, displayName: displayNameFinal } : null;

  return (
    <UserContext.Provider value={{ 
      user: userComMascara, 
      uidAtivo, 
      realRole, simulatedRole, 
      realSetor, simulatedSetor,
      switchRole, switchProfile, 
      isAdmin, isDev, isFinanceiro, isRH, isGestor,
      userSetor: simulatedSetor 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);