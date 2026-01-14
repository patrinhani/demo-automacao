import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  // Lista de Módulos do Sistema
  const modulos = [
    {
      titulo: 'Folha de Ponto',
      desc: 'Registro de entrada/saída, ajustes e espelho de ponto.',
      icon: '⏰',
      classeIcone: 'icon-ponto',
      rota: '/folha-ponto',
      notificacao: '3 pendências' // Simula aviso de ajuste
    },
    {
      titulo: 'Holerites',
      desc: 'Consulte seus demonstrativos de pagamento e informes de rendimento.',
      icon: '📄',
      classeIcone: 'icon-holerite',
      rota: '/holerite',
      notificacao: null
    },
    {
      titulo: 'Reembolso',
      desc: 'Solicite reembolso de despesas, anexe notas e acompanhe status.',
      icon: '💸',
      classeIcone: 'icon-reembolso',
      rota: '/solicitacao',
      notificacao: null
    },
    {
      titulo: 'Plano de Saúde',
      desc: 'Carteirinha digital, busca de rede credenciada e extratos.',
      icon: '❤️',
      classeIcone: 'icon-saude',
      rota: '/plano-saude',
      notificacao: null
    },
    {
      titulo: 'Gestão de Viagens',
      desc: 'Solicite passagens, hospedagem e adiantamentos corporativos.',
      icon: '✈️',
      classeIcone: 'icon-viagem',
      rota: '/viagens',
      notificacao: '1 aprovada'
    },
    {
      titulo: 'Helpdesk TI',
      desc: 'Abra chamados para suporte técnico, acessos e equipamentos.',
      icon: '🎧',
      classeIcone: 'icon-ti',
      rota: '/helpdesk',
      notificacao: null
    }
  ];

  return (
    <div className="app-container">
      {/* BARRA SUPERIOR */}
      <header className="top-bar">
        <div className="brand">
          <Logo />
        </div>
        <div className="user-info">
          <div className="avatar">GS</div>
          <span>Guilherme Silva</span>
        </div>
      </header>

      <div className="dashboard-container">
        
        {/* BOAS VINDAS */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h2>Olá, Guilherme! 👋</h2>
            <p>Bem-vindo ao Portal do Colaborador TechCorp.</p>
          </div>
          <div className="quick-stats">
            <div className="stat-badge">📅 <span>Hoje: <strong>{new Date().toLocaleDateString()}</strong></span></div>
            <div className="stat-badge">🏢 <span>Unidade: <strong>Matriz SP</strong></span></div>
          </div>
        </div>

        {/* GRID DE MÓDULOS */}
        <div className="modules-grid">
          {modulos.map((mod, index) => (
            <div key={index} className="module-card" onClick={() => navigate(mod.rota)}>
              {mod.notificacao && <span className="notify-badge">{mod.notificacao}</span>}
              
              <div className={`card-icon ${mod.classeIcone}`}>
                {mod.icon}
              </div>
              
              <h3>{mod.titulo}</h3>
              <p>{mod.desc}</p>
              
              <span className="card-link">Acessar Módulo →</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}