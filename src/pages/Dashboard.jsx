import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../Dashboard.css'; // Estilos específicos do layout

export default function Dashboard() {
  const navigate = useNavigate();

  // Dados mockados para os widgets
  const notificacoes = [
    { id: 1, texto: "Sua solicitação de férias foi aprovada.", tipo: "sucesso" },
    { id: 2, texto: "Envio de Notas Fiscais pendente (Ref: Jan/24).", tipo: "alerta" }
  ];

  const acessosRapidos = [
    { titulo: 'Folha de Ponto', desc: '3 ajustes pendentes', icon: '⏰', rota: '/folha-ponto', destaque: true },
    { titulo: 'Reembolso', desc: 'Status: Em análise', icon: '💸', rota: '/status-reembolso', destaque: false },
    { titulo: 'Holerite', desc: 'Disponível: Jan/2026', icon: '📄', rota: '/holerite', destaque: false },
    { titulo: 'Tarefas', desc: '5 pendentes hoje', icon: '✅', rota: '/tarefas', destaque: false },
  ];

  return (
    <div className="layout-container">
      {/* 1. Sidebar Fixa */}
      <Sidebar />

      {/* 2. Área Principal de Conteúdo */}
      <main className="main-content">
        
        {/* Header Superior (Título e Perfil) */}
        <header className="content-header">
          <div className="header-title">
            <h1>Visão Geral</h1>
            <span className="subtitle">Bem-vindo ao Portal do Colaborador</span>
          </div>
          
          <div 
            className="user-profile-compact" 
            onClick={() => navigate('/perfil')}
            title="Acessar meu perfil"
          >
            <div className="user-text">
              <span className="name">Guilherme Silva</span>
              <span className="role">Analista de Sistemas</span>
            </div>
            <div className="avatar-small">GS</div>
          </div>
        </header>

        {/* Conteúdo Rolável */}
        <div className="scrollable-content">
          
          {/* Banner de Boas-Vindas */}
          <section className="welcome-banner">
            <div className="banner-content">
              <h2>Olá, Guilherme! 👋</h2>
              <p>Hoje é <strong>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>.</p>
            </div>
          </section>

          {/* Widgets e Cards */}
          <div className="dashboard-grid">
            
            {/* Coluna Esquerda: Acessos Rápidos */}
            <div className="grid-column main-widgets">
              <h3 className="section-title">Acesso Rápido</h3>
              <div className="cards-grid">
                {acessosRapidos.map((card, idx) => (
                  <div key={idx} className="dash-card" onClick={() => navigate(card.rota)}>
                    <div className="card-icon-box">{card.icon}</div>
                    <div className="card-info">
                      <h4>{card.titulo}</h4>
                      <p>{card.desc}</p>
                    </div>
                    {card.destaque && <span className="notification-dot">!</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna Direita: Notificações */}
            <div className="grid-column side-widgets">
              <h3 className="section-title">Avisos Recentes</h3>
              <div className="notifications-panel">
                {notificacoes.map((notif) => (
                  <div key={notif.id} className={`notif-item ${notif.tipo}`}>
                    <span className="notif-bullet">•</span>
                    <p>{notif.texto}</p>
                  </div>
                ))}
                <button className="btn-ver-todos" onClick={() => navigate('/comunicacao')}>
                  Ver Mural Completo →
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}