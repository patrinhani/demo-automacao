import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { db, auth } from '../firebase';
import { ref, push, get, onValue } from 'firebase/database'; // Adicionado onValue
import './Helpdesk.css';

export default function Helpdesk() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('meus_chamados');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});
  
  // Começa vazio, pois vamos buscar do banco
  const [chamados, setChamados] = useState([]);

  // 1. Busca dados do usuário (Nome/Cargo)
  useEffect(() => {
     const u = auth.currentUser;
     if(u) get(ref(db, `users/${u.uid}`)).then(s => s.exists() && setUserData(s.val()));
  }, []);

  // 2. Busca Chamados em Tempo Real (Escuta o Firebase)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const chamadosRef = ref(db, 'solicitacoes/helpdesk');
    
    // Ouve mudanças (onValue)
    const unsubscribe = onValue(chamadosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Converte objeto em array e filtra APENAS os meus
        const meusChamados = Object.entries(data)
          .map(([id, valor]) => ({ id, ...valor }))
          .filter(item => item.userId === user.uid);
        
        // Ordena do mais recente para o mais antigo
        meusChamados.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setChamados(meusChamados);
      } else {
        setChamados([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await push(ref(db, 'solicitacoes/helpdesk'), {
            userId: auth.currentUser.uid,
            solicitanteNome: userData.nome || 'Usuário',
            solicitanteCargo: userData.cargo || 'Cargo',
            ...novoChamado,
            status: 'pendente',
            createdAt: new Date().toISOString()
        });
        alert("✅ Chamado aberto com sucesso! A equipe de TI já foi notificada.");
        
        // Limpa o form
        setNovoChamado({ 
            assunto: '', categoria: '', prioridade: 'Média', descricao: '',
            ramal: '', localizacao: '', patrimonio: ''
        });
        setActiveTab('meus_chamados');
        
    } catch (error) {
        alert("Erro: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const [novoChamado, setNovoChamado] = useState({ 
    assunto: '', categoria: '', prioridade: 'Média', descricao: '',
    ramal: '', localizacao: '', patrimonio: ''
  });

  const handleInputChange = (e) => setNovoChamado({ ...novoChamado, [e.target.name]: e.target.value });

  // Helper de Cores
  const getPriorityColor = (prio) => {
    switch(prio) {
      case 'Alta': return 'var(--danger)';
      case 'Média': return 'var(--warning)';
      case 'Baixa': return 'var(--success)';
      default: return '#fff';
    }
  };

  // Helper de Data
  const formatarData = (dataIso) => {
    if (!dataIso) return '---';
    return new Date(dataIso).toLocaleDateString('pt-BR');
  };

  return (
    <div className="helpdesk-layout">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="helpdesk-header">
        <div className="brand" onClick={() => navigate('/dashboard')} style={{cursor:'pointer'}}>
          <div style={{transform:'scale(0.8)'}}><Logo/></div>
          <span style={{color:'#fff', marginLeft:'10px', fontWeight: 'bold', fontSize: '1.2rem'}}>Helpdesk</span>
        </div>
        <div className="tech-profile" onClick={()=>navigate('/dashboard')}>
          <span style={{color:'#94a3b8', fontSize:'0.9rem'}}>Voltar ao Menu ↩</span>
        </div>
      </header>

      <div className="helpdesk-scroll-content">
        
        <div className="page-header-tech">
          <h2>Central de Suporte TI</h2>
          <div className="breadcrumbs-tech">Serviços / Helpdesk / Chamados</div>
        </div>

        {/* TABS */}
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

        {/* LISTA DE CHAMADOS */}
        {activeTab === 'meus_chamados' && (
          <div className="tickets-container" style={{width: '100%', maxWidth: '1200px'}}>
            
            {chamados.length === 0 ? (
                // --- ESTADO VAZIO ---
                <div style={{
                    textAlign: 'center', 
                    padding: '60px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '16px', 
                    border: '1px dashed rgba(255,255,255,0.1)',
                    marginTop: '20px'
                }}>
                    <span style={{fontSize: '3rem', display: 'block', marginBottom: '15px'}}>🎫</span>
                    <h3 style={{color: '#fff', margin: '0 0 10px 0'}}>Nenhum chamado solicitado ainda</h3>
                    <p style={{color: '#94a3b8'}}>Seus tickets de suporte aparecerão aqui.</p>
                    <button 
                        onClick={() => setActiveTab('novo_chamado')}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: 'var(--neon-blue)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Abrir meu primeiro chamado
                    </button>
                </div>
            ) : (
                // --- GRID DE TICKETS ---
                <div className="tickets-grid-tech" style={{animation: 'fadeIn 0.5s'}}>
                    {chamados.map((ticket) => (
                    <div key={ticket.id} className="ticket-card-glass">
                        <div className={`status-badge-neon ${ticket.status ? ticket.status.toLowerCase().replace(' ', '-') : 'pendente'}`}>
                        {ticket.status ? ticket.status.toUpperCase() : 'PENDENTE'}
                        </div>
                        
                        <div className="ticket-glass-header">
                        <span className="ticket-id-tech">#{ticket.id.slice(-6).toUpperCase()}</span>
                        <span className="ticket-date-tech">{formatarData(ticket.createdAt)}</span>
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
          </div>
        )}

        {/* FORMULÁRIO */}
        {activeTab === 'novo_chamado' && (
          <div className="form-glass-container" style={{animation: 'fadeIn 0.5s'}}>
            <h3 className="neon-title">Novo Chamado Técnico</h3>
            
            <form onSubmit={handleSubmit}>
                <div className="form-row-tech">
                    <div className="form-group-tech" style={{flex: 2}}>
                        <label>Assunto / Título *</label>
                        <input className="glass-input" name="assunto" value={novoChamado.assunto} onChange={handleInputChange} placeholder="Ex: Monitor não liga" required />
                    </div>
                    <div className="form-group-tech" style={{flex: 1}}>
                        <label>Categoria *</label>
                        <select className="glass-input" name="categoria" value={novoChamado.categoria} onChange={handleInputChange} required>
                            <option value="">Selecione...</option>
                            <option value="Hardware">Hardware / Periféricos</option>
                            <option value="Software">Software / Instalação</option>
                            <option value="Acesso">Acesso / Senhas</option>
                            <option value="Rede">Rede / Internet</option>
                            <option value="Impressora">Impressoras</option>
                        </select>
                    </div>
                </div>

                <div className="form-row-tech">
                    <div className="form-group-tech">
                        <label>Ramal ou Celular *</label>
                        <input className="glass-input" name="ramal" value={novoChamado.ramal} onChange={handleInputChange} placeholder="Ex: 4002" required />
                    </div>
                    <div className="form-group-tech">
                        <label>Sua Localização *</label>
                        <input className="glass-input" name="localizacao" value={novoChamado.localizacao} onChange={handleInputChange} placeholder="Ex: Mesa 12 - 2º Andar" required />
                    </div>
                </div>

                <div className="form-row-tech">
                    <div className="form-group-tech">
                        <label>Patrimônio (Se houver)</label>
                        <input className="glass-input" name="patrimonio" value={novoChamado.patrimonio} onChange={handleInputChange} placeholder="Ex: NTB-0043" />
                    </div>
                    <div className="form-group-tech">
                        <label>Nível de Urgência</label>
                        <select className="glass-input" name="prioridade" value={novoChamado.prioridade} onChange={handleInputChange}>
                            <option value="Baixa">🟢 Baixa</option>
                            <option value="Média">🟡 Média</option>
                            <option value="Alta">🔴 Alta</option>
                        </select>
                    </div>
                </div>

                <div className="form-group-tech">
                    <label>Descrição Detalhada do Problema *</label>
                    <textarea 
                        className="glass-input" 
                        name="descricao" 
                        value={novoChamado.descricao} 
                        onChange={handleInputChange} 
                        rows="5" 
                        placeholder="Descreva o passo a passo do erro ou o que você precisa..." 
                        required 
                    ></textarea>
                </div>

                <div className="form-actions-tech">
                    <button type="button" className="btn-glass-cancel" onClick={() => setActiveTab('meus_chamados')}>Cancelar</button>
                    <button type="submit" className="btn-neon-submit" disabled={loading}>
                        {loading ? 'Enviando...' : '🚀 Abrir Chamado'}
                    </button>
                </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}