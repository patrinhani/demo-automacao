import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">
          <span>🏢</span> TechCorp Portal
        </div>
        <div className="user-badge" onClick={() => navigate('/')}>Sair ↪</div>
      </header>

      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <div>
            <h2 className="dashboard-title">Olá, Colaborador</h2>
            <p className="last-login">Último acesso: Hoje às 08:42</p>
          </div>
          <div style={{textAlign: 'right'}}>
            <strong>Matrícula:</strong> 829304<br/>
            <strong>Cargo:</strong> Analista Pleno
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Módulos Funcionais */}
          <div className="dashboard-card" onClick={() => navigate('/ponto')}>
            <span className="icon-large">⏰</span>
            <strong>Folha de Ponto</strong>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/holerite')}>
            <span className="icon-large">📄</span>
            <strong>Meus Holerites</strong>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/plano')}>
            <span className="icon-large">🏥</span>
            <strong>Plano de Saúde</strong>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/solicitacao')} style={{border: '1px solid #004a80'}}>
            <span className="icon-large">📝</span>
            <strong style={{color: '#004a80'}}>Novo Reembolso</strong>
          </div>

           {/* Módulos de "Enfeite" (sem página ainda, mas podem ter) */}
          <div className="dashboard-card" onClick={() => alert('Sem permissão de acesso.')}>
            <span className="icon-large">✈️</span>
            <strong>Gestão de Viagens</strong>
          </div>
          
          <div className="dashboard-card" onClick={() => alert('Sistema de férias em manutenção.')}>
            <span className="icon-large">🏖️</span>
            <strong>Férias</strong>
          </div>
        </div>
      </div>
    </div>
  );
}