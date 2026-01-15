import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import './Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Visão Geral', icon: '📊', path: '/dashboard' },
    { type: 'divider', label: 'Recursos Humanos' },
    { label: 'Folha de Ponto', icon: '⏰', path: '/folha-ponto' },
    { label: 'Holerites', icon: '📄', path: '/holerite' },
    { label: 'Férias', icon: '🏖️', path: '/ferias' },
    { label: 'Plano de Saúde', icon: '❤️', path: '/plano-saude' },
    { type: 'divider', label: 'Financeiro' },
    { label: 'Reembolsos', icon: '💸', path: '/solicitacao' },
    { label: 'Viagens', icon: '✈️', path: '/viagens' },
    { type: 'divider', label: 'Serviços' },
    { label: 'Helpdesk', icon: '🎧', path: '/helpdesk' },
    { label: 'Salas', icon: '📅', path: '/reservas' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header" onClick={() => navigate('/dashboard')}>
        <Logo />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          if (item.type === 'divider') {
            return <div key={index} className="nav-divider">{item.label}</div>;
          }

          const isActive = location.pathname === item.path;
          
          return (
            <button 
              key={index} 
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout" onClick={() => navigate('/')}>
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Sair</span>
        </button>
      </div>
    </aside>
  );
}