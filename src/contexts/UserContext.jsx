import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [realRole, setRealRole] = useState(null);       // O que está no banco (imutável)
  const [simulatedRole, setSimulatedRole] = useState(null); // O que estamos fingindo ser

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Busca a role real no Firebase
        const userRef = ref(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          const role = data?.role || 'colaborador';
          setRealRole(role);
          
          // Se ainda não tiver role simulada, usa a real
          setSimulatedRole((prev) => prev || role);
        });
      } else {
        setRealRole(null);
        setSimulatedRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Função para forçar a troca de perfil (Apenas para Devs/Admins reais)
  const switchRole = (newRole) => {
    setSimulatedRole(newRole);
  };

  const isAdmin = simulatedRole === 'admin' || simulatedRole === 'gestor';
  const isDev = realRole === 'dev'; // A permissão de ver o painel Dev depende da role REAL

  return (
    <UserContext.Provider value={{ user, realRole, simulatedRole, switchRole, isAdmin, isDev }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);