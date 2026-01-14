import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="brand">
          <span>🏢</span>
          <span>Portal RH | TechCorp Solutions</span>
        </div>
        <div className="user-badge" onClick={() => navigate('/')}>
          Sair ↪
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-wrapper">
        <h2 className="dashboard-title">
          Bem-vindo, Colaborador
        </h2>

        <div className="dashboard-grid">
          {/* Botões Inativos */}
          <div className="dashboard-card" onClick={() => alert("Módulo indisponível na demo")}>
            <span className="icon-large">📅</span>
            <strong>Folha de Ponto</strong>
          </div>
          <div className="dashboard-card" onClick={() => alert("Módulo indisponível na demo")}>
            <span className="icon-large">💰</span>
            <strong>Holerite Online</strong>
          </div>
          <div className="dashboard-card" onClick={() => alert("Módulo indisponível na demo")}>
            <span className="icon-large">🏥</span>
            <strong>Plano de Saúde</strong>
          </div>

          {/* Botão REAL (Ativo) */}
          <div className="dashboard-card active" onClick={() => navigate('/solicitacao')}>
            <span className="icon-large">📝</span>
            <strong>Reembolso de Despesas</strong>
          </div>

          <div className="dashboard-card" onClick={() => alert("Módulo indisponível na demo")}>
            <span className="icon-large">✈️</span>
            <strong>Viagens Corp.</strong>
          </div>
          <div className="dashboard-card" onClick={() => alert("Módulo indisponível na demo")}>
            <span className="icon-large">🔒</span>
            <strong>Alterar Senha</strong>
          </div>
        </div>
      </div>
    </div>
  );
}