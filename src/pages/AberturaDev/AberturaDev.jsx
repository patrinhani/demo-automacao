import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import Logo from '../../components/Logo';
import './AberturaDev.css';

export default function AberturaDev() {
  const navigate = useNavigate();
  // Puxamos o isDev para bloquear intrusos
  const { isDev, user } = useUser();
  const [bootSequence, setBootSequence] = useState(0);

  // Efeito de digitação/carregamento sequencial
  useEffect(() => {
    if (!isDev) return; // Se não for dev, nem roda a animação

    const timers = [
      setTimeout(() => setBootSequence(1), 1000),
      setTimeout(() => setBootSequence(2), 2500),
      setTimeout(() => setBootSequence(3), 4000),
      setTimeout(() => setBootSequence(4), 5000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isDev]);

  // Bloqueio de Segurança: Se não for Dev, redireciona na hora
  if (!isDev) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="abertura-layout">
      <div className="scanline"></div>
      
      <div className="terminal-container">
        <div className="logo-glitch">
          <Logo lightMode={true} size={1.5} />
        </div>
        
        <div className="terminal-lines">
          <p className="line">TechCorp Enterprise OS v2.4.1</p>
          <p className="line">Establishing secure connection...</p>
          
          {bootSequence >= 1 && <p className="line success">[OK] User Authentication Verified: {user?.displayName || 'DEV_MASTER'}</p>}
          {bootSequence >= 2 && <p className="line warning">[WAIT] Loading RPA Modules & Financial Mocks...</p>}
          {bootSequence >= 3 && <p className="line success">[OK] Database Synced. Systems Online.</p>}
          
          {bootSequence >= 4 && (
            <div className="start-sequence fade-in">
              <p className="system-ready">SYSTEM READY</p>
              <button className="btn-boot" onClick={() => navigate('/dashboard')}>
                INICIALIZAR DEMONSTRAÇÃO 🚀
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}