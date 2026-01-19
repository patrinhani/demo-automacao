import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './StatusReembolso.css'; // Importa o novo CSS

export default function StatusReembolso() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Pega os dados que vieram do formulário (ou usa dados fake se acessar direto)
  const dados = location.state || { 
    protocolo: 'REQ-2024-9999', 
    valor: '0,00', 
    data: new Date().toLocaleDateString() 
  };

  return (
    <div className="tech-layout-status">
      
      {/* LUZES DE FUNDO */}
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      {/* HEADER TECH */}
      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Status da Solicitação</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="status-container-tech">
        
        <div className="status-card-glass">
          
          {/* ÍCONE DE SUCESSO PULSANTE */}
          <div className="success-icon-tech">
            ✓
          </div>
          
          <h2>Solicitação Enviada!</h2>
          <div className="protocolo-tech">
            Protocolo: <strong>{dados.protocolo}</strong>
          </div>

          <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '30px 0'}} />

          {/* LINHA DO TEMPO TECH */}
          <h3 style={{color: '#fff', marginBottom: '30px', fontSize: '1.2rem'}}>Acompanhamento</h3>
          
          <div className="timeline-tech">
            {/* Linha de Fundo e Preenchimento */}
            <div className="timeline-line-bg"></div>
            <div className="timeline-line-fill"></div>

            {/* ETAPA 1: ENVIADO (Concluído) */}
            <div className="timeline-step completed">
              <div className="step-circle">✓</div>
              <div>
                <div className="step-label">Enviado</div>
                <div className="step-sub">{dados.data}</div>
              </div>
            </div>

            {/* ETAPA 2: EM ANÁLISE (Ativo/Pulsando) */}
            <div className="timeline-step active">
              <div className="step-circle">2</div>
              <div>
                <div className="step-label" style={{color: 'var(--neon-orange)'}}>Em Análise</div>
                <div className="step-sub">RH / Fin.</div>
              </div>
            </div>

            {/* ETAPA 3: APROVAÇÃO (Pendente) */}
            <div className="timeline-step pending">
              <div className="step-circle">3</div>
              <div>
                <div className="step-label">Aprovação</div>
                <div className="step-sub">Gestor</div>
              </div>
            </div>

            {/* ETAPA 4: PAGAMENTO (Pendente) */}
            <div className="timeline-step pending">
              <div className="step-circle">4</div>
              <div>
                <div className="step-label">Pagamento</div>
                <div className="step-sub">Depósito</div>
              </div>
            </div>
          </div>

          {/* CARD DE RESUMO */}
          <div className="summary-box-tech">
            <span className="summary-title">Resumo do Pedido</span>
            
            <div className="summary-row">
              <span>Valor Declarado</span>
              <strong style={{color: '#fff'}}>R$ {dados.valor}</strong>
            </div>
            
            <div className="summary-row">
              <span>Status Atual</span>
              <span className="status-badge-tech">Aguardando Análise</span>
            </div>
            
            <p className="info-text">
              O prazo médio para análise é de 5 dias úteis. Você receberá uma notificação por e-mail a cada atualização.
            </p>
          </div>

          <div className="actions-tech">
            <button className="btn-secondary-tech" onClick={() => navigate('/dashboard')}>
              Voltar ao Menu
            </button>
            <button className="btn-primary-tech" onClick={() => navigate('/solicitacao')}>
              Nova Solicitação
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}