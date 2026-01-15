import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Carreira.css';

export default function Carreira() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('vagas'); // 'vagas' | 'cursos'
  
  // Controle de Modais
  const [modalAberto, setModalAberto] = useState(null); // 'tracking' | 'certificado' | null
  const [itemSelecionado, setItemSelecionado] = useState(null);

  // --- DADOS DE VAGAS ---
  const [vagas, setVagas] = useState([
    { 
      id: 1, 
      titulo: 'Analista de Dados Sênior', 
      area: 'Tecnologia', 
      local: 'Híbrido - SP', 
      requisitos: ['SQL Avançado', 'Power BI', 'Inglês Intermediário'],
      aplicado: false,
      status: null
    },
    { 
      id: 2, 
      titulo: 'Coordenador de Marketing', 
      area: 'Marketing', 
      local: 'Presencial - RJ', 
      requisitos: ['Gestão de Equipes', 'CRM', 'Experiência de 3 anos'],
      aplicado: false,
      status: null
    },
    { 
      id: 3, 
      titulo: 'Product Owner (PO)', 
      area: 'Produto', 
      local: 'Remoto', 
      requisitos: ['Certificação CSPO', 'Jira', 'Metodologias Ágeis'],
      aplicado: true,
      status: {
        faseAtual: 2, // 0: Enviado, 1: RH, 2: Gestor, 3: Oferta
        historico: [
          { data: '10/01/2026', msg: 'Candidatura recebida com sucesso.' },
          { data: '12/01/2026', msg: 'Currículo aprovado pelo RH.' },
          { data: '14/01/2026', msg: 'Aguardando agendamento com Gestor.' }
        ]
      }
    }
  ]);

  // --- DADOS DE CURSOS ---
  const [cursos, setCursos] = useState([
    { 
      id: 101, 
      titulo: 'Compliance e Ética 2026', 
      categoria: 'Obrigatório', 
      progresso: 100, 
      status: 'Concluído',
      cargaHoraria: '4h',
      conclusao: '10/01/2026',
      capa: '⚖️' 
    },
    { 
      id: 102, 
      titulo: 'Liderança Ágil 2.0', 
      categoria: 'Soft Skills', 
      progresso: 45, 
      status: 'Em Andamento',
      cargaHoraria: '12h',
      capa: '🚀' 
    },
    { 
      id: 103, 
      titulo: 'Segurança da Informação', 
      categoria: 'Obrigatório', 
      progresso: 0, 
      status: 'Não Iniciado',
      cargaHoraria: '2h',
      capa: '🔒' 
    }
  ]);

  // Ação de Aplicar
  const handleAplicar = (id) => {
    if (window.confirm('Confirmar candidatura?')) {
      setVagas(vagas.map(v => v.id === id ? { 
        ...v, 
        aplicado: true,
        status: { 
          faseAtual: 0, 
          historico: [{ data: new Date().toLocaleDateString(), msg: 'Candidatura enviada.' }] 
        } 
      } : v));
    }
  };

  // Abrir Acompanhamento
  const abrirTracking = (vaga) => {
    setItemSelecionado(vaga);
    setModalAberto('tracking');
  };

  // Abrir Certificado ou Curso
  const handleCurso = (curso) => {
    if (curso.status === 'Concluído') {
      setItemSelecionado(curso);
      setModalAberto('certificado');
    } else {
      alert(`Continuando curso: ${curso.titulo}...`);
    }
  };

  const fecharModal = () => {
    setModalAberto(null);
    setItemSelecionado(null);
  };

  return (
    <div className="app-container">
      
      {/* --- MODAL DE ACOMPANHAMENTO (TRACKING) --- */}
      {modalAberto === 'tracking' && itemSelecionado && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content tracking-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Acompanhamento de Processo</h3>
              <button className="close-btn" onClick={fecharModal}>✖</button>
            </div>
            
            <div className="tracking-body">
              <h4>{itemSelecionado.titulo}</h4>
              <p className="tracking-subtitle">Status atual da sua candidatura</p>
              
              <div className="timeline-container">
                {['Candidatura', 'Triagem RH', 'Entrevista Gestor', 'Proposta'].map((etapa, index) => (
                  <div key={index} className={`timeline-step ${index <= itemSelecionado.status.faseAtual ? 'active' : ''}`}>
                    <div className="step-circle">{index + 1}</div>
                    <div className="step-label">{etapa}</div>
                  </div>
                ))}
                <div className="progress-line-bg">
                  <div className="progress-line-fill" style={{width: `${itemSelecionado.status.faseAtual * 33}%`}}></div>
                </div>
              </div>

              <div className="history-logs">
                <h5>Histórico</h5>
                <ul>
                  {itemSelecionado.status.historico.map((log, i) => (
                    <li key={i}>
                      <span className="log-date">{log.data}</span>
                      <span className="log-msg">{log.msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CERTIFICADO --- */}
      {modalAberto === 'certificado' && itemSelecionado && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content certificate-modal" onClick={e => e.stopPropagation()}>
            
            <div className="certificate-paper">
              <div className="certificate-border">
                <div className="cert-header">
                  <Logo /> {/* Reutilizando o logo */}
                  <h1>CERTIFICADO DE CONCLUSÃO</h1>
                </div>
                
                <div className="cert-body">
                  <p>A TechCorp University certifica que</p>
                  <h2>Guilherme Silva</h2>
                  <p>concluiu com êxito o curso de atualização profissional:</p>
                  <h3>{itemSelecionado.titulo}</h3>
                  <p>realizado em {itemSelecionado.conclusao}, com carga horária total de <strong>{itemSelecionado.cargaHoraria}</strong>.</p>
                </div>

                <div className="cert-footer">
                  <div className="signature">
                    <div className="sig-line"></div>
                    <span>Diretoria de Ensino</span>
                  </div>
                  <div className="signature">
                    <div className="sig-line"></div>
                    <span>TechCorp RH</span>
                  </div>
                  <div className="cert-code">
                    Código de Validação: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={fecharModal}>Fechar</button>
              <button className="btn-primary" onClick={() => window.print()}>🖨️ Imprimir / Salvar PDF</button>
            </div>
          </div>
        </div>
      )}

      <header className="header-bar">
        <div className="logo-container"><Logo /></div>
        <div className="back-button" onClick={() => navigate('/dashboard')}>Voltar ao Menu ↩</div>
      </header>

      <div className="carreira-container">
        <div className="page-header">
          <h2>Desenvolvimento & Carreira</h2>
          <p>Gerencie seu crescimento profissional.</p>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${abaAtiva === 'vagas' ? 'active' : ''}`} onClick={() => setAbaAtiva('vagas')}>💼 Vagas Internas</button>
          <button className={`tab-btn ${abaAtiva === 'cursos' ? 'active' : ''}`} onClick={() => setAbaAtiva('cursos')}>🎓 Universidade Corporativa</button>
        </div>

        {/* LISTAGEM DE VAGAS */}
        {abaAtiva === 'vagas' && (
          <div className="vagas-grid">
            {vagas.map(vaga => (
              <div key={vaga.id} className={`vaga-card ${vaga.aplicado ? 'vaga-aplicada' : ''}`}>
                <div className="vaga-header">
                  <span className="vaga-tag">{vaga.area}</span>
                  {vaga.aplicado && <span className="status-aplicado">Candidatura Enviada</span>}
                </div>
                <h3>{vaga.titulo}</h3>
                <p className="vaga-local">📍 {vaga.local}</p>
                
                <div className="vaga-reqs">
                  <strong>Requisitos:</strong>
                  <ul>{vaga.requisitos.map((req, i) => <li key={i}>{req}</li>)}</ul>
                </div>

                <button 
                  className="btn-vaga" 
                  onClick={() => vaga.aplicado ? abrirTracking(vaga) : handleAplicar(vaga.id)}
                >
                  {vaga.aplicado ? 'Ver Acompanhamento 👁️' : 'Candidatar-se Agora'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* LISTAGEM DE CURSOS */}
        {abaAtiva === 'cursos' && (
          <div className="cursos-list">
             <div className="learning-stats">
              <div className="stat-box"><strong>{cursos.length}</strong> <span>Disponíveis</span></div>
              <div className="stat-box completed"><strong>{cursos.filter(c=>c.status==='Concluído').length}</strong> <span>Concluídos</span></div>
            </div>

            <div className="cursos-grid">
              {cursos.map(curso => (
                <div key={curso.id} className="curso-card" onClick={() => handleCurso(curso)}>
                  <div className="curso-icon">{curso.capa}</div>
                  <div className="curso-info">
                    <span className={`curso-cat ${curso.categoria.toLowerCase()}`}>{curso.categoria}</span>
                    <h4>{curso.titulo}</h4>
                    <div className="progress-wrapper">
                      <div className="progress-track"><div className="progress-fill" style={{width: `${curso.progresso}%`}}></div></div>
                      <span className="progress-text">{curso.progresso}%</span>
                    </div>
                  </div>
                  <div className="curso-action">
                    {curso.status === 'Concluído' ? '📜 Certificado' : '▶️ Continuar'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}