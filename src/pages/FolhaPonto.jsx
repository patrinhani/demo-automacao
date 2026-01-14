import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function FolhaPonto() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand">⏰ Portal Ponto</div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>
      <div className="dashboard-wrapper">
        <h2 className="dashboard-title">Espelho de Ponto - Outubro/2024</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Entrada</th>
                <th>Saída Almoço</th>
                <th>Volta Almoço</th>
                <th>Saída</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>01/10/24</td><td>08:00</td><td>12:00</td><td>13:00</td><td>17:00</td><td>08:00</td></tr>
              <tr><td>02/10/24</td><td>08:05</td><td>12:10</td><td>13:10</td><td>17:05</td><td>08:00</td></tr>
              <tr><td>03/10/24</td><td>07:55</td><td>12:00</td><td>13:00</td><td>17:00</td><td>08:05</td></tr>
              <tr style={{background: '#ffe6e6'}}>
                <td>04/10/24</td><td>--:--</td><td>--:--</td><td>--:--</td><td>--:--</td>
                <td style={{color:'red', fontWeight:'bold'}}>FALTA</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button className="btn-secondary" style={{marginTop: '20px'}} onClick={() => window.print()}>Imprimir Espelho</button>
      </div>
    </div>
  );
}