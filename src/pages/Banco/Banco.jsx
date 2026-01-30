import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import BancoLogin from './BancoLogin';
import BancoDashboard from './BancoDashboard';
import BancoExtrato from './BancoExtrato';
import BancoCartoes from './BancoCartoes'; // <--- IMPORTADO
import './Banco.css'; 

export default function Banco() {
  const [contaUser, setContaUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [saldo, setSaldo] = useState(0);
  const [extrato, setExtrato] = useState([]);

  useEffect(() => {
    document.title = "Horizon Bank | Infinite";
    return () => document.title = "TechPortal";
  }, []);

  // Listener do Banco
  useEffect(() => {
    if (!contaUser) return;

    const bancoRef = ref(db, 'banco_mock');
    const unsubscribe = onValue(bancoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSaldo(Number(data.saldo || 0));
        if (data.transacoes) {
          const lista = Object.values(data.transacoes).sort((a, b) => new Date(b.data) - new Date(a.data));
          setExtrato(lista);
        } else {
          setExtrato([]);
        }
      } else {
        update(ref(db, 'banco_mock'), { saldo: 125000.00, transacoes: {} });
      }
    });

    return () => unsubscribe();
  }, [contaUser]);

  if (!contaUser) {
    return <BancoLogin onLoginSuccess={(dados) => setContaUser(dados)} />;
  }

  const isGestor = contaUser.accessLevel === 'admin' || contaUser.accessLevel === 'gestor';

  return (
    <div className="infinite-layout">
      <div className="aurora-bg"></div>

      <aside className="infinite-sidebar">
        <div className="brand-box">
          <div className="logo-circle">H</div>
          <span style={{fontWeight:600, letterSpacing:'2px', fontSize:'1.2rem'}}>HORIZON</span>
        </div>
        
        <nav className="infinite-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <span className="icon">📊</span> Visão Geral
          </button>
          
          <button className={activeTab === 'extrato' ? 'active' : ''} onClick={() => setActiveTab('extrato')}>
            <span className="icon">💳</span> Extrato
          </button>
          
          {isGestor && (
            <button className={activeTab === 'invest' ? 'active' : ''} onClick={() => alert("Módulo de Investimentos (Admin)")}>
              <span className="icon">📈</span> Investimentos
            </button>
          )}

          <button className={activeTab === 'cards' ? 'active' : ''} onClick={() => setActiveTab('cards')}>
            <span className="icon">🔒</span> Cartões
          </button>
        </nav>

        <div className="sidebar-footer-infinite">
          <div className="user-profile-mini">
            <div className="avatar">{contaUser.nome[0]}</div>
            <div className="info">
              <strong>{contaUser.nome.split(' ')[0]}</strong>
              <small style={{color:'#f59e0b'}}>{contaUser.cargo}</small>
            </div>
          </div>
          <button className="btn-logout-infinite" onClick={() => window.close()}>Sair</button>
        </div>
      </aside>

      <main className="infinite-main">
        <header className="main-header-infinite">
          <h1>Olá, {contaUser.nome.split(' ')[0]}</h1>
          <div className="header-actions">
            <span className="date-badge">{new Date().toLocaleDateString()}</span>
            <button className="btn-notif">🔔</button>
          </div>
        </header>

        <div className="content-area fade-in-up">
          {activeTab === 'dashboard' && (
            <BancoDashboard 
              saldo={saldo} 
              accessLevel={contaUser.accessLevel} 
              onNavigate={setActiveTab} 
            />
          )}
          
          {activeTab === 'extrato' && (
            <BancoExtrato extrato={extrato} saldo={saldo} />
          )}

          {/* RENDERIZAÇÃO DA TELA DE CARTÕES */}
          {activeTab === 'cards' && (
             <BancoCartoes accessLevel={contaUser.accessLevel} />
          )}
        </div>
      </main>
    </div>
  );
}