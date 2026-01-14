import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function PlanoSaude() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">🏥 Saúde Vida</div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>
      <div className="dashboard-wrapper" style={{textAlign: 'center'}}>
        <h2 className="dashboard-title">Carteirinha Digital</h2>
        <br />
        <div className="health-card">
          <h3>TechCorp Health Care</h3>
          <div className="card-row">
            <div>
              <span className="card-label">Beneficiário</span>
              <span className="card-value">COLABORADOR DEMO</span>
            </div>
            <div style={{textAlign: 'right'}}>
              <span className="card-label">Plano</span>
              <span className="card-value">OURO NACIONAL</span>
            </div>
          </div>
          <div className="card-row">
            <div>
              <span className="card-label">Matrícula</span>
              <span className="card-value">8899.2233.1111</span>
            </div>
            <div style={{textAlign: 'right'}}>
              <span className="card-label">Validade</span>
              <span className="card-value">12/2026</span>
            </div>
          </div>
        </div>
        <p style={{marginTop: '20px', color: '#666'}}>Apresente este cartão digital na rede credenciada.</p>
      </div>
    </div>
  );
}