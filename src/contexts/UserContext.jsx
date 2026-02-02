import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [realRole, setRealRole] = useState(null);       
  const [simulatedRole, setSimulatedRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          // Se não tiver role (banco limpo), assume 'dev' para não travar
          const role = data?.role || 'dev'; 
          setRealRole(role);
          setSimulatedRole((prev) => prev || role);
        });
      } else {
        setRealRole(null);
        setSimulatedRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const switchRole = (newRole) => {
    setSimulatedRole(newRole);
  };

  // --- PERMISSÕES ---
  // Admin vê tudo
  const isAdmin = simulatedRole === 'admin' || simulatedRole === 'gestor';
  const isDev = realRole === 'dev'; 

  // Financeiro: Quem é 'financeiro' OU 'admin'
  const isFinanceiro = simulatedRole === 'financeiro' || isAdmin;

  // RH: Quem é 'rh' OU 'admin'
  const isRH = simulatedRole === 'rh' || isAdmin;

  return (
    <UserContext.Provider value={{ 
      user, realRole, simulatedRole, switchRole, 
      isAdmin, isDev, isFinanceiro, isRH 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);