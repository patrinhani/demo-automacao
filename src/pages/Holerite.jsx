import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Holerite() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">📄 TechCorp Financeiro</div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>
      <div className="dashboard-wrapper">
        <h2 className="dashboard-title">Demonstrativos de Pagamento</h2>
        <ul className="doc-list">
          <li className="doc-item">
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="doc-icon">🔴 PDF</span>
              <div className="doc-info">
                <h4>Holerite Mensal - 09/2024</h4>
                <span>Disponibilizado em 05/10/2024</span>
              </div>
            </div>
            <button className="btn-secondary">Baixar</button>
          </li>
          <li className="doc-item">
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="doc-icon">🔴 PDF</span>
              <div className="doc-info">
                <h4>Adiantamento Quinzenal - 09/2024</h4>
                <span>Disponibilizado em 20/09/2024</span>
              </div>
            </div>
            <button className="btn-secondary">Baixar</button>
          </li>
        </ul>
      </div>
    </div>
  );
}