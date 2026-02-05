import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [realRole, setRealRole] = useState(null);       
  const [simulatedRole, setSimulatedRole] = useState(null);
  
  // --- ESTES SÃO OS CAMPOS QUE FALTAM SE O BOTÃO NÃO APARECE ---
  const [uidAtivo, setUidAtivo] = useState(null); 
  const [simulatedName, setSimulatedName] = useState(null); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // --- LÓGICA DO ROBÔ ---
        const params = new URLSearchParams(window.location.search);
        const targetUid = params.get('target_uid');
        const donoNome = params.get('dono');
        
        // Verifica se é o Robô
        const isRobo = currentUser.email === 'demo@tech.com'; 

        if (isRobo && targetUid) {
            console.log("🤖 Contexto: MODO ROBÔ ATIVADO para", targetUid);
            setUidAtivo(targetUid); 
            if (donoNome) setSimulatedName(`🤖 Robô de ${donoNome}`);
        } else {
            // USUÁRIO NORMAL: O uidAtivo é o próprio ID
            setUidAtivo(currentUser.uid); 
            setSimulatedName(null);
        }

        // Busca permissões (Role)
        const userRef = ref(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          const role = data?.role || 'dev'; 
          setRealRole(role);
          setSimulatedRole((prev) => prev || role);
        });
      } else {
        // Reset total se deslogar
        setRealRole(null);
        setSimulatedRole(null);
        setUidAtivo(null);
        setSimulatedName(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const switchRole = (newRole) => {
    setSimulatedRole(newRole);
  };

  const isAdmin = simulatedRole === 'admin' || simulatedRole === 'gestor';
  const isDev = realRole === 'dev'; 
  const isFinanceiro = simulatedRole === 'financeiro' || isAdmin;
  const isRH = simulatedRole === 'rh' || isAdmin;

  // Máscara de nome
  const userComMascara = user ? { ...user, displayName: simulatedName || user.displayName } : null;

  return (
    <UserContext.Provider value={{ 
      user: userComMascara, 
      uidAtivo, // <--- GARANTA QUE ISTO ESTÁ AQUI
      realRole, simulatedRole, switchRole, 
      isAdmin, isDev, isFinanceiro, isRH 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);