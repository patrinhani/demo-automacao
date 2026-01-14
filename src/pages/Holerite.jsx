import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import '../App.css';

export default function Holerite() {
  const navigate = useNavigate();
  // Estado para controlar qual botão está carregando (pelo ID do holerite)
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = (id, nomeArquivo) => {
    setDownloadingId(id);

    // 1. Simula delay de rede (1.5s)
    setTimeout(() => {
      // 2. Cria um arquivo Fake para download
      const conteudoFake = `COMPROVANTE DE RENDIMENTOS - TECHCORP\nArquivo: ${nomeArquivo}\n\nEste documento é uma simulação para fins de demonstração.\nValor Líquido: R$ 5.432,10`;
      const blob = new Blob([conteudoFake], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadingId(null);
      alert("Download concluído com sucesso!");
    }, 1500);
  };

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="brand"><Logo /></div>
        <div className="user-badge" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="dashboard-wrapper">
        <div className="page-header">
          <h2>Meus Holerites / Contracheques</h2>
          <div className="breadcrumbs">Financeiro &gt; Documentos</div>
        </div>
        
        {/* Filtros Fakes */}
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '4px', border: '1px solid #ddd'}}>
            <select style={{width: '150px'}}><option>2024</option><option>2023</option></select>
            <select style={{width: '150px'}}><option>Todos os meses</option></select>
            <button className="btn-secondary" style={{padding: '5px 15px'}}>Filtrar</button>
        </div>

        <ul className="doc-list">
          {/* Holerite 1 */}
          <li className="doc-item">
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="doc-icon">🔴</span>
              <div className="doc-info">
                <h4>Holerite Mensal - Outubro/2024</h4>
                <span>Folha Mensal • Disponibilizado em 05/10/2024</span>
              </div>
            </div>
            <button 
              className="btn-secondary" 
              onClick={() => handleDownload(1, 'holerite_out_2024.pdf')}
              disabled={downloadingId === 1}
            >
              {downloadingId === 1 ? 'Baixando...' : '⬇ Baixar PDF'}
            </button>
          </li>

          {/* Holerite 2 */}
          <li className="doc-item">
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="doc-icon">🔴</span>
              <div className="doc-info">
                <h4>Adiantamento Quinzenal - Outubro/2024</h4>
                <span>Adiantamento • Disponibilizado em 20/09/2024</span>
              </div>
            </div>
            <button 
              className="btn-secondary" 
              onClick={() => handleDownload(2, 'adiantamento_out_2024.pdf')}
              disabled={downloadingId === 2}
            >
              {downloadingId === 2 ? 'Baixando...' : '⬇ Baixar PDF'}
            </button>
          </li>

          {/* Holerite 3 */}
          <li className="doc-item">
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="doc-icon">💰</span>
              <div className="doc-info">
                <h4>Informe de Rendimentos 2023</h4>
                <span>Anual • Para Imposto de Renda</span>
              </div>
            </div>
            <button 
              className="btn-secondary" 
              onClick={() => handleDownload(3, 'informe_rendimentos_2023.pdf')}
              disabled={downloadingId === 3}
            >
              {downloadingId === 3 ? 'Baixando...' : '⬇ Baixar PDF'}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}