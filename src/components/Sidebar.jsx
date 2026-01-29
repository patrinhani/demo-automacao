import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useUser } from '../contexts/UserContext'; 
import Logo from './Logo';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation(); 
  const navigate = useNavigate();
  const { simulatedRole, switchRole, isDev, isAdmin } = useUser();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  // Função para abrir o Banco em NOVA GUIA
  const abrirBancoExterno = () => {
    // Abre a rota '/banco' em uma nova aba/janela
    window.open('/banco', '_blank');
  };

  return (
    <aside className="tech-sidebar">
      <div className="sidebar-header">
        <Logo />
      </div>

      {isDev && (
        <div className="dev-switcher-box" style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px dashed #a855f7', margin: '10px', padding: '10px', borderRadius: '8px' }}>
          <small style={{color: '#d8b4fe', display:'block', marginBottom:'5px', fontWeight:'bold'}}>🛠️ PAINEL DEV</small>
          <div style={{display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'10px'}}>
            <button onClick={() => switchRole('admin')} style={{ flex:1, fontSize:'10px', border:'none', color:'#fff', padding:'5px', cursor:'pointer', background: simulatedRole === 'admin' ? '#a855f7' : '#333' }}>ADMIN</button>
            <button onClick={() => switchRole('colaborador')} style={{ flex:1, fontSize:'10px', border:'none', color:'#fff', padding:'5px', cursor:'pointer', background: simulatedRole === 'colaborador' ? '#a855f7' : '#333' }}>COLAB</button>
          </div>
          <button onClick={() => navigate('/dev-tools')} style={{ width:'100%', background: 'transparent', border:'1px solid #a855f7', color:'#d8b4fe', fontSize:'11px', padding:'5px', cursor:'pointer', borderRadius:'4px' }}>Fábrica de Dados ⚡</button>
        </div>
      )}

      <nav className="sidebar-nav custom-scroll">
        <div className="nav-section">
          <span className="nav-title">Principal ({simulatedRole?.toUpperCase()})</span>
          <button className={`nav-item ${isActive('/dashboard')}`} onClick={() => navigate('/dashboard')}><span className="icon">🏠</span> Visão Geral</button>
          <button className={`nav-item ${isActive('/tarefas')}`} onClick={() => navigate('/tarefas')}><span className="icon">⚡</span> Minhas Tarefas</button>
          <button className={`nav-item ${isActive('/perfil')}`} onClick={() => navigate('/perfil')}><span className="icon">👤</span> Meu Perfil</button>
        </div>

        {isAdmin && (
          <div className="nav-section admin-section">
            <span className="nav-title">Gestão & Admin</span>
            <button className={`nav-item ${isActive('/cadastro-usuario')}`} onClick={() => navigate('/cadastro-usuario')}><span className="icon">🔐</span> Criar Usuário</button>
            <button className={`nav-item ${isActive('/gestao-reembolsos')}`} onClick={() => navigate('/gestao-reembolsos')}><span className="icon">💰</span> Aprovações</button>
          </div>
        )}

        <div className="nav-section">
          <span className="nav-title">Financeiro</span>
          <button className={`nav-item ${isActive('/conciliacao')}`} onClick={() => navigate('/conciliacao')}><span className="icon">🏦</span> Conciliação</button>
          <button className={`nav-item ${isActive('/solicitacao')}`} onClick={() => navigate('/solicitacao')}><span className="icon">💸</span> Solicitar Reembolso</button>
          <button className={`nav-item ${isActive('/status-reembolso')}`} onClick={() => navigate('/status-reembolso')}><span className="icon">📊</span> Meus Reembolsos</button>
          <button className={`nav-item ${isActive('/holerite')}`} onClick={() => navigate('/holerite')}><span className="icon">📄</span> Holerite</button>
          <button className={`nav-item ${isActive('/gerar-nota')}`} onClick={() => navigate('/gerar-nota')}><span className="icon">🧾</span> Notas Fiscais</button>
        </div>

        <div className="nav-section">
          <span className="nav-title">Recursos Humanos</span>
          <button className={`nav-item ${isActive('/folha-ponto')}`} onClick={() => navigate('/folha-ponto')}><span className="icon">⏰</span> Folha Ponto</button>
          <button className={`nav-item ${isActive('/ferias')}`} onClick={() => navigate('/ferias')}><span className="icon">🌴</span> Férias</button>
          <button className={`nav-item ${isActive('/plano-saude')}`} onClick={() => navigate('/plano-saude')}><span className="icon">🏥</span> Plano de Saúde</button>
          <button className={`nav-item ${isActive('/Carreira')}`} onClick={() => navigate('/Carreira')}><span className="icon">🚀</span> Carreira</button>
        </div>

        <div className="nav-section">
          <span className="nav-title">Serviços Internos</span>
          <button className={`nav-item ${isActive('/helpdesk')}`} onClick={() => navigate('/helpdesk')}><span className="icon">🎧</span> Helpdesk TI</button>
          <button className={`nav-item ${isActive('/reservas')}`} onClick={() => navigate('/reservas')}><span className="icon">📅</span> Reserva Salas</button>
          <button className={`nav-item ${isActive('/viagens')}`} onClick={() => navigate('/viagens')}><span className="icon">✈️</span> Viagens</button>
        </div>

        <div className="nav-section">
          <span className="nav-title">Comunicação</span>
          <button className={`nav-item ${isActive('/comunicacao')}`} onClick={() => navigate('/comunicacao')}><span className="icon">📢</span> Mural</button>
          <button className={`nav-item ${isActive('/chat')}`} onClick={() => navigate('/chat')}><span className="icon">💬</span> Chat Interno</button>
          <button className={`nav-item ${isActive('/portal-cliente')}`} onClick={() => navigate('/portal-cliente')}><span className="icon">🌐</span> Documentações</button>
        </div>

        {/* --- ACESSO EXTERNO (ABRE EM NOVA GUIA) --- */}
        <div className="nav-section" style={{marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px'}}>
          <span className="nav-title" style={{color: '#94a3b8'}}>Sites Externos</span>
          <button className="nav-item external-link" onClick={abrirBancoExterno}>
            <span className="icon">🌐</span> <strong>Horizon Bank</strong> ↗
          </button>
        </div>

      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>Sair do Sistema 🚪</button>
      </div>
    </aside>
  );
}