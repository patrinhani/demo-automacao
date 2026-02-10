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
  
  // Guardamos as permissões herdadas da URL (TechPortal -> Banco)
  const [inheritedPermissions, setInheritedPermissions] = useState(null);

  // --- 1. CONFIGURAÇÃO INICIAL E LEITURA DE URL ---
  useEffect(() => {
    document.title = "Horizon Bank | Secure";
    
    // Ler parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');   // ex: gestor, colaborador, admin
    const setorParam = params.get('setor'); // ex: Financeiro, RH, Geral

    if (roleParam || setorParam) {
      console.log(`🏦 Horizon Bank: Detectado Role=${roleParam}, Setor=${setorParam}`);
      setInheritedPermissions({ 
        role: roleParam || 'colaborador', 
        setor: setorParam || 'Geral' 
      });
    }

    return () => document.title = "TechPortal";
  }, []);

  // --- 2. LÓGICA DE DADOS (CORPORATIVO vs PESSOAL) ---
  useEffect(() => {
    if (!contaUser) return;

    // REGRA DE OURO: Quem vê a conta da EMPRESA?
    // 1. Admin
    // 2. Qualquer pessoa do setor 'Financeiro' (Gestor ou Colaborador)
    const isCorporate = contaUser.role === 'admin' || contaUser.setor === 'Financeiro';

    if (isCorporate) {
      // --- PERFIL CORPORATIVO: LÊ DO FIREBASE ---
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
      // --- PERFIL PESSOAL: DADOS MOCKADOS LOCAIS ---
      // Diferença: Gestor ganha mais que Colaborador
      const salarioBase = contaUser.role === 'gestor' ? 12500.00 : 3450.20;
      
      setSaldo(salarioBase); 
      setExtrato([
        { data: new Date().toISOString(), desc: "PIX ENVIADO - ALUGUEL", doc: "PIX-99", valor: -1800.00, tipo: "D" },
        { data: new Date().toISOString(), desc: "IFOOD *LUNCH", doc: "CART", valor: -45.90, tipo: "D" },
        { data: new Date().toISOString(), desc: "UBER TRIP", doc: "CART", valor: -22.50, tipo: "D" },
        { data: new Date().toISOString(), desc: "CREDITO SALÁRIO MENSAL", doc: "FOLHA", valor: salarioBase, tipo: "C" },
      ]);
    }
  }, [contaUser]);

  // --- 3. LOGIN COM HERANÇA ---
  const handleLoginSuccess = (dadosPadraoDoLogin) => {
    if (inheritedPermissions) {
       console.log("🔓 Aplicando permissões herdadas:", inheritedPermissions);
       
       const { role, setor } = inheritedPermissions;
       const isCorporate = role === 'admin' || setor === 'Financeiro';
       
       // Monta o usuário final combinando o login com a permissão da URL
       const usuarioFinal = {
          ...dadosPadraoDoLogin,
          role: role,
          setor: setor,
          
          // Ajusta nome e cargo visualmente
          nome: isCorporate ? "Conta Corporativa" : dadosPadraoDoLogin.nome,
          cargo: isCorporate ? (role === 'gestor' ? 'Diretor Financeiro' : 'Analista Financeiro') : `${role.charAt(0).toUpperCase() + role.slice(1)} de ${setor}`,
          
          // Flag antiga de compatibilidade (para não quebrar componentes internos)
          accessLevel: isCorporate ? 'financeiro' : 'colaborador' 
       };
       setContaUser(usuarioFinal);
       
    } else {
       // Acesso direto sem vir do portal (usa padrão)
       setContaUser({ ...dadosPadraoDoLogin, role: 'colaborador', setor: 'Geral' });
    }
  };

  // Ferramenta de Dev interna do Banco (Atualizada para nova lógica)
  const simularPerfilBanco = (preset) => {
    if (!contaUser) return;
    
    let novoRole = 'colaborador';
    let novoSetor = 'Geral';
    let novoNome = 'Usuário Teste';

    switch (preset) {
        case 'admin':
            novoRole = 'admin'; novoSetor = 'Tecnologia'; novoNome = 'Admin Master';
            break;
        case 'financeiro': // Simulando um Analista do Financeiro
            novoRole = 'colaborador'; novoSetor = 'Financeiro'; novoNome = 'Analista Fin.';
            break;
        case 'rh_gestor':
            novoRole = 'gestor'; novoSetor = 'RH'; novoNome = 'Gerente RH';
            break;
        case 'colaborador':
            novoRole = 'colaborador'; novoSetor = 'TI'; novoNome = 'Dev Frontend';
            break;
        default:
            break;
    }
    
    setContaUser(prev => ({ 
        ...prev, 
        role: novoRole, 
        setor: novoSetor, 
        nome: novoNome,
        accessLevel: (novoRole === 'admin' || novoSetor === 'Financeiro') ? 'financeiro' : 'colaborador'
    }));
  };

  if (!contaUser) {
    return <BancoLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Verifica se é visualização Corporativa
  const isCorporateView = contaUser.role === 'admin' || contaUser.setor === 'Financeiro';

  return (
    <div className="infinite-layout">
      <div className="aurora-bg"></div>

      <aside className="infinite-sidebar">
        <div className="brand-box">
          <div className="logo-circle">H</div>
          <span style={{fontWeight:600, letterSpacing:'2px', fontSize:'1.2rem'}}>HORIZON</span>
        </div>
        
        <div className="account-type-badge">
          {isCorporateView ? 'CONTA EMPRESARIAL' : 'CONTA PESSOAL'}
        </div>
        
        <nav className="infinite-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <span className="icon">📊</span> Visão Geral
          </button>
          
          <button className={activeTab === 'extrato' ? 'active' : ''} onClick={() => setActiveTab('extrato')}>
            <span className="icon">💳</span> Extrato
          </button>
          
          {/* Gestores de qualquer área podem ver Investimentos Pessoais Premium, Financeiro vê Investimentos da Empresa */}
          {(isCorporateView || contaUser.role === 'gestor') && (
            <button className={activeTab === 'invest' ? 'active' : ''} onClick={() => alert(isCorporateView ? "Investimentos Corporativos" : "Investimentos Premium (Pessoa Física)")}>
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
              <small style={{color:'#f59e0b', fontSize:'0.7rem'}}>
                 {contaUser.setor} | {contaUser.role.toUpperCase()}
              </small>
            </div>
          </div>
          <button className="btn-logout-infinite" onClick={() => window.close()}>Fechar</button>
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
              accessLevel={isCorporateView ? 'financeiro' : 'colaborador'} // Compatibilidade
              onNavigate={setActiveTab}
              isCorporate={isCorporateView} 
            />
          )}
          
          {activeTab === 'extrato' && (
            <BancoExtrato 
              extrato={extrato} 
              saldo={saldo} 
              isCorporate={isCorporateView} 
            />
          )}

          {activeTab === 'cards' && (
             <BancoCartoes 
               accessLevel={isCorporateView ? 'financeiro' : 'colaborador'}
               isCorporate={isCorporateView} 
             />
          )}
        </div>
      </main>

      {/* Widget Dev Interno */}
      {isDev && (
        <div className="bank-dev-widget">
          <div className="dev-widget-header">🛠️ SIMULAR PERFIL</div>
          <div className="dev-widget-body">
            <button onClick={() => simularPerfilBanco('admin')} className={contaUser.role === 'admin' ? 'active' : ''}>ADMIN</button>
            <button onClick={() => simularPerfilBanco('financeiro')} className={contaUser.setor === 'Financeiro' ? 'active' : ''}>FINAN (CORP)</button>
            <button onClick={() => simularPerfilBanco('rh_gestor')} className={contaUser.setor === 'RH' && contaUser.role === 'gestor' ? 'active' : ''}>GESTOR RH</button>
            <button onClick={() => simularPerfilBanco('colaborador')} className={contaUser.role === 'colaborador' && contaUser.setor !== 'Financeiro' ? 'active' : ''}>COLAB (TI)</button>
          </div>
        </div>
      )}
    </div>
  );
}