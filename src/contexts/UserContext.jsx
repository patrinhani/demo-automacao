import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  
  // DADOS REAIS (Vindos do Banco)
  const [realRole, setRealRole] = useState(null);
  const [realSetor, setRealSetor] = useState(null); // [NOVO] Guarda o setor verdadeiro

  // DADOS SIMULADOS (Para Testes/Dev)
  const [simulatedRole, setSimulatedRole] = useState(null);
  const [simulatedSetor, setSimulatedSetor] = useState(null); // [NOVO] Guarda o setor que estamos fingindo

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          
          const role = data?.role || 'colaborador';
          const setor = data?.setor || 'Indefinido'; // Lê o setor do banco

          // Define os dados reais
          setRealRole(role);
          setRealSetor(setor);
          
          // Se não estiver simulando nada, assume os dados reais
          setSimulatedRole((prev) => prev || role);
          setSimulatedSetor((prev) => prev || setor);
        });
      } else {
        setRealRole(null);
        setRealSetor(null);
        setSimulatedRole(null);
        setSimulatedSetor(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- FUNÇÕES DE TROCA (DEV TOOLS) ---
  const switchRole = (newRole) => setSimulatedRole(newRole);
  const switchSetor = (newSetor) => setSimulatedSetor(newSetor); // [NOVO] Função para trocar setor

  // --- REGRAS DE PERMISSÃO ---
  // O setor ativo é o simulado (se houver) ou o real
  const activeSetor = simulatedSetor || realSetor;

  const isAdmin = simulatedRole === 'admin';
  const isGestor = simulatedRole === 'gestor'; // Adicionado verificação de gestor
  const isDev = realRole === 'dev'; // Acesso ao painel Dev depende do cargo REAL

  // Helpers de Setor (Admin vê tudo de todos)
  const isFinanceiro = activeSetor === 'Financeiro' || isAdmin;
  const isRH = activeSetor === 'Recursos Humanos' || isAdmin;

  return (
    <UserContext.Provider value={{ 
      user, 
      realRole, 
      simulatedRole, 
      switchRole,
      
      // Exportando controles de setor
      realSetor,
      simulatedSetor,
      switchSetor,
      
      // Permissões calculadas
      isAdmin, 
      isGestor,
      isDev,
      userSetor: activeSetor, // O componente vai ler isso para saber qual setor mostrar
      isFinanceiro, 
      isRH 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);