import { useState, useEffect } from 'react'; // <--- Adicionado useEffect
import { useNavigate } from 'react-router-dom';
import { getAuth } from "firebase/auth"; // <--- Import do Auth
import { ref, onValue } from "firebase/database"; // <--- Imports do Database
import { db } from '../firebase'; // <--- Import da conexão
import Logo from '../components/Logo';
import './Carreira.css';

export default function Carreira() {
  const navigate = useNavigate();
  const auth = getAuth(); // <--- Inicializa Auth

  // --- 1. INTEGRAÇÃO: ESTADO DO USUÁRIO ---
  const [user, setUser] = useState(null);

  // --- 2. INTEGRAÇÃO: BUSCAR DADOS NO BANCO ---
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // Se não estiver logado, o ideal seria redirecionar, 
      // mas vamos manter na página para não quebrar o fluxo se for teste
      return; 
    }

    // Busca os dados na pasta 'users/UID' igual ao Plano de Saúde
    const userRef = ref(db, `users/${currentUser.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUser({ ...data, uid: currentUser.uid });
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const [abaAtiva, setAbaAtiva] = useState('vagas'); 
  
  // Controle de Modais
  const [modalAberto, setModalAberto] = useState(null); 
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
        faseAtual: 2, 
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
      categoria: 'Técnico', 
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
    <div className="tech-layout-carreira">
      
      {/* LUZES DE FUNDO */}
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      {/* HEADER PADRONIZADO (FIXED) */}
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Plano de Carreira</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="carreira-container-tech">
        <div className="page-header-tech">
          <h2>Desenvolvimento Profissional</h2>
          <p>Gerencie suas candidaturas e capacitação técnica.</p>
        </div>

        <div className="tabs-tech">
          <button 
            className={`tab-btn-tech ${abaAtiva === 'vagas' ? 'active' : ''}`} 
            onClick={() => setAbaAtiva('vagas')}
          >
            💼 Vagas Internas
          </button>
          <button 
            className={`tab-btn-tech ${abaAtiva === 'cursos' ? 'active' : ''}`} 
            onClick={() => setAbaAtiva('cursos')}
          >
            🎓 Universidade Corporativa
          </button>
        </div>

        {/* LISTAGEM DE VAGAS */}
        {abaAtiva === 'vagas' && (
          <div className="vagas-grid-tech">
            {vagas.map(vaga => (
              <div key={vaga.id} className={`vaga-card-tech ${vaga.aplicado ? 'aplicada' : ''}`}>
                <div className="vaga-header">
                  <span className="vaga-tag">{vaga.area}</span>
                  {vaga.aplicado && <span className="status-aplicado">✔ Enviado</span>}
                </div>
                <h3>{vaga.titulo}</h3>
                <p className="vaga-local">📍 {vaga.local}</p>
                
                <div className="vaga-reqs-tech">
                  <strong>Requisitos:</strong>
                  <ul>{vaga.requisitos.map((req, i) => <li key={i}>{req}</li>)}</ul>
                </div>

                <button 
                  className={`btn-vaga-tech ${vaga.aplicado ? 'ver-status' : ''}`} 
                  onClick={() => vaga.aplicado ? abrirTracking(vaga) : handleAplicar(vaga.id)}
                >
                  {vaga.aplicado ? 'Acompanhar Processo 👁️' : 'Candidatar-se Agora'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* LISTAGEM DE CURSOS */}
        {abaAtiva === 'cursos' && (
          <div className="cursos-list">
             <div className="learning-stats-tech">
              <div className="stat-box-tech available"><strong>{cursos.length}</strong> <span>Disponíveis</span></div>
              <div className="stat-box-tech completed"><strong>{cursos.filter(c=>c.status==='Concluído').length}</strong> <span>Concluídos</span></div>
            </div>

            <div className="cursos-grid-tech">
              {cursos.map(curso => (
                <div key={curso.id} className="curso-card-tech" onClick={() => handleCurso(curso)}>
                  <div className="curso-icon">{curso.capa}</div>
                  <div className="curso-info">
                    <span className={`curso-cat-tech ${curso.categoria.toLowerCase()}`}>{curso.categoria}</span>
                    <h4>{curso.titulo}</h4>
                    <div className="progress-wrapper">
                      <div className="progress-track"><div className="progress-fill" style={{width: `${curso.progresso}%`}}></div></div>
                      <span className="progress-text">{curso.progresso}%</span>
                    </div>
                  </div>
                  <div className="curso-action">
                    {curso.status === 'Concluído' ? '📜' : '▶️'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL DE ACOMPANHAMENTO (TRACKING) --- */}
      {modalAberto === 'tracking' && itemSelecionado && (
        <div className="modal-overlay-tech" onClick={fecharModal}>
          <div className="modal-content-tech" onClick={e => e.stopPropagation()}>
            <div className="modal-header-tech">
              <h3>Status da Candidatura</h3>
              <button className="close-btn-tech" onClick={fecharModal}>×</button>
            </div>
            
            <div className="tracking-body">
              <h4 style={{color: '#fff', margin: '0 0 5px 0'}}>{itemSelecionado.titulo}</h4>
              <p className="tracking-subtitle">Acompanhe as etapas do processo seletivo.</p>
              
              <div className="timeline-container">
                {['Candidatura', 'Triagem RH', 'Gestor', 'Proposta'].map((etapa, index) => (
                  <div key={index} className={`timeline-step ${index <= itemSelecionado.status.faseAtual ? 'active' : ''}`}>
                    <div className="step-circle">{index + 1}</div>
                    <div className="step-label">{etapa}</div>
                  </div>
                ))}
                <div className="progress-line-bg">
                  <div className="progress-line-fill" style={{width: `${itemSelecionado.status.faseAtual * 33}%`}}></div>
                </div>
              </div>

              <div className="history-logs-tech">
                <h5>Histórico de Atualizações</h5>
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
        <div className="modal-overlay-tech" onClick={fecharModal}>
          <div className="modal-content-tech" style={{maxWidth: '800px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header-tech">
              <h3>Certificado Digital</h3>
              <button className="close-btn-tech" onClick={fecharModal}>×</button>
            </div>

            <div className="certificate-modal-wrapper">
              <div className="certificate-paper">
                <div className="certificate-border">
                  <div className="cert-header">
                    <div style={{transform: 'scale(1.2)', marginBottom: '10px'}}><Logo lightMode={true} /></div>
                    <h1>CERTIFICADO DE CONCLUSÃO</h1>
                  </div>
                  
                  <div className="cert-body">
                    <p>A TechCorp University certifica que</p>
                    
                    {/* --- 3. INTEGRAÇÃO: NOME DO BANCO --- */}
                    <h2 style={{textTransform: 'uppercase'}}>
                      {user ? user.nome : 'Carregando...'}
                    </h2>
                    
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
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions-tech">
              <button className="btn-secondary-tech" onClick={fecharModal}>Fechar</button>
              <button className="btn-primary-tech" onClick={() => window.print()}>🖨️ Imprimir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}