import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { ref, push, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import Logo from '../components/Logo';
import './Helpdesk.css';

export default function Helpdesk() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Estado dos Chamados
  const [meusChamados, setMeusChamados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado do Formulário e Modais
  const [novoChamado, setNovoChamado] = useState({
    titulo: '',
    categoria: 'hardware', 
    prioridade: 'normal',
    descricao: ''
  });

  const [modalAberto, setModalAberto] = useState(false);
  
  // NOVO: Estado para o nosso alerta customizado
  const [alerta, setAlerta] = useState({ visivel: false, tipo: '', titulo: '', mensagem: '' });

  // 1. MONITORAR AUTH E BUSCAR CHAMADOS
  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        const chamadosRef = ref(db, 'solicitacoes/helpdesk');
        
        onValue(chamadosRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const lista = Object.entries(data)
              .map(([id, valor]) => ({ id, ...valor }))
              .filter(item => item.userId === currentUser.uid)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
            
            setMeusChamados(lista);
          } else {
            setMeusChamados([]);
          }
          setLoading(false);
        });

      } else {
        navigate('/');
      }
    });

    return () => authUnsubscribe();
  }, [navigate]);

  // 2. ENVIAR NOVO CHAMADO
  const handleAbrirChamado = async (e) => {
    e.preventDefault();
    if (!novoChamado.titulo.trim() || !user) return;

    try {
      const chamadosRef = ref(db, 'solicitacoes/helpdesk');
      const protocolo = `HD-${new Date().getFullYear()}${Math.floor(Math.random() * 10000)}`;
      
      await push(chamadosRef, {
        ...novoChamado,
        protocolo,
        userId: user.uid,
        userEmail: user.email,
        nome: user.displayName || 'Colaborador', 
        status: 'pendente', 
        createdAt: new Date().toISOString(),
        respostas: [] 
      });

      // NOVO: Abre o modal de Sucesso no lugar do 'alert()'
      setAlerta({
        visivel: true,
        tipo: 'sucesso',
        titulo: 'Chamado Aberto!',
        mensagem: `Seu chamado (${protocolo}) foi registrado com sucesso e já está na fila de atendimento.`
      });
      
      setNovoChamado({ titulo: '', categoria: 'hardware', prioridade: 'normal', descricao: '' });
      setModalAberto(false);

    } catch (error) {
      console.error("Erro ao abrir chamado:", error);
      
      // NOVO: Abre o modal de Erro no lugar do 'alert()'
      setAlerta({
        visivel: true,
        tipo: 'erro',
        titulo: 'Oops, algo deu errado',
        mensagem: 'Não foi possível conectar com o servidor. Tente novamente mais tarde.'
      });
    }
  };

  // Cores e Ícones por Status
  const getStatusInfo = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s === 'pendente' || s === 'aberto') return { label: 'Aberto', cor: 'var(--neon-blue)', icon: '🆕' };
    if (s === 'aprovado' || s === 'em_andamento') return { label: 'Em Atendimento', cor: 'var(--neon-purple)', icon: '⚙️' };
    if (s === 'concluido' || s === 'resolvido') return { label: 'Resolvido', cor: 'var(--neon-green)', icon: '✅' };
    if (s === 'cancelado' || s === 'rejeitado') return { label: 'Fechado', cor: '#ef4444', icon: '✖' };
    return { label: status, cor: '#ccc', icon: '❓' };
  };

  return (
    <div className="tech-layout-helpdesk">
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>

      <header className="tech-header-glass">
        <div className="header-left">
           <div style={{transform: 'scale(0.8)'}}><Logo /></div>
           <span className="divider">|</span>
           <span className="page-title">Suporte Técnico</span>
        </div>
        <button className="tech-back-btn" onClick={() => navigate('/dashboard')}>
          Voltar ao Menu ↩
        </button>
      </header>

      <div className="helpdesk-container">
        
        <div className="page-header-row">
          <div className="text-group">
            <h2>Meus Chamados</h2>
            <p>Gerencie suas solicitações de suporte e TI.</p>
          </div>
          <button className="btn-new-ticket" onClick={() => setModalAberto(true)}>
            + Abrir Chamado
          </button>
        </div>

        {/* LISTAGEM */}
        <div className="tickets-grid">
          {loading ? (
             <p className="loading-text">Carregando seus chamados...</p>
          ) : meusChamados.length === 0 ? (
             <div className="empty-state-hd">
                <span style={{fontSize:'3rem'}}>🎧</span>
                <p>Nenhum chamado aberto. Tudo funcionando!</p>
             </div>
          ) : (
             meusChamados.map(ticket => {
               const statusInfo = getStatusInfo(ticket.status);
               return (
                 <div key={ticket.id} className="ticket-card" style={{borderLeft: `4px solid ${statusInfo.cor}`}}>
                   <div className="ticket-header">
                     <span className="protocolo">{ticket.protocolo}</span>
                     <span className="date">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                   </div>
                   
                   <h3 className="ticket-title">{ticket.titulo}</h3>
                   
                   <div className="ticket-tags">
                      <span className="tag-cat">{ticket.categoria.toUpperCase()}</span>
                      <span className={`tag-prio ${ticket.prioridade}`}>{ticket.prioridade}</span>
                   </div>

                   <p className="ticket-desc">
                     {ticket.descricao || 'Sem descrição.'}
                   </p>

                   <div className="ticket-footer">
                     <div className="status-badge-hd" style={{color: statusInfo.cor, borderColor: statusInfo.cor}}>
                        {statusInfo.icon} {statusInfo.label}
                     </div>
                   </div>
                 </div>
               );
             })
          )}
        </div>

      </div>

      {/* MODAL DE NOVO CHAMADO */}
      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-content-hd" onClick={e => e.stopPropagation()}>
            <div className="modal-header-hd">
              <h3>Novo Chamado de Suporte</h3>
              <button className="close-btn" onClick={() => setModalAberto(false)}>✖</button>
            </div>
            
            <form onSubmit={handleAbrirChamado}>
              <div className="form-group-hd">
                <label>Assunto Resumido</label>
                <input 
                  type="text" 
                  placeholder="Ex: Monitor não liga..." 
                  value={novoChamado.titulo}
                  onChange={(e) => setNovoChamado({...novoChamado, titulo: e.target.value})}
                  required
                />
              </div>

              <div className="form-row-hd">
                <div className="form-group-hd">
                  <label>Categoria</label>
                  <select 
                    value={novoChamado.categoria}
                    onChange={(e) => setNovoChamado({...novoChamado, categoria: e.target.value})}
                  >
                    <option value="hardware">Hardware / Equipamento</option>
                    <option value="software">Software / Programas</option>
                    <option value="rede">Internet / Rede</option>
                    <option value="acesso">Login / Senha</option>
                    <option value="impressora">Impressoras</option>
                  </select>
                </div>

                <div className="form-group-hd">
                  <label>Prioridade</label>
                  <select 
                    value={novoChamado.prioridade}
                    onChange={(e) => setNovoChamado({...novoChamado, prioridade: e.target.value})}
                  >
                    <option value="baixa">Baixa (Pode esperar)</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta (Urgente)</option>
                    <option value="critica">Crítica (Parou tudo)</option>
                  </select>
                </div>
              </div>

              <div className="form-group-hd">
                <label>Descrição Detalhada</label>
                <textarea 
                  rows="5"
                  placeholder="Descreva o problema e se possível como reproduzi-lo..."
                  value={novoChamado.descricao}
                  onChange={(e) => setNovoChamado({...novoChamado, descricao: e.target.value})}
                  required
                ></textarea>
              </div>

              <div className="modal-actions-hd">
                <button type="button" className="btn-cancel" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn-submit-hd">Enviar Solicitação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOVO: MODAL DE ALERTA CUSTOMIZADO (Sucesso ou Erro) */}
      {alerta.visivel && (
        <div className="modal-overlay" onClick={() => setAlerta({ ...alerta, visivel: false })}>
          <div className="modal-content-hd alert-modal" onClick={e => e.stopPropagation()}>
            
            <div className={`alert-icon-box ${alerta.tipo}`}>
              {alerta.tipo === 'sucesso' ? '✓' : '✖'}
            </div>
            
            <h3 className="alert-title">{alerta.titulo}</h3>
            <p className="alert-msg">{alerta.mensagem}</p>
            
            <button className={`btn-alert ${alerta.tipo}`} onClick={() => setAlerta({ ...alerta, visivel: false })}>
              Entendi
            </button>
            
          </div>
        </div>
      )}

    </div>
  );
}