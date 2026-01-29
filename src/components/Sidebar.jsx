import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import Logo from './Logo';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation(); 
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const role = data.role || 'colaborador';
          const cargo = data.cargo || '';
          if (role === 'admin' || role === 'gestor' || cargo.toLowerCase().includes('gestor')) {
            setIsAdmin(true);
          }
        }
      });
    }
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <aside className="tech-sidebar">
      <div className="sidebar-header">
        <Logo />
      </div>

      <nav className="sidebar-nav custom-scroll">
        
        {/* MENU PRINCIPAL */}
        <div className="nav-section">
          <span className="nav-title">Principal</span>
          <button className={`nav-item ${isActive('/dashboard')}`} onClick={() => navigate('/dashboard')}>
            <span className="icon">🏠</span> Visão Geral
          </button>
          <button className={`nav-item ${isActive('/tarefas')}`} onClick={() => navigate('/tarefas')}>
            <span className="icon">⚡</span> Minhas Tarefas
          </button>
          <button className={`nav-item ${isActive('/perfil')}`} onClick={() => navigate('/perfil')}>
            <span className="icon">👤</span> Meu Perfil
          </button>
        </div>

        {/* GESTÃO (ADMIN) */}
        {isAdmin && (
          <div className="nav-section admin-section">
            <span className="nav-title">Gestão & Admin</span>
            <button className={`nav-item ${isActive('/cadastro-usuario')}`} onClick={() => navigate('/cadastro-usuario')}>
              <span className="icon">🔐</span> Criar Usuário
            </button>
            <button className={`nav-item ${isActive('/gestao-reembolsos')}`} onClick={() => navigate('/gestao-reembolsos')}>
              <span className="icon">💰</span> Aprovações
            </button>
          </div>
        )}

        {/* FINANCEIRO */}
        <div className="nav-section">
          <span className="nav-title">Financeiro</span>
          
          {/* ITEM NOVO: CONCILIAÇÃO */}
          <button className={`nav-item ${isActive('/conciliacao')}`} onClick={() => navigate('/conciliacao')}>
            <span className="icon">🏦</span> Conciliação
          </button>

          <button className={`nav-item ${isActive('/solicitacao')}`} onClick={() => navigate('/solicitacao')}>
            <span className="icon">💸</span> Solicitar Reembolso
          </button>
          
          <button className={`nav-item ${isActive('/status-reembolso')}`} onClick={() => navigate('/status-reembolso')}>
            <span className="icon">📊</span> Meus Reembolsos
          </button>

          <button className={`nav-item ${isActive('/holerite')}`} onClick={() => navigate('/holerite')}>
            <span className="icon">📄</span> Holerite
          </button>
          <button className={`nav-item ${isActive('/gerar-nota')}`} onClick={() => navigate('/gerar-nota')}>
            <span className="icon">🧾</span> Notas Fiscais
          </button>
        </div>

        {/* RH */}
        <div className="nav-section">
          <span className="nav-title">Recursos Humanos</span>
          <button className={`nav-item ${isActive('/folha-ponto')}`} onClick={() => navigate('/folha-ponto')}>
            <span className="icon">⏰</span> Folha Ponto
          </button>
          <button className={`nav-item ${isActive('/ferias')}`} onClick={() => navigate('/ferias')}>
            <span className="icon">🌴</span> Férias
          </button>
          <button className={`nav-item ${isActive('/plano-saude')}`} onClick={() => navigate('/plano-saude')}>
            <span className="icon">🏥</span> Plano de Saúde
          </button>
          <button className={`nav-item ${isActive('/Carreira')}`} onClick={() => navigate('/Carreira')}>
            <span className="icon">🚀</span> Carreira
          </button>
        </div>

        {/* SERVIÇOS */}
        <div className="nav-section">
          <span className="nav-title">Serviços Internos</span>
          <button className={`nav-item ${isActive('/helpdesk')}`} onClick={() => navigate('/helpdesk')}>
            <span className="icon">🎧</span> Helpdesk TI
          </button>
          <button className={`nav-item ${isActive('/reservas')}`} onClick={() => navigate('/reservas')}>
            <span className="icon">📅</span> Reserva Salas
          </button>
          <button className={`nav-item ${isActive('/viagens')}`} onClick={() => navigate('/viagens')}>
            <span className="icon">✈️</span> Viagens
          </button>
        </div>

        {/* COMUNICAÇÃO */}
        <div className="nav-section">
          <span className="nav-title">Comunicação</span>
          <button className={`nav-item ${isActive('/comunicacao')}`} onClick={() => navigate('/comunicacao')}>
            <span className="icon">📢</span> Mural
          </button>
          <button className={`nav-item ${isActive('/chat')}`} onClick={() => navigate('/chat')}>
            <span className="icon">💬</span> Chat Interno
          </button>
          <button className={`nav-item ${isActive('/portal-cliente')}`} onClick={() => navigate('/portal-cliente')}>
            <span className="icon">🌐</span> Documentações do Colaborador
          </button>
        </div>

      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          Sair do Sistema 🚪
        </button>
      </div>
    </aside>
  );
}