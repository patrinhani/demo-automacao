import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo'; 

export default function PortalCliente() {
  const navigate = useNavigate();
  
  // Estado para controlar o Popup de Erro
  const [erroLogin, setErroLogin] = useState(false);

  // Função disparada ao tentar logar
  const handleLogin = (e) => {
    e.preventDefault();
    setErroLogin(true); // Exibe o popup independentemente do que foi digitado
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: '#0f172a',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Luzes de Fundo */}
      <div style={{position: 'absolute', top: '-10%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, #3b82f6, transparent 70%)', opacity: 0.3, borderRadius: '50%', filter: 'blur(80px)'}}></div>
      <div style={{position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, #8b5cf6, transparent 70%)', opacity: 0.3, borderRadius: '50%', filter: 'blur(80px)'}}></div>

      {/* --- POPUP DE ERRO (MODAL) --- */}
      {erroLogin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.7)', // Fundo escuro para focar no erro
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setErroLogin(false)}>
          
          <div style={{
            background: '#1e293b',
            border: '2px solid #ef4444', // Borda Vermelha (Erro)
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)', // Glow Vermelho
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '350px',
            width: '90%',
            animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' // Efeito de "pulo"
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{fontSize: '3rem', marginBottom: '15px'}}>🚫</div>
            
            <h3 style={{color: '#ef4444', margin: '0 0 10px 0', fontSize: '1.5rem'}}>Acesso Negado</h3>
            
            <p style={{color: '#cbd5e1', lineHeight: '1.5', marginBottom: '25px'}}>
              As credenciais informadas estão incorretas ou você não possui permissão de acesso a este painel.
            </p>

            <button 
              onClick={() => setErroLogin(false)}
              style={{
                background: '#ef4444', 
                color: 'white', 
                border: 'none', 
                padding: '12px 30px', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                transition: '0.2s',
                width: '100%'
              }}
              onMouseOver={(e) => e.target.style.background = '#dc2626'}
              onMouseOut={(e) => e.target.style.background = '#ef4444'}
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* --- CARD DE LOGIN --- */}
      <div style={{
        zIndex: 1,
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(10px)',
        padding: '40px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{transform: 'scale(1.5)', marginBottom: '30px', display: 'flex', justifyContent: 'center'}}>
           <Logo />
        </div>
        
        <h2 style={{margin: '0 0 10px 0', fontSize: '1.5rem'}}>Portal do Cliente</h2>
        <p style={{color: '#94a3b8', marginBottom: '30px'}}>Área restrita para clientes TechCorp.</p>

        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="E-mail Corporativo" 
            style={{width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box'}}
          />
          <input 
            type="password" 
            placeholder="Senha de Acesso" 
            style={{width: '100%', padding: '12px', marginBottom: '25px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box'}}
          />
          <button style={{width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px', transition: '0.2s'}}>
            Acessar Painel
          </button>
        </form>

        <div 
          onClick={() => navigate('/comunicacao')} 
          style={{fontSize: '0.85rem', color: '#64748b', cursor: 'pointer', textDecoration: 'underline'}}
        >
          ← Voltar para o mural de avisos
        </div>
      </div>
      
      {/* Estilos globais de animação para este componente */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}