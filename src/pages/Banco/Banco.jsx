import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import { useUser } from '../../contexts/UserContext';
import BancoLogin from './BancoLogin';
import BancoDashboard from './BancoDashboard';
import BancoExtrato from './BancoExtrato';
import BancoCartoes from './BancoCartoes'; 
import './Banco.css'; 

export default function Banco() {
  const { isDev } = useUser(); 
  const [contaUser, setContaUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [saldo, setSaldo] = useState(0);
  const [extrato, setExtrato] = useState([]);

  useEffect(() => {
    document.title = "Horizon Bank | Secure";
    return () => document.title = "TechPortal";
  }, []);

  // --- LÓGICA DE DADOS INTELIGENTE ---
  useEffect(() => {
    if (!contaUser) return;

    const isCorporate = ['admin', 'gestor', 'financeiro'].includes(contaUser.accessLevel);

    if (isCorporate) {
      // --- PERFIL CORPORATIVO: LÊ DO FIREBASE (DADOS DA EMPRESA) ---
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
          update(ref(db, 'banco_mock'), { saldo: 850000.00, transacoes: {} });
        }
      });
      return () => unsubscribe();

    } else {
      // --- PERFIL COLABORADOR: DADOS PESSOAIS SIMULADOS (MOCK LOCAL) ---
      // O colaborador vê a "Conta Salário" dele
      setSaldo(3450.20); 
      setExtrato([
        { data: new Date().toISOString(), desc: "PIX ENVIADO - ALUGUEL", doc: "PIX-99", valor: -1800.00, tipo: "D" },
        { data: new Date().toISOString(), desc: "IFOOD *LUNCH", doc: "CART", valor: -45.90, tipo: "D" },
        { data: new Date().toISOString(), desc: "UBER TRIP", doc: "CART", valor: -22.50, tipo: "D" },
        { data: new Date().toISOString(), desc: "CREDITO SALÁRIO MENSAL", doc: "FOLHA", valor: 5200.00, tipo: "C" },
        { data: new Date().toISOString(), desc: "REEMBOLSO APROVADO #992", doc: "CORP", valor: 125.00, tipo: "C" },
      ]);
    }
  }, [contaUser]); // Recarrega se o usuário mudar o perfil no DevTools

  const simularPerfilBanco = (nivel) => {
    if (!contaUser) return;
    let novoCargo = 'Analista';
    if (nivel === 'admin') novoCargo = 'Diretor Financeiro';
    if (nivel === 'financeiro') novoCargo = 'Gerente de Contas';
    if (nivel === 'colaborador') novoCargo = 'Analista de Sistemas';
    
    setContaUser(prev => ({ ...prev, accessLevel: nivel, cargo: novoCargo }));
  };

  if (!contaUser) {
    return <BancoLogin onLoginSuccess={(dados) => setContaUser(dados)} />;
  }

  // Define permissões de visualização
  const isCorporateView = ['admin', 'gestor', 'financeiro'].includes(contaUser.accessLevel);

  return (
    <div className="infinite-layout">
      <div className="aurora-bg"></div>

      <aside className="infinite-sidebar">
        <div className="brand-box">
          <div className="logo-circle">H</div>
          <span style={{fontWeight:600, letterSpacing:'2px', fontSize:'1.2rem'}}>HORIZON</span>
        </div>
        
        <div className="account-type-badge">
          {isCorporateView ? 'CONTA EMPRESARIAL' : 'CONTA SALÁRIO'}
        </div>
        
        <nav className="infinite-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <span className="icon">📊</span> Visão Geral
          </button>
          
          <button className={activeTab === 'extrato' ? 'active' : ''} onClick={() => setActiveTab('extrato')}>
            <span className="icon">💳</span> Extrato
          </button>
          
          {isCorporateView && (
            <button className={activeTab === 'invest' ? 'active' : ''} onClick={() => alert("Área de Investimentos Corporativos")}>
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
            <span className="date-badge">{isCorporateView ? 'Acesso Master' : 'Acesso Pessoal'}</span>
            <button className="btn-notif">🔔</button>
          </div>
        </header>

        <div className="content-area fade-in-up">
          {activeTab === 'dashboard' && (
            <BancoDashboard 
              saldo={saldo} 
              accessLevel={contaUser.accessLevel} 
              onNavigate={setActiveTab}
              isCorporate={isCorporateView} // Passamos a flag para o dashboard saber o que mostrar
            />
          )}
          
          {activeTab === 'extrato' && (
            <BancoExtrato 
              extrato={extrato} 
              saldo={saldo} 
              isCorporate={isCorporateView} // Bloqueia RPA se não for corporate
            />
          )}

          {activeTab === 'cards' && (
             <BancoCartoes 
               accessLevel={contaUser.accessLevel} 
               isCorporate={isCorporateView} // Mostra cartões diferentes
             />
          )}
        </div>
      </main>

      {isDev && (
        <div className="bank-dev-widget">
          <div className="dev-widget-header">🛠️ DEV MODE</div>
          <div className="dev-widget-body">
            <button onClick={() => simularPerfilBanco('admin')} className={contaUser.accessLevel === 'admin' ? 'active' : ''}>ADMIN</button>
            <button onClick={() => simularPerfilBanco('financeiro')} className={contaUser.accessLevel === 'financeiro' ? 'active' : ''}>FINANCEIRO</button>
            <button onClick={() => simularPerfilBanco('colaborador')} className={contaUser.accessLevel === 'colaborador' ? 'active' : ''}>COLABORADOR</button>
          </div>
        </div>
      )}
    </div>
  );
}