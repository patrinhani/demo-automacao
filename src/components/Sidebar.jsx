import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useUser } from '../contexts/UserContext'; 
import Logo from './Logo';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation(); 
  const navigate = useNavigate();
  
  // Estado para controlar o menu no mobile
  const [isOpen, setIsOpen] = useState(false);
  
  const { 
    simulatedRole, simulatedSetor, switchProfile, 
    isDev, isAdmin, isFinanceiro, isRH, isGestor, userSetor 
  } = useUser();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  // Função para navegar e fechar a sidebar no mobile
  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false); 
  };

  const abrirBancoExterno = () => {
    const params = new URLSearchParams();
    if (simulatedRole) params.append('role', simulatedRole);
    if (simulatedSetor) params.append('setor', simulatedSetor);
    window.open(`/banco?${params.toString()}`, '_blank');
  };

  return (
    <>
      {/* Botão Hambúrguer (Aparece apenas no mobile) */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      {/* Fundo escuro ao abrir o menu no mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar principal */}
      <aside className={`tech-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {/* Botão de fechar (X) ao lado da logo no mobile */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div>
              <Logo />
              <small style={{color: '#64748b', fontSize: '10px', display: 'block', marginTop: '5px'}}>
                {userSetor?.toUpperCase()} | {simulatedRole?.toUpperCase()}
              </small>
            </div>
            <button className="close-menu-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>
        </div>

        {/* --- PAINEL DE TROCA DE PERFIL (DEV) --- */}
        {isDev && (
          <div className="dev-switcher-box" style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px dashed #a855f7', margin: '10px', padding: '10px', borderRadius: '8px' }}>
            <small style={{color: '#d8b4fe', display:'block', marginBottom:'5px', fontWeight:'bold'}}>🛠️ TROCAR PERFIL</small>
            <div style={{display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'10px'}}>
              <button onClick={() => switchProfile('admin')} style={{ flex:1, fontSize:'9px', padding:'5px', background: simulatedRole === 'admin' ? '#a855f7' : '#333' }}>ADMIN</button>
              <button onClick={() => switchProfile('financeiro')} style={{ flex:1, fontSize:'9px', padding:'5px', background: userSetor === 'Financeiro' ? '#a855f7' : '#333' }}>FINAN</button>
              <button onClick={() => switchProfile('rh')} style={{ flex:1, fontSize:'9px', padding:'5px', background: userSetor === 'RH' ? '#a855f7' : '#333' }}>RH</button>
              <button onClick={() => switchProfile('colaborador')} style={{ flex:1, fontSize:'9px', padding:'5px', background: simulatedRole === 'colaborador' ? '#a855f7' : '#333' }}>COLAB</button>
            </div>
            <button onClick={() => handleNavigation('/dev-tools')} style={{ width:'100%', background: 'transparent', border:'1px solid #a855f7', color:'#d8b4fe', fontSize:'11px', padding:'5px', borderRadius:'4px' }}>Fábrica de Dados ⚡</button>
            <button onClick={() => handleNavigation('/pdf-factory')} style={{ width:'100%', background: 'transparent', border:'1px solid #a855f7', color:'#d8b4fe', fontSize:'11px', padding:'5px', borderRadius:'4px', marginTop: '5px' }}>Fábrica de PDF 🖨️</button>
            
            {/* NOVO BOTÃO DA TELA DE APRESENTAÇÃO */}
            <button onClick={() => handleNavigation('/apresentacao')} style={{ width:'100%', background: '#a855f7', border:'1px solid #a855f7', color:'#fff', fontSize:'11px', padding:'8px 5px', borderRadius:'4px', marginTop: '15px', fontWeight: 'bold', textTransform: 'uppercase', boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)' }}>
               🎬 Iniciar Apresentação
            </button>
          </div>
        )}

        <nav className="sidebar-nav custom-scroll">
          {/* === PRINCIPAL === */}
          <div className="nav-section">
            <span className="nav-title">Principal</span>
            <button className={`nav-item ${isActive('/dashboard')}`} onClick={() => handleNavigation('/dashboard')}><span className="icon">🏠</span> Visão Geral</button>
            <button className={`nav-item ${isActive('/tarefas')}`} onClick={() => handleNavigation('/tarefas')}><span className="icon">⚡</span> Minhas Tarefas</button>
            <button className={`nav-item ${isActive('/perfil')}`} onClick={() => handleNavigation('/perfil')}><span className="icon">👤</span> Meu Perfil</button>
          </div>

          {/* === GESTÃO === */}
          {(isAdmin || isGestor) && (
            <div className="nav-section admin-section">
              <span className="nav-title">Gestão de Time</span>
              {isRH && (
                <button className={`nav-item ${isActive('/cadastro-usuario')}`} onClick={() => handleNavigation('/cadastro-usuario')}><span className="icon">🔐</span> Criar Usuário</button>
              )}
              {/* Rota corrigida para a Central Unificada de Aprovações */}
              <button className={`nav-item ${isActive('/aprovacoes-gerais')}`} onClick={() => handleNavigation('/aprovacoes-gerais')}><span className="icon">💰</span> Aprovações</button>
            </div>
          )}

          {/* === FINANCEIRO === */}
          {isFinanceiro && (
            <div className="nav-section" style={{ borderLeft: '3px solid #34d399', paddingLeft: '10px', background: 'rgba(52, 211, 153, 0.05)' }}>
                <span className="nav-title" style={{color: '#34d399'}}>Dep. Financeiro</span>
                <button className={`nav-item ${isActive('/conciliacao')}`} onClick={() => handleNavigation('/conciliacao')}><span className="icon">🏦</span> Conciliação</button>
                <button className={`nav-item ${isActive('/gerar-nota')}`} onClick={() => handleNavigation('/gerar-nota')}><span className="icon">🧾</span> Notas Fiscais</button>
            </div>
          )}

          {/* === AUTO-SERVIÇO === */}
          <div className="nav-section">
            <span className="nav-title">Minhas Finanças</span>
            <button className={`nav-item ${isActive('/solicitacao')}`} onClick={() => handleNavigation('/solicitacao')}><span className="icon">💸</span> Solicitar Reembolso</button>
            <button className={`nav-item ${isActive('/status-reembolso')}`} onClick={() => handleNavigation('/status-reembolso')}><span className="icon">📊</span> Meus Reembolsos</button>
            <button className={`nav-item ${isActive('/holerite')}`} onClick={() => handleNavigation('/holerite')}><span className="icon">📄</span> Holerite</button>
          </div>

          <div className="nav-section">
            <span className="nav-title">Recursos Humanos</span>
            <button className={`nav-item ${isActive('/folha-ponto')}`} onClick={() => handleNavigation('/folha-ponto')}><span className="icon">⏰</span> Folha Ponto</button>
            <button className={`nav-item ${isActive('/ferias')}`} onClick={() => handleNavigation('/ferias')}><span className="icon">🌴</span> Férias</button>
            <button className={`nav-item ${isActive('/plano-saude')}`} onClick={() => handleNavigation('/plano-saude')}><span className="icon">🏥</span> Plano de Saúde</button>
            <button className={`nav-item ${isActive('/Carreira')}`} onClick={() => handleNavigation('/Carreira')}><span className="icon">🚀</span> Carreira</button>
          </div>

          {/* === COMUNICAÇÃO === */}
          <div className="nav-section">
            <span className="nav-title">Comunicação</span>
            <button className={`nav-item ${isActive('/chat')}`} onClick={() => handleNavigation('/chat')}><span className="icon">💬</span> Chat Interno</button>
            <button className={`nav-item ${isActive('/comunicacao')}`} onClick={() => handleNavigation('/comunicacao')}><span className="icon">📢</span> Mural & Avisos</button>
          </div>

          <div className="nav-section">
            <span className="nav-title">Serviços Internos</span>
            <button className={`nav-item ${isActive('/helpdesk')}`} onClick={() => handleNavigation('/helpdesk')}><span className="icon">🎧</span> Helpdesk TI</button>
            <button className={`nav-item ${isActive('/reservas')}`} onClick={() => handleNavigation('/reservas')}><span className="icon">📅</span> Reserva Salas</button>
            <button className={`nav-item ${isActive('/viagens')}`} onClick={() => handleNavigation('/viagens')}><span className="icon">✈️</span> Viagens</button>
          </div>

          <div className="nav-section" style={{marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px'}}>
            <button className="nav-item external-link" onClick={abrirBancoExterno}>
              <span className="icon">🌐</span> <strong>Horizon Bank</strong> ↗
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>Sair do Sistema 🚪</button>
        </div>
      </aside>
    </>
  );
}