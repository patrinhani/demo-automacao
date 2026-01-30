import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { ref, get } from 'firebase/database';
import { useUser } from '../../contexts/UserContext'; // <--- IMPORTANTE: Para ler a simulação
import './Banco.css'; 

export default function BancoLogin({ onLoginSuccess }) {
  const { simulatedRole } = useUser(); // Pega o cargo simulado (Admin/Colaborador)
  
  const [operador, setOperador] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.currentUser?.email) {
      setOperador(auth.currentUser.email);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!operador || !senha) {
        setError("Preencha as credenciais.");
        setLoading(false);
        return;
    }

    const user = auth.currentUser;
    if (!user) { 
        setError("Sessão inválida."); 
        setLoading(false); 
        return; 
    }

    try {
      // 1. Tenta pegar do banco de dados real
      const snap = await get(ref(db, `users/${user.uid}`));
      const userData = snap.val();
      
      // 2. AQUI ESTÁ A CORREÇÃO:
      // Se tivermos um 'simulatedRole' (do DevTools), usamos ele.
      // Se não, usamos o do banco de dados.
      const roleFinal = simulatedRole || userData?.role || 'colaborador';
      
      const nomeFinal = userData?.nome || operador.split('@')[0];

      setTimeout(() => {
        onLoginSuccess({
          nome: nomeFinal,
          // Define o cargo visualmente baseado no role
          cargo: roleFinal === 'admin' ? "Gestor Financeiro (Master)" : "Analista Operacional",
          accessLevel: roleFinal, 
          conta: "99.201-X",
          empresa: "TECHCORP LTDA"
        });
      }, 1500);

    } catch (err) {
      setError("Erro de conexão.");
      setLoading(false);
    }
  };

  return (
    <div className="infinite-layout" style={{alignItems:'center', justifyContent:'center'}}>
      <div className="aurora-bg"></div>
      
      <div className="glass-card" style={{width:'400px', padding:'40px', display:'flex', flexDirection:'column', alignItems:'center', zIndex:10}}>
        
        <div className="logo-circle" style={{width:'60px', height:'60px', fontSize:'2rem', marginBottom:'20px'}}>H</div>
        <h2 style={{margin:'0 0 10px 0', fontWeight:'300', letterSpacing:'3px', fontSize:'1.8rem'}}>HORIZON</h2>
        <span style={{color:'#f59e0b', fontSize:'0.7rem', letterSpacing:'2px', marginBottom:'30px'}}>CORPORATE ACCESS</span>

        <form onSubmit={handleLogin} style={{width:'100%'}}>
            <div style={{marginBottom:'20px'}}>
                <label style={{display:'block', color:'#94a3b8', fontSize:'0.8rem', marginBottom:'8px'}}>OPERADOR</label>
                <input 
                  type="text" 
                  value={operador} 
                  onChange={(e) => setOperador(e.target.value)} 
                  className="search-input-bank" 
                  style={{width:'100%', boxSizing:'border-box', opacity:1}}
                  autoFocus 
                />
            </div>

            <div style={{marginBottom:'30px'}}>
                <label style={{display:'block', color:'#94a3b8', fontSize:'0.8rem', marginBottom:'8px'}}>SENHA</label>
                <input 
                  type="password" 
                  value={senha} 
                  onChange={(e) => setSenha(e.target.value)} 
                  className="search-input-bank" 
                  style={{width:'100%', boxSizing:'border-box'}} 
                  placeholder="••••••••" 
                  required 
                />
            </div>

            <button type="submit" className="btn-generate-infinite" disabled={loading} style={{marginTop:0}}>
                {loading ? 'Autenticando...' : 'ACESSAR CONTA'}
            </button>
        </form>
        {error && <p style={{color:'#f87171', fontSize:'0.9rem', marginTop:'20px', textAlign:'center'}}>{error}</p>}
      </div>
    </div>
  );
}