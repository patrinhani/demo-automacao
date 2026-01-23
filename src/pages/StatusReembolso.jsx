import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import Logo from '../components/Logo';
import './StatusReembolso.css';

export default function StatusReembolso() {
  const navigate = useNavigate();
  const location = useLocation();

  const [listaSolicitacoes, setListaSolicitacoes] = useState([]);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state && !solicitacaoSelecionada) {
      setSolicitacaoSelecionada(location.state);
    }

    const user = auth.currentUser;
    if (user) {
      const reembolsosRef = ref(db, 'reembolsos');
      const q = query(reembolsosRef, orderByChild('userId'), equalTo(user.uid));

      onValue(q, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const listaFormatada = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })).reverse();
          setListaSolicitacoes(listaFormatada);
        } else {
          setListaSolicitacoes([]);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [location.state]);

  const formatarValor = (val) => {
    if(!val) return 'R$ 0,00';
    return `R$ ${val}`;
  };

  // --- RENDERIZAÇÃO DA TELA DE DETALHES ---
  if (solicitacaoSelecionada) {
    const dados = solicitacaoSelecionada;

    // LÓGICA DE STATUS CORRIGIDA
    const isAnalise = dados.status === 'em_analise';
    const isAprovado = dados.status === 'aprovado';
    const isPago = dados.status === 'pago';

    return (
      <div className="tech-layout-status">
        <div className="ambient-light light-1"></div>
        <div className="ambient-light light-2"></div>

        <header className="tech-header-glass">
          <div className="header-left">
             <div style={{transform: 'scale(0.8)'}}><Logo /></div>
             <span className="divider">|</span>
             <span className="page-title">Detalhes do Pedido</span>
          </div>
          <button className="tech-back-btn" onClick={() => setSolicitacaoSelecionada(null)}>
            ↩ Voltar para Lista
          </button>
        </header>

        <div className="status-container-tech">
          <div className="status-card-glass">
            
            <div className="success-icon-tech">
              {isPago ? '💲' : '✓'}
            </div>
            
            <h2>Solicitação: {dados.protocolo}</h2>
            <div className="protocolo-tech">
               Status atual: <strong style={{textTransform: 'uppercase', color: 'var(--neon-blue)'}}>
                 {dados.status.replace('_', ' ')}
               </strong>
            </div>
            
            <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '30px 0'}} />

            <h3 style={{color: '#fff', marginBottom: '30px', fontSize: '1.2rem'}}>Acompanhamento</h3>
            
            <div className="timeline-tech">
              <div className="timeline-line-bg"></div>
              
              {/* Barra de Progresso Dinâmica */}
              <div className="timeline-line-fill" style={{
                width: isPago ? '100%' : isAprovado ? '75%' : '25%'
              }}></div>

              {/* ETAPA 1: ENVIADO (Sempre Concluído) */}
              <div className="timeline-step completed">
                <div className="step-circle">✓</div>
                <div>
                  <div className="step-label">Enviado</div>
                  <div className="step-sub">
                    {dados.data_criacao ? new Date(dados.data_criacao).toLocaleDateString() : 'Data'}
                  </div>
                </div>
              </div>

              {/* ETAPA 2: ANÁLISE */}
              {/* Se está em análise = Active. Se aprovado/pago = Completed */}
              <div className={`timeline-step ${isAnalise ? 'active' : 'completed'}`}>
                <div className="step-circle">2</div>
                <div>
                    <div className="step-label">Análise</div>
                    <div className="step-sub">RH</div>
                </div>
              </div>

              {/* ETAPA 3: APROVAÇÃO */}
              {/* Se em análise = Pending. Se aprovado/pago = Completed (AQUI ESTAVA O ERRO) */}
              <div className={`timeline-step ${(isAprovado || isPago) ? 'completed' : 'pending'}`}>
                <div className="step-circle">3</div>
                <div>
                    <div className="step-label">Aprovação</div>
                    <div className="step-sub">Gestor</div>
                </div>
              </div>

              {/* ETAPA 4: PAGAMENTO */}
              {/* Se pago = Completed. Se aprovado (esperando pgto) = Active. Resto = Pending */}
              <div className={`timeline-step ${isPago ? 'completed' : (isAprovado ? 'active' : 'pending')}`}>
                <div className="step-circle">4</div>
                <div>
                    <div className="step-label">Pagamento</div>
                    <div className="step-sub">Financeiro</div>
                </div>
              </div>

            </div>

            <div className="summary-box-tech">
              <span className="summary-title">Resumo</span>
              <div className="summary-row">
                <span>Motivo:</span>
                <strong style={{color: '#fff'}}>{dados.motivo}</strong>
              </div>
              <div className="summary-row">
                <span>Valor:</span>
                <strong style={{color: 'var(--neon-blue)'}}>{formatarValor(dados.valor)}</strong>
              </div>
            </div>

            <div className="actions-tech">
              <button className="btn-secondary-tech" onClick={() => setSolicitacaoSelecionada(null)}>
                Voltar
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO DA LISTA (Padrão) ---
  return (
    <div className="tech-layout-status">
      <div className="ambient-light light-1"></div>
      
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Meus Reembolsos</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="status-container-tech">
        <div className="page-header-tech">
          <h2>Histórico de Solicitações</h2>
          <p>Selecione um item para ver os detalhes</p>
        </div>

        {loading ? (
           <p style={{color: '#fff', textAlign: 'center'}}>Carregando...</p>
        ) : listaSolicitacoes.length === 0 ? (
           <div className="empty-state-tech">
             <p>Nenhuma solicitação encontrada.</p>
             <button className="btn-primary-tech" onClick={() => navigate('/solicitacao')}>
               + Nova Solicitação
             </button>
           </div>
        ) : (
          <div className="lista-cards-tech">
            {listaSolicitacoes.map((item) => (
              <div 
                key={item.id} 
                className="card-resumo-glass" 
                onClick={() => setSolicitacaoSelecionada(item)}
              >
                <div className="card-top">
                  <span className="protocolo-badge">{item.protocolo}</span>
                  <span className={`status-pill ${item.status}`}>
                    {item.status === 'em_analise' ? 'Em Análise' : item.status}
                  </span>
                </div>
                <div className="card-body">
                  <p><strong>Motivo:</strong> {item.motivo}</p>
                  <p><strong>Data:</strong> {new Date(item.data_despesa).toLocaleDateString()}</p>
                  <p className="valor-destaque">{formatarValor(item.valor)}</p>
                </div>
                <div className="card-footer">
                  <span>Clique para detalhes →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}