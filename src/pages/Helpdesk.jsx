import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Helpdesk.css'; // CSS Novo

export default function Helpdesk() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('meus_chamados'); // 'meus_chamados' | 'novo_chamado'
  const [loading, setLoading] = useState(false);

  // Mock de Chamados
  const [chamados, setChamados] = useState([
    { 
      id: 'REQ-2024-001', 
      assunto: 'Erro no SAP', 
      categoria: 'Software', 
      prioridade: 'Alta', 
      status: 'EM ANDAMENTO', 
      data: '2024-10-10' 
    },
    { 
      id: 'REQ-2024-002', 
      assunto: 'Solicitação de Monitor', 
      categoria: 'Hardware', 
      prioridade: 'Média', 
      status: 'PENDENTE', 
      data: '2024-10-12' 
    },
    { 
      id: 'REQ-2024-003', 
      assunto: 'Reset de Senha', 
      categoria: 'Acesso', 
      prioridade: 'Baixa', 
      status: 'CONCLUÍDO', 
      data: '2024-10-05' 
    }
  ]);

  const [novoChamado, setNovoChamado] = useState({
    assunto: '',
    categoria: '',
    prioridade: 'Média',
    descricao: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoChamado({ ...novoChamado, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simula envio
    setTimeout(() => {
      const ticket = {
        id: `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        ...novoChamado,
        status: 'PENDENTE',
        data: new Date().toLocaleDateString('pt-BR')
      };

      setChamados([ticket, ...chamados]);
      setLoading(false);
      alert('Chamado aberto com sucesso!');
      setNovoChamado({ assunto: '', categoria: '', prioridade: 'Média', descricao: '' });
      setActiveTab('meus_chamados');
    }, 1000);
  };

  // Helper para cor da prioridade
  const getPriorityColor = (prio) => {
    switch(prio) {
      case 'Alta': return 'var(--danger)'; // Vermelho
      case 'Média': return 'var(--warning)'; // Amarelo
      case 'Baixa': return 'var(--success)'; // Verde
      default: return '#fff';
    }
  };

  return (
    <div className="tech-layout">
      {/* LUZES DE FUNDO */}
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
      <div className="ambient-light light-3"></div>

      <div className="tech-main">
        {/* HEADER TECH */}
        <header className="tech-header">
          <div className="brand" onClick={() => navigate('/dashboard')} style={{cursor:'pointer'}}>
            <Logo /> <span style={{color:'white', marginLeft:'10px'}}>Helpdesk</span>
          </div>
          <div className="tech-profile" onClick={() => navigate('/dashboard')}>
            <span style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>Voltar ao Menu ↩</span>
          </div>
        </header>

        <div className="tech-scroll-content">
          <div className="page-header-tech">
            <h2>Central de Suporte TI</h2>
            <div className="breadcrumbs-tech">Serviços / Helpdesk / Chamados</div>
          </div>

          {/* TABS DE NAVEGAÇÃO */}
          <div className="helpdesk-tabs-glass">
            <button 
              className={`tab-glass-btn ${activeTab === 'meus_chamados' ? 'active' : ''}`}
              onClick={() => setActiveTab('meus_chamados')}
            >
              📂 Meus Chamados
            </button>
            <button 
              className={`tab-glass-btn ${activeTab === 'novo_chamado' ? 'active' : ''}`}
              onClick={() => setActiveTab('novo_chamado')}
            >
              🎧 Novo Chamado
            </button>
          </div>

          {/* === LISTA DE CHAMADOS === */}
          {activeTab === 'meus_chamados' && (
            <div className="tickets-grid-tech" style={{animation: 'fadeIn 0.5s'}}>
              {chamados.map((ticket) => (
                <div key={ticket.id} className="ticket-card-glass">
                  <div className={`status-badge-neon ${ticket.status.toLowerCase().replace(' ', '-')}`}>
                    {ticket.status}
                  </div>
                  
                  <div className="ticket-glass-header">
                    <span className="ticket-id-tech">{ticket.id}</span>
                    <span className="ticket-date-tech">{ticket.data}</span>
                  </div>

                  <div className="ticket-glass-body">
                    <h3 className="ticket-subject">{ticket.assunto}</h3>
                    
                    <div className="ticket-meta-row">
                      <div className="meta-item">
                        <span className="meta-label">Categoria</span>
                        <span className="meta-value">{ticket.categoria}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Prioridade</span>
                        <span className="meta-value" style={{color: getPriorityColor(ticket.prioridade)}}>
                          {ticket.prioridade}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ticket-glass-footer">
                    <button className="btn-glass-sm">Ver Detalhes</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* === FORMULÁRIO DE NOVO CHAMADO === */}
          {activeTab === 'novo_chamado' && (
            <div className="form-glass-container" style={{animation: 'fadeIn 0.5s'}}>
              <h3 className="neon-title">Abertura de Chamado</h3>
              
              <form onSubmit={handleSubmit} className="glass-form">
                <div className="form-row-tech">
                  <div className="form-group-tech" style={{flex: 2}}>
                    <label>Assunto</label>
                    <input 
                      className="glass-input"
                      name="assunto" 
                      value={novoChamado.assunto} 
                      onChange={handleInputChange} 
                      placeholder="Resumo do problema..." 
                      required 
                    />
                  </div>
                  <div className="form-group-tech" style={{flex: 1}}>
                    <label>Categoria</label>
                    <select 
                      className="glass-input"
                      name="categoria" 
                      value={novoChamado.categoria} 
                      onChange={handleInputChange} 
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="Hardware">Hardware (Computador/Periféricos)</option>
                      <option value="Software">Software / Sistemas</option>
                      <option value="Acesso">Acesso / Senhas</option>
                      <option value="Rede">Internet / Rede</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-tech">
                  <div className="form-group-tech">
                    <label>Prioridade</label>
                    <select 
                      className="glass-input"
                      name="prioridade" 
                      value={novoChamado.prioridade} 
                      onChange={handleInputChange}
                    >
                      <option value="Baixa">🟢 Baixa (Não urgente)</option>
                      <option value="Média">🟡 Média (Impacto parcial)</option>
                      <option value="Alta">🔴 Alta (Sistema parado)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-tech">
                  <label>Descrição Detalhada</label>
                  <textarea 
                    className="glass-input"
                    name="descricao" 
                    value={novoChamado.descricao} 
                    onChange={handleInputChange} 
                    rows="5" 
                    placeholder="Descreva o erro ou solicitação com detalhes..." 
                    required
                  ></textarea>
                </div>

                <div className="form-actions-tech">
                  <button type="button" className="btn-glass-cancel" onClick={() => setActiveTab('meus_chamados')}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-neon-submit" disabled={loading}>
                    {loading ? 'Enviando...' : '🚀 Abrir Chamado'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}